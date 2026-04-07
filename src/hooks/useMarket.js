'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { market, portfolio, orders, auth, connectWebSocket, subscribeWS, getToken, clearToken } from '../lib/api';

// ================================================================
// useAuth — gestion de l'état d'authentification
// ================================================================
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      // Valider le token en récupérant le portfolio
      portfolio.get()
        .then(() => setUser({ token }))
        .catch(() => clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await auth.login(email, password);
    setUser({ token: data.token, ...data.user });
    return data;
  }, []);

  const register = useCallback(async (email, password, username) => {
    return auth.register(email, password, username);
  }, []);

  const logout = useCallback(() => {
    auth.logout().catch(() => {});
    clearToken();
    setUser(null);
  }, []);

  return { user, loading, login, register, logout, isAuthenticated: !!user };
}

// ================================================================
// useMarket — données marché + WebSocket temps réel
// ================================================================
export function useMarket() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const teamsRef = useRef([]);

  const fetchTeams = useCallback(async () => {
    try {
      const data = await market.getTeams();
      setTeams(data);
      teamsRef.current = data;
      setLastUpdate(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();

    // Connexion WebSocket pour les mises à jour en temps réel
    connectWebSocket();

    const unsubscribe = subscribeWS((msg) => {
      if (msg.type === 'WS_CONNECTED') setWsConnected(true);
      if (msg.type === 'WS_DISCONNECTED') setWsConnected(false);

      if (msg.type === 'PRICE_UPDATE') {
        setTeams(prev => prev.map(t =>
          t.id === msg.teamId
            ? { ...t, price: msg.newPrice, lastChange: msg.pctChange, lastReason: msg.reason }
            : t
        ));
        setLastUpdate(new Date());
      }

      if (msg.type === 'CLINCH') {
        setTeams(prev => prev.map(t =>
          t.id === msg.teamId
            ? { ...t, price: msg.newPrice, stats: { ...t.stats, clinched: true } }
            : t
        ));
      }
    });

    // Fallback: refresh toutes les 60s si pas de WS
    const interval = setInterval(fetchTeams, 60_000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [fetchTeams]);

  return { teams, loading, error, wsConnected, lastUpdate, refresh: fetchTeams };
}

// ================================================================
// usePortfolio — données du portefeuille utilisateur
// ================================================================
export function usePortfolio(isAuthenticated) {
  const [data, setData] = useState(null);
  const [dividends, setDividends] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPortfolio = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [pf, divs] = await Promise.all([portfolio.get(), portfolio.dividends()]);
      setData(pf);
      setDividends(divs);
    } catch (e) {
      console.error('Portfolio fetch error:', e.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchPortfolio();

    // Mettre à jour le portfolio sur les dividendes reçus
    const unsubscribe = subscribeWS((msg) => {
      if (msg.type === 'PRICE_UPDATE' || msg.type === 'DIVIDEND_PAID') {
        fetchPortfolio();
      }
    });
    return unsubscribe;
  }, [fetchPortfolio]);

  return { data, dividends, loading, refresh: fetchPortfolio };
}

// ================================================================
// useOrders — gestion des ordres
// ================================================================
export function useOrders(isAuthenticated) {
  const [activeOrders, setActiveOrders] = useState([]);
  const [history, setHistory] = useState([]);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [active, hist] = await Promise.all([orders.mine(), orders.history()]);
      setActiveOrders(active);
      setHistory(hist);
    } catch {}
  }, [isAuthenticated]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const placeOrder = useCallback(async (params) => {
    const result = await orders.place(params);
    await fetchOrders();
    return result;
  }, [fetchOrders]);

  const cancelOrder = useCallback(async (id) => {
    await orders.cancel(id);
    await fetchOrders();
  }, [fetchOrders]);

  return { activeOrders, history, placeOrder, cancelOrder, refresh: fetchOrders };
}

// ================================================================
// useImpactLog — journal des impacts LNH
// ================================================================
export function useImpactLog() {
  const [log, setLog] = useState([]);

  useEffect(() => {
    market.getImpactLog().then(setLog).catch(() => {});

    const unsubscribe = subscribeWS((msg) => {
      if (msg.type === 'PRICE_UPDATE') {
        setLog(prev => [{
          team_id: msg.teamId,
          description: msg.reason,
          pct_change: msg.pctChange,
          created_at: new Date().toISOString(),
          _live: true,
        }, ...prev].slice(0, 50));
      }
    });
    return unsubscribe;
  }, []);

  return log;
}
