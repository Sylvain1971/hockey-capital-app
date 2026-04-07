'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { leagueMarket, leagues } from '../lib/leagueApi';
import { connectWebSocket, subscribeWS } from '../lib/api';

// ================================================================
// useLeagueMarket — prix + portfolio en temps réel pour une ligue
// ================================================================
export function useLeagueMarket(leagueId) {
  const [prices, setPrices]     = useState({});
  const [portfolio, setPortfolio] = useState(null);
  const [trades, setTrades]     = useState([]);
  const [impactLog, setImpactLog] = useState([]);
  const [dividends, setDividends] = useState([]);
  const [loading, setLoading]   = useState(true);
  const pricesRef = useRef({});

  const fetchAll = useCallback(async () => {
    if (!leagueId) return;
    try {
      const [p, pf, t, log, divs] = await Promise.all([
        leagueMarket.prices(leagueId),
        leagueMarket.portfolio(leagueId),
        leagueMarket.trades(leagueId),
        leagueMarket.impactLog(leagueId),
        leagueMarket.dividends(leagueId),
      ]);
      const priceMap = Object.fromEntries(p.map(x => [x.team_id, x]));
      setPrices(priceMap);
      pricesRef.current = priceMap;
      setPortfolio(pf);
      setTrades(t);
      setImpactLog(log);
      setDividends(divs);
    } catch (e) {
      console.error('League market fetch error:', e.message);
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    fetchAll();
    connectWebSocket();

    const unsub = subscribeWS((msg) => {
      if (msg.leagueId && msg.leagueId !== leagueId) return;

      if (msg.type === 'LEAGUE_PRICE_UPDATE') {
        setPrices(prev => ({
          ...prev,
          [msg.teamId]: { ...prev[msg.teamId], price: msg.newPrice, pct_change: msg.pctChange },
        }));
        setImpactLog(prev => [{
          team_id: msg.teamId,
          description: msg.reason,
          pct_change: msg.pctChange,
          created_at: new Date().toISOString(),
          _live: true,
        }, ...prev].slice(0, 50));
      }

      if (msg.type === 'LEAGUE_TRADE' || msg.type === 'DIVIDEND_PAID') {
        fetchAll();
      }
    });

    const interval = setInterval(fetchAll, 30_000);
    return () => { unsub(); clearInterval(interval); };
  }, [leagueId, fetchAll]);

  const buy = useCallback(async (teamId, qty, orderType = 'market', limitPrice) => {
    const result = await leagueMarket.buy(leagueId, teamId, qty, orderType, limitPrice);
    await fetchAll();
    return result;
  }, [leagueId, fetchAll]);

  const sell = useCallback(async (teamId, qty, orderType = 'market', limitPrice) => {
    const result = await leagueMarket.sell(leagueId, teamId, qty, orderType, limitPrice);
    await fetchAll();
    return result;
  }, [leagueId, fetchAll]);

  return { prices, portfolio, trades, impactLog, dividends, loading, buy, sell, refresh: fetchAll };
}

// ================================================================
// useLeagueSetup — état du wizard de création
// ================================================================
export function useLeagueSetup() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    // Étape 1
    name: '',
    players: 8,
    duration: 'week',
    draft: 'libre',
    mise: 20,
    capital: 25000,
    // Étape 2
    tradeLimit: 5,
    maxConc: 20,
    spread: 2.0,
    delay: 'none',
    dividendsEnabled: true,
    limitOrdersEnabled: true,
    shortEnabled: false,
    elimPenalty: true,
    // Étape 3
    prizeMode: 'top3',
    customPrize: [],
    bonusWeekly: false,
    bonusMid: false,
    bonusLast: false,
    // Étape 4 — algo (VERSION INITIALE)
    algo: {
      winReg: 4.0, winOT: 2.0, shutout: 3.0,
      lossReg: 3.0, lossOT: 1.0,
      m3: 1.5, m5: 2.0, m7: 3.0,
      r1: 1.5, r23: 0.5, r9: 1.0,
      divBase: 0.08, clinch: 12.0,
    },
  });

  const update = useCallback((patch) => {
    setConfig(prev => ({ ...prev, ...patch }));
  }, []);

  const updateAlgo = useCallback((patch) => {
    setConfig(prev => ({ ...prev, algo: { ...prev.algo, ...patch } }));
  }, []);

  // Calculs dérivés
  const derived = {
    cagnotteBrute:  config.players * config.mise,
    cagnotteFee:    Math.round(config.players * config.mise * 0.05),
    cagnotteNette:  Math.round(config.players * config.mise * 0.95),
    maxActionsPerTeam: Math.round(config.capital * config.maxConc / 100 / 5),
    maxInvestPerTeam:  Math.round(config.capital * config.maxConc / 100),
    spreadDollar:   parseFloat((5 * config.spread / 200).toFixed(2)),
    ammBid:         parseFloat((5 * (1 - config.spread / 200)).toFixed(2)),
    ammAsk:         parseFloat((5 * (1 + config.spread / 200)).toFixed(2)),
  };

  return { step, setStep, config, update, updateAlgo, derived };
}

// ================================================================
// useLeaderboard — classement d'une ligue
// ================================================================
export function useLeaderboard(leagueId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leagueId) return;
    leagues.leaderboard(leagueId).then(setData).catch(console.error).finally(() => setLoading(false));
    const interval = setInterval(() => leagues.leaderboard(leagueId).then(setData).catch(() => {}), 15_000);
    return () => clearInterval(interval);
  }, [leagueId]);

  return { data, loading };
}
