'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const TEAM_COLORS = {
  MTL:'#AF1E2D',BOS:'#B8922A',TOR:'#00205B',TBL:'#002868',FLA:'#041E42',OTT:'#C52032',
  NYR:'#0038A8',CAR:'#CC0000',WSH:'#041E42',PIT:'#444',COL:'#6F263D',DAL:'#006847',
  WPG:'#041E42',MIN:'#154734',VGK:'#B4975A',EDM:'#FF4C00',VAN:'#00843D',LAK:'#333',
};

const TEAMS = [
  {id:'MTL',name:'Canadiens',div:'Atlantique'},{id:'BOS',name:'Bruins',div:'Atlantique'},
  {id:'TOR',name:'Maple Leafs',div:'Atlantique'},{id:'TBL',name:'Lightning',div:'Atlantique'},
  {id:'FLA',name:'Panthers',div:'Atlantique'},{id:'OTT',name:'Sénateurs',div:'Atlantique'},
  {id:'NYR',name:'Rangers',div:'Métro.'},{id:'CAR',name:'Hurricanes',div:'Métro.'},
  {id:'WSH',name:'Capitals',div:'Métro.'},{id:'PIT',name:'Penguins',div:'Métro.'},
  {id:'COL',name:'Avalanche',div:'Centrale'},{id:'DAL',name:'Stars',div:'Centrale'},
  {id:'WPG',name:'Jets',div:'Centrale'},{id:'MIN',name:'Wild',div:'Centrale'},
  {id:'VGK',name:'Golden Knights',div:'Pacifique'},{id:'EDM',name:'Oilers',div:'Pacifique'},
  {id:'VAN',name:'Canucks',div:'Pacifique'},{id:'LAK',name:'Kings',div:'Pacifique'},
];

function SparkSVG({ history, up }) {
  const h = history.slice(-8);
  const mn = Math.min(...h), mx = Math.max(...h), rng = mx - mn || 0.01;
  const pts = h.map((v, i) => `${i * (48 / (h.length - 1))},${16 - ((v - mn) / rng) * 14}`).join(' ');
  return (
    <svg viewBox="0 0 48 18" width="52" height="20">
      <polyline points={pts} fill="none" stroke={up ? '#27ae60' : '#c0392b'} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function TeamLogo({ id, size = 24 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: TEAM_COLORS[id] || '#888',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 500, color: '#fff', flexShrink: 0,
    }}>{id}</div>
  );
}

function TradeModal({ team, prices, myHoldings, cash, onBuy, onSell, onClose }) {
  const [qty, setQty] = useState(1);
  const [side, setSide] = useState('buy');
  const [orderType, setOrderType] = useState('market');
  const [limitPrice, setLimitPrice] = useState('');
  const price = prices[team?.id]?.price || 5;
  const maxBuy = Math.floor(cash / price);
  const maxSell = myHoldings[team?.id] || 0;
  const total = qty * (orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : price);

  if (!team) return null;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'var(--color-background-primary)', borderRadius:12, border:'0.5px solid var(--color-border-tertiary)', padding:'1.5rem', width:390, maxWidth:'95vw' }}>
        <div style={{ fontSize:16, fontWeight:500, marginBottom:14 }}>{side === 'buy' ? 'Acheter' : 'Vendre'} — {team.id}</div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <TeamLogo id={team.id} size={36} />
          <div>
            <div style={{ fontWeight:500 }}>{team.name}</div>
            <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>Prix actuel: {'price.toFixed(2)}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          <button onClick={() => setSide('buy')} style={{ flex:1, padding:'7px', borderRadius:7, border:'none', background: side === 'buy' ? '#c0392b' : 'var(--color-background-secondary)', color: side === 'buy' ? '#fff' : 'var(--color-text-primary)', cursor:'pointer', fontSize:13, fontWeight:500 }}>Acheter</button>
          <button onClick={() => setSide('sell')} disabled={maxSell === 0} style={{ flex:1, padding:'7px', borderRadius:7, border:'none', background: side === 'sell' ? '#1a5276' : 'var(--color-background-secondary)', color: side === 'sell' ? '#fff' : 'var(--color-text-primary)', cursor:'pointer', fontSize:13, fontWeight:500, opacity: maxSell === 0 ? 0.4 : 1 }}>Vendre</button>
        </div>
        {[
          { label:'Prix actuel', val:`$${price.toFixed(2)}` },
          { label: side === 'buy' ? 'Max achetable' : 'Actions détenues', val: side === 'buy' ? `${maxBuy.toLocaleString('fr-CA')} actions` : `${maxSell.toLocaleString('fr-CA')} actions` },
          { label:'Vos liquidités', val:`$${cash.toFixed(2)}` },
        ].map(({ label, val }) => (
          <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'5px 0', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
            <span style={{ color:'var(--color-text-secondary)' }}>{label}</span><span>{val}</span>
          </div>
        ))}
        <div style={{ marginTop:14, marginBottom:10 }}>
          <label style={{ fontSize:12, color:'var(--color-text-secondary)', display:'block', marginBottom:5 }}>Type d'ordre</label>
          <select value={orderType} onChange={e => setOrderType(e.target.value)}
            style={{ width:'100%', padding:'7px 10px', border:'0.5px solid var(--color-border-secondary)', borderRadius:8, background:'var(--color-background-primary)', color:'var(--color-text-primary)', fontSize:13 }}>
            <option value="market">Au marché (immédiat)</option>
            <option value="limit">Ordre limité</option>
          </select>
        </div>
        {orderType === 'limit' && (
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:12, color:'var(--color-text-secondary)', display:'block', marginBottom:5 }}>Prix limite ($)</label>
            <input type="number" step="0.01" placeholder={price.toFixed(2)} value={limitPrice} onChange={e => setLimitPrice(e.target.value)}
              style={{ width:'100%', padding:'7px 10px', border:'0.5px solid var(--color-border-secondary)', borderRadius:8, background:'var(--color-background-primary)', color:'var(--color-text-primary)', fontSize:13 }} />
          </div>
        )}
        <div style={{ marginBottom:10 }}>
          <label style={{ fontSize:12, color:'var(--color-text-secondary)', display:'block', marginBottom:5 }}>Quantité</label>
          <input type="number" min={1} max={side === 'buy' ? maxBuy : maxSell} value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            style={{ width:'100%', padding:'7px 10px', border:'0.5px solid var(--color-border-secondary)', borderRadius:8, background:'var(--color-background-primary)', color:'var(--color-text-primary)', fontSize:13 }} />
        </div>
        <div style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'8px 12px', marginBottom:14, display:'flex', justifyContent:'space-between', fontSize:13 }}>
          <span style={{ color:'var(--color-text-secondary)' }}>Total estimé</span>
          <strong>${total.toFixed(2)}</strong>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:8, borderRadius:8, border:'0.5px solid var(--color-border-secondary)', background:'none', cursor:'pointer', fontSize:13, color:'var(--color-text-primary)' }}>Annuler</button>
          <button onClick={() => { side === 'buy' ? onBuy(team.id, qty, orderType, limitPrice ? parseFloat(limitPrice) : undefined) : onSell(team.id, qty, orderType, limitPrice ? parseFloat(limitPrice) : undefined); onClose(); }}
            style={{ flex:2, padding:8, borderRadius:8, border:'none', background: side === 'buy' ? '#c0392b' : '#1a5276', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:500 }}>
            Confirmer {side === 'buy' ? 'l\'achat' : 'la vente'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LiveMarket({ config, leagueId }) {
  const [prices, setPrices]       = useState({});
  const [history, setHistory]     = useState({});
  const [streaks, setStreaks]      = useState({});
  const [myHoldings, setHoldings] = useState({});
  const [myCash, setCash]         = useState(config.capital);
  const [divTotal, setDivTotal]   = useState(0);
  const [impactLog, setImpactLog] = useState([]);
  const [eventCount, setEventCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [tradeModal, setTradeModal] = useState(null);
  const [toast, setToast]         = useState(null);
  const [ts, setTs]               = useState('');
  const iRef = useRef(null);

  const { algo } = config;

  // Init
  useEffect(() => {
    const init = {};
    const hist = {};
    const sk = {};
    const hld = {};
    TEAMS.forEach(t => { init[t.id] = { price: 5.00 }; hist[t.id] = [5, 5]; sk[t.id] = 0; hld[t.id] = 0; });
    setPrices(init); setHistory(hist); setStreaks(sk); setHoldings(hld);
    setTs(new Date().toLocaleTimeString('fr-CA', { hour:'2-digit', minute:'2-digit', second:'2-digit' }));
    // Faux leaderboard
    setLeaderboard([
      { name:'Vous', val: config.capital, me: true },
      { name:'Marc L.', val: config.capital * 1.04 },
      { name:'Julie T.', val: config.capital * 0.98 },
      { name:'Patrick G.', val: config.capital * 1.01 },
    ].slice(0, config.players).sort((a,b) => b.val - a.val));
    // Auto drift
    iRef.current = setInterval(() => {
      const t = TEAMS[Math.floor(Math.random() * TEAMS.length)];
      setPrices(prev => {
        const old = prev[t.id]?.price || 5;
        const np = Math.max(0.5, parseFloat((old * (1 + (Math.random() - 0.497) * 0.012)).toFixed(2)));
        return { ...prev, [t.id]: { ...prev[t.id], price: np } };
      });
      setHistory(prev => {
        const h = [...(prev[t.id] || [5]), prices[t.id]?.price || 5].slice(-15);
        return { ...prev, [t.id]: h };
      });
    }, 2800);
    return () => clearInterval(iRef.current);
  }, []);

  function streakMult(s) { return s >= 7 ? algo.m7 : s >= 5 ? algo.m5 : s >= 3 ? algo.m3 : 1; }

  const simEvent = useCallback(() => {
    const t = TEAMS[Math.floor(Math.random() * TEAMS.length)];
    const won = Math.random() > 0.45;
    const ot = Math.random() > 0.65;
    const so = won && Math.random() > 0.75;
    const id = t.id;

    setPrices(prev => {
      const old = prev[id]?.price || 5;
      let pct = 0;
      const sk = streaks[id] || 0;
      if (won) {
        const ns = Math.max(0, sk) + 1;
        const mult = streakMult(ns);
        pct += (ot ? algo.winOT : algo.winReg) / 100 * mult;
        if (so) pct += algo.shutout / 100;
        setStreaks(prev2 => ({ ...prev2, [id]: ns }));
        const div = algo.divBase * mult;
        const held = myHoldings[id] || 0;
        if (held > 0) {
          const amt = parseFloat((div * held).toFixed(2));
          setCash(c => c + amt);
          setDivTotal(d => d + amt);
          setImpactLog(prev2 => [{ team:id, desc:`Dividende +$${div.toFixed(3)}/action`, chg:0, div:amt, ts: new Date().toLocaleTimeString('fr-CA',{hour:'2-digit',minute:'2-digit'}) }, ...prev2].slice(0,20));
        }
      } else {
        pct -= (ot ? algo.lossOT : algo.lossReg) / 100;
        setStreaks(prev2 => ({ ...prev2, [id]: Math.min(0, (prev2[id] || 0)) - 1 }));
      }
      const np = Math.max(0.5, parseFloat((old * (1 + pct)).toFixed(2)));
      const chg = ((np - old) / old * 100);
      setImpactLog(prev2 => [{ team:id, desc: won ? (ot ? 'Victoire OT' : 'Victoire'+(so?' + blanchissage':'')) : (ot?'Défaite OT':'Défaite'), chg, ts: new Date().toLocaleTimeString('fr-CA',{hour:'2-digit',minute:'2-digit'}) }, ...prev2].slice(0, 20));
      setEventCount(c => c + 1);
      return { ...prev, [id]: { ...prev[id], price: np } };
    });
    showToast(`${t.id} — ${won?(ot?'Victoire OT':'Victoire'):(ot?'Défaite OT':'Défaite')}`);
  }, [algo, streaks, myHoldings]);

  function handleBuy(teamId, qty, orderType, limitPrice) {
    const price = prices[teamId]?.price || 5;
    const effectivePrice = orderType === 'limit' && limitPrice ? limitPrice : price;
    const cost = parseFloat((effectivePrice * qty).toFixed(2));
    if (cost > myCash) { showToast('Liquidités insuffisantes', true); return; }
    setCash(c => parseFloat((c - cost).toFixed(2)));
    setHoldings(prev => ({ ...prev, [teamId]: (prev[teamId] || 0) + qty }));
    showToast(`Acheté ${qty.toLocaleString()} actions ${teamId} @ $${effectivePrice.toFixed(2)}`);
    updLeaderboard();
  }

  function handleSell(teamId, qty, orderType, limitPrice) {
    const price = prices[teamId]?.price || 5;
    const effectivePrice = orderType === 'limit' && limitPrice ? limitPrice : price;
    const proc = parseFloat((effectivePrice * qty).toFixed(2));
    setCash(c => parseFloat((c + proc).toFixed(2)));
    setHoldings(prev => ({ ...prev, [teamId]: Math.max(0, (prev[teamId] || 0) - qty) }));
    showToast(`Vendu ${qty.toLocaleString()} actions ${teamId} @ $${effectivePrice.toFixed(2)}`);
    updLeaderboard();
  }

  function updLeaderboard() {
    const portVal = TEAMS.reduce((s, t) => s + (myHoldings[t.id] || 0) * (prices[t.id]?.price || 5), 0);
    const myTotal = myCash + portVal;
    setLeaderboard(prev => prev.map(p => p.me ? { ...p, val: myTotal } : p).sort((a, b) => b.val - a.val));
  }

  function showToast(msg, err = false) {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 2800);
  }

  const portVal = TEAMS.reduce((s, t) => s + (myHoldings[t.id] || 0) * (prices[t.id]?.price || 5), 0);
  const totalVal = myCash + portVal;

  const chgPct = (id) => {
    const h = history[id] || [5, 5];
    return parseFloat(((( prices[id]?.price || 5) - h[0]) / h[0] * 100).toFixed(2));
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, paddingBottom:12, borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ width:34, height:34, background:'#c0392b', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:500, fontSize:13, flexShrink:0 }}>HC</div>
        <div>
          <div style={{ fontSize:17, fontWeight:500 }}>{config.name || 'Ma ligue'}</div>
          <div style={{ fontSize:11, color:'var(--color-text-secondary)' }}>
            <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:'#27ae60', marginRight:5 }}></span>
            Marché ouvert · AMM actif · {config.players} joueurs · Mise réelle {config.mise}$
          </div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ background:'var(--color-background-secondary)', borderRadius:7, padding:'6px 12px', fontSize:12 }}>
            Sylvain B. · <strong>${myCash.toFixed(2)}</strong>
          </div>
          <button onClick={simEvent} style={{ padding:'6px 14px', borderRadius:7, border:'none', background:'#c0392b', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:500 }}>
            Simuler résultat LNH
          </button>
        </div>
      </div>

      {/* Ticker */}
      <div style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'6px 12px', marginBottom:12, overflow:'hidden', whiteSpace:'nowrap', fontSize:11 }}>
        {TEAMS.slice(0, 14).map(t => {
          const ch = chgPct(t.id);
          return (
            <span key={t.id} style={{ marginRight:22 }}>
              <strong>{t.id}</strong> ${(prices[t.id]?.price || 5).toFixed(2)}{' '}
              <span style={{ color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</span>
            </span>
          );
        })}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:10, marginBottom:14 }}>
        {[
          { label:'Valeur portefeuille', val:`$${totalVal.toFixed(2)}`, sub:'liquidités + actions', hi:true },
          { label:'Liquidités',          val:`$${myCash.toFixed(2)}`,   sub:'disponibles' },
          { label:'Dividendes reçus',    val:`$${divTotal.toFixed(2)}`, sub:'cumul', up:true },
          { label:'Événements LNH',      val:eventCount,                sub:'traités ce soir' },
        ].map((m, i) => (
          <div key={i} style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'10px 14px', border: m.hi ? '1.5px solid #c0392b' : 'none' }}>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:3 }}>{m.label}</div>
            <div style={{ fontSize:18, fontWeight:500, color: m.hi ? '#c0392b' : m.up ? '#27ae60' : 'var(--color-text-primary)' }}>{m.val}</div>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {/* Marché */}
        <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>
            Marché — prix à 5 $/action · Spread AMM {config.spread}%
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead><tr>
                {['Équipe','Prix','Var.','Streak','7 jours',''].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'6px 8px', color:'var(--color-text-secondary)', fontWeight:400, borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:11 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {TEAMS.map(t => {
                  const p = prices[t.id]?.price || 5;
                  const ch = chgPct(t.id);
                  const sk = streaks[t.id] || 0;
                  const held = myHoldings[t.id] || 0;
                  return (
                    <tr key={t.id} onMouseEnter={e => e.currentTarget.style.background='var(--color-background-secondary)'} onMouseLeave={e => e.currentTarget.style.background=''}>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', whiteSpace:'nowrap' }}>
                        <TeamLogo id={t.id} size={22} /> {t.name}
                        {held > 0 && <span style={{ marginLeft:5, fontSize:10, background:'#eaf4fb', color:'#1a6fa0', padding:'1px 5px', borderRadius:4, fontWeight:500 }}>{held.toLocaleString()}</span>}
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontWeight:500 }}>${p.toFixed(2)}</td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <span style={{ display:'inline-block', padding:'2px 6px', borderRadius:5, fontSize:10, fontWeight:500, background: ch >= 0 ? '#eafaf1' : '#fdedec', color: ch >= 0 ? '#1e8449' : '#922b21' }}>
                          {ch >= 0 ? '+' : ''}{ch.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:11, color: sk > 0 ? '#27ae60' : sk < 0 ? '#c0392b' : 'var(--color-text-secondary)' }}>
                        {sk > 0 ? `+${sk}` : sk === 0 ? '—' : sk}
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <SparkSVG history={history[t.id] || [5,5]} up={ch >= 0} />
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', whiteSpace:'nowrap' }}>
                        <button onClick={() => setTradeModal(t)} style={{ padding:'3px 9px', borderRadius:5, border:'none', background:'#c0392b', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:500 }}>
                          {held > 0 ? 'Trade' : 'Acheter'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Droite */}
        <div>
          {/* Holdings */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Mon portefeuille</div>
            {TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>Aucune position — achetez dans le tableau!</div>
            ) : TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).map(t => {
              const q = myHoldings[t.id]; const p = prices[t.id]?.price || 5; const ch = chgPct(t.id);
              return (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                  <TeamLogo id={t.id} size={26} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:500, fontSize:13 }}>{t.name}</div>
                    <div style={{ fontSize:10, color:'var(--color-text-secondary)' }}>{q.toLocaleString()} actions · ${p.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:500 }}>${(q * p).toFixed(2)}</div>
                    <div style={{ fontSize:11, color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leaderboard */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Classement — {config.name || 'Ma ligue'}</div>
            {leaderboard.map((p, i) => {
              const medals = ['🥇','🥈','🥉','4e','5e','6e','7e','8e'];
              const gain = ((p.val - config.capital) / config.capital * 100);
              return (
                <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:12, background: p.me ? 'var(--color-background-secondary)' : '', borderRadius: p.me ? 6 : 0, paddingLeft: p.me ? 6 : 0 }}>
                  <span style={{ fontSize:16, minWidth:24 }}>{medals[i] || `${i+1}e`}</span>
                  <span style={{ flex:1, fontWeight: p.me ? 500 : 400 }}>{p.name}</span>
                  <span style={{ fontWeight:500 }}>${Math.round(p.val).toLocaleString('fr-CA')}</span>
                  <span style={{ minWidth:52, textAlign:'right', color: gain >= 0 ? '#27ae60' : '#c0392b', fontSize:11 }}>
                    {gain >= 0 ? '+' : ''}{gain.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Impact log */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Journal d'impact LNH</div>
            {impactLog.length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>En attente de résultats LNH...</div>
            ) : impactLog.map((e, i) => (
              <div key={i} style={{ fontSize:11, padding:'5px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', display:'flex', alignItems:'center', gap:7 }}>
                <TeamLogo id={e.team} size={18} />
                <span style={{ flex:1 }}>{e.desc}</span>
                {e.div && <span style={{ color:'#27ae60' }}>+${e.div.toFixed(2)}</span>}
                {!!e.chg && <span style={{ color: e.chg >= 0 ? '#27ae60' : '#c0392b' }}>{e.chg >= 0 ? '+' : ''}{e.chg.toFixed(2)}%</span>}
                <span style={{ color:'var(--color-text-secondary)', minWidth:40, textAlign:'right' }}>{e.ts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tradeModal && (
        <TradeModal team={tradeModal} prices={prices} myHoldings={myHoldings} cash={myCash}
          onBuy={handleBuy} onSell={handleSell} onClose={() => setTradeModal(null)} />
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:16, right:16, background:'var(--color-background-primary)', border:`0.5px solid ${toast.err ? '#c0392b' : 'var(--color-border-secondary)'}`, borderRadius:8, padding:'9px 14px', fontSize:12, zIndex:200, maxWidth:280 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
}{price.toFixed(2)}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          <button onClick={() => setSide('buy')} style={{ flex:1, padding:'7px', borderRadius:7, border:'none', background: side === 'buy' ? '#c0392b' : 'var(--color-background-secondary)', color: side === 'buy' ? '#fff' : 'var(--color-text-primary)', cursor:'pointer', fontSize:13, fontWeight:500 }}>Acheter</button>
          <button onClick={() => setSide('sell')} disabled={maxSell === 0} style={{ flex:1, padding:'7px', borderRadius:7, border:'none', background: side === 'sell' ? '#1a5276' : 'var(--color-background-secondary)', color: side === 'sell' ? '#fff' : 'var(--color-text-primary)', cursor:'pointer', fontSize:13, fontWeight:500, opacity: maxSell === 0 ? 0.4 : 1 }}>Vendre</button>
        </div>
        {[
          { label:'Prix actuel', val:`$${price.toFixed(2)}` },
          { label: side === 'buy' ? 'Max achetable' : 'Actions détenues', val: side === 'buy' ? `${maxBuy.toLocaleString('fr-CA')} actions` : `${maxSell.toLocaleString('fr-CA')} actions` },
          { label:'Vos liquidités', val:`$${cash.toFixed(2)}` },
        ].map(({ label, val }) => (
          <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'5px 0', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
            <span style={{ color:'var(--color-text-secondary)' }}>{label}</span><span>{val}</span>
          </div>
        ))}
        <div style={{ marginTop:14, marginBottom:10 }}>
          <label style={{ fontSize:12, color:'var(--color-text-secondary)', display:'block', marginBottom:5 }}>Type d'ordre</label>
          <select value={orderType} onChange={e => setOrderType(e.target.value)}
            style={{ width:'100%', padding:'7px 10px', border:'0.5px solid var(--color-border-secondary)', borderRadius:8, background:'var(--color-background-primary)', color:'var(--color-text-primary)', fontSize:13 }}>
            <option value="market">Au marché (immédiat)</option>
            <option value="limit">Ordre limité</option>
          </select>
        </div>
        {orderType === 'limit' && (
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:12, color:'var(--color-text-secondary)', display:'block', marginBottom:5 }}>Prix limite ($)</label>
            <input type="number" step="0.01" placeholder={price.toFixed(2)} value={limitPrice} onChange={e => setLimitPrice(e.target.value)}
              style={{ width:'100%', padding:'7px 10px', border:'0.5px solid var(--color-border-secondary)', borderRadius:8, background:'var(--color-background-primary)', color:'var(--color-text-primary)', fontSize:13 }} />
          </div>
        )}
        <div style={{ marginBottom:10 }}>
          <label style={{ fontSize:12, color:'var(--color-text-secondary)', display:'block', marginBottom:5 }}>Quantité</label>
          <input type="number" min={1} max={side === 'buy' ? maxBuy : maxSell} value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            style={{ width:'100%', padding:'7px 10px', border:'0.5px solid var(--color-border-secondary)', borderRadius:8, background:'var(--color-background-primary)', color:'var(--color-text-primary)', fontSize:13 }} />
        </div>
        <div style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'8px 12px', marginBottom:14, display:'flex', justifyContent:'space-between', fontSize:13 }}>
          <span style={{ color:'var(--color-text-secondary)' }}>Total estimé</span>
          <strong>{'total.toFixed(2)}</strong>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:8, borderRadius:8, border:'0.5px solid var(--color-border-secondary)', background:'none', cursor:'pointer', fontSize:13, color:'var(--color-text-primary)' }}>Annuler</button>
          <button onClick={() => { side === 'buy' ? onBuy(team.id, qty, orderType, limitPrice ? parseFloat(limitPrice) : undefined) : onSell(team.id, qty, orderType, limitPrice ? parseFloat(limitPrice) : undefined); onClose(); }}
            style={{ flex:2, padding:8, borderRadius:8, border:'none', background: side === 'buy' ? '#c0392b' : '#1a5276', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:500 }}>
            Confirmer {side === 'buy' ? 'l\'achat' : 'la vente'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LiveMarket({ config, leagueId }) {
  const [prices, setPrices]       = useState({});
  const [history, setHistory]     = useState({});
  const [streaks, setStreaks]      = useState({});
  const [myHoldings, setHoldings] = useState({});
  const [myCash, setCash]         = useState(config.capital);
  const [divTotal, setDivTotal]   = useState(0);
  const [impactLog, setImpactLog] = useState([]);
  const [eventCount, setEventCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [tradeModal, setTradeModal] = useState(null);
  const [toast, setToast]         = useState(null);
  const [ts, setTs]               = useState('');
  const iRef = useRef(null);

  const { algo } = config;

  // Init
  useEffect(() => {
    const init = {};
    const hist = {};
    const sk = {};
    const hld = {};
    TEAMS.forEach(t => { init[t.id] = { price: 5.00 }; hist[t.id] = [5, 5]; sk[t.id] = 0; hld[t.id] = 0; });
    setPrices(init); setHistory(hist); setStreaks(sk); setHoldings(hld);
    setTs(new Date().toLocaleTimeString('fr-CA', { hour:'2-digit', minute:'2-digit', second:'2-digit' }));
    // Faux leaderboard
    setLeaderboard([
      { name:'Vous', val: config.capital, me: true },
      { name:'Marc L.', val: config.capital * 1.04 },
      { name:'Julie T.', val: config.capital * 0.98 },
      { name:'Patrick G.', val: config.capital * 1.01 },
    ].slice(0, config.players).sort((a,b) => b.val - a.val));
    // Auto drift
    iRef.current = setInterval(() => {
      const t = TEAMS[Math.floor(Math.random() * TEAMS.length)];
      setPrices(prev => {
        const old = prev[t.id]?.price || 5;
        const np = Math.max(0.5, parseFloat((old * (1 + (Math.random() - 0.497) * 0.012)).toFixed(2)));
        return { ...prev, [t.id]: { ...prev[t.id], price: np } };
      });
      setHistory(prev => {
        const h = [...(prev[t.id] || [5]), prices[t.id]?.price || 5].slice(-15);
        return { ...prev, [t.id]: h };
      });
    }, 2800);
    return () => clearInterval(iRef.current);
  }, []);

  function streakMult(s) { return s >= 7 ? algo.m7 : s >= 5 ? algo.m5 : s >= 3 ? algo.m3 : 1; }

  const simEvent = useCallback(() => {
    const t = TEAMS[Math.floor(Math.random() * TEAMS.length)];
    const won = Math.random() > 0.45;
    const ot = Math.random() > 0.65;
    const so = won && Math.random() > 0.75;
    const id = t.id;

    setPrices(prev => {
      const old = prev[id]?.price || 5;
      let pct = 0;
      const sk = streaks[id] || 0;
      if (won) {
        const ns = Math.max(0, sk) + 1;
        const mult = streakMult(ns);
        pct += (ot ? algo.winOT : algo.winReg) / 100 * mult;
        if (so) pct += algo.shutout / 100;
        setStreaks(prev2 => ({ ...prev2, [id]: ns }));
        const div = algo.divBase * mult;
        const held = myHoldings[id] || 0;
        if (held > 0) {
          const amt = parseFloat((div * held).toFixed(2));
          setCash(c => c + amt);
          setDivTotal(d => d + amt);
          setImpactLog(prev2 => [{ team:id, desc:`Dividende +$${div.toFixed(3)}/action`, chg:0, div:amt, ts: new Date().toLocaleTimeString('fr-CA',{hour:'2-digit',minute:'2-digit'}) }, ...prev2].slice(0,20));
        }
      } else {
        pct -= (ot ? algo.lossOT : algo.lossReg) / 100;
        setStreaks(prev2 => ({ ...prev2, [id]: Math.min(0, (prev2[id] || 0)) - 1 }));
      }
      const np = Math.max(0.5, parseFloat((old * (1 + pct)).toFixed(2)));
      const chg = ((np - old) / old * 100);
      setImpactLog(prev2 => [{ team:id, desc: won ? (ot ? 'Victoire OT' : 'Victoire'+(so?' + blanchissage':'')) : (ot?'Défaite OT':'Défaite'), chg, ts: new Date().toLocaleTimeString('fr-CA',{hour:'2-digit',minute:'2-digit'}) }, ...prev2].slice(0, 20));
      setEventCount(c => c + 1);
      return { ...prev, [id]: { ...prev[id], price: np } };
    });
    showToast(`${t.id} — ${won?(ot?'Victoire OT':'Victoire'):(ot?'Défaite OT':'Défaite')}`);
  }, [algo, streaks, myHoldings]);

  function handleBuy(teamId, qty, orderType, limitPrice) {
    const price = prices[teamId]?.price || 5;
    const effectivePrice = orderType === 'limit' && limitPrice ? limitPrice : price;
    const cost = parseFloat((effectivePrice * qty).toFixed(2));
    if (cost > myCash) { showToast('Liquidités insuffisantes', true); return; }
    setCash(c => parseFloat((c - cost).toFixed(2)));
    setHoldings(prev => ({ ...prev, [teamId]: (prev[teamId] || 0) + qty }));
    showToast(`Acheté ${qty.toLocaleString()} actions ${teamId} @ $${effectivePrice.toFixed(2)}`);
    updLeaderboard();
  }

  function handleSell(teamId, qty, orderType, limitPrice) {
    const price = prices[teamId]?.price || 5;
    const effectivePrice = orderType === 'limit' && limitPrice ? limitPrice : price;
    const proc = parseFloat((effectivePrice * qty).toFixed(2));
    setCash(c => parseFloat((c + proc).toFixed(2)));
    setHoldings(prev => ({ ...prev, [teamId]: Math.max(0, (prev[teamId] || 0) - qty) }));
    showToast(`Vendu ${qty.toLocaleString()} actions ${teamId} @ $${effectivePrice.toFixed(2)}`);
    updLeaderboard();
  }

  function updLeaderboard() {
    const portVal = TEAMS.reduce((s, t) => s + (myHoldings[t.id] || 0) * (prices[t.id]?.price || 5), 0);
    const myTotal = myCash + portVal;
    setLeaderboard(prev => prev.map(p => p.me ? { ...p, val: myTotal } : p).sort((a, b) => b.val - a.val));
  }

  function showToast(msg, err = false) {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 2800);
  }

  const portVal = TEAMS.reduce((s, t) => s + (myHoldings[t.id] || 0) * (prices[t.id]?.price || 5), 0);
  const totalVal = myCash + portVal;

  const chgPct = (id) => {
    const h = history[id] || [5, 5];
    return parseFloat(((( prices[id]?.price || 5) - h[0]) / h[0] * 100).toFixed(2));
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, paddingBottom:12, borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ width:34, height:34, background:'#c0392b', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:500, fontSize:13, flexShrink:0 }}>HC</div>
        <div>
          <div style={{ fontSize:17, fontWeight:500 }}>{config.name || 'Ma ligue'}</div>
          <div style={{ fontSize:11, color:'var(--color-text-secondary)' }}>
            <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:'#27ae60', marginRight:5 }}></span>
            Marché ouvert · AMM actif · {config.players} joueurs · Mise réelle {config.mise}$
          </div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ background:'var(--color-background-secondary)', borderRadius:7, padding:'6px 12px', fontSize:12 }}>
            Sylvain B. · <strong>${myCash.toFixed(2)}</strong>
          </div>
          <button onClick={simEvent} style={{ padding:'6px 14px', borderRadius:7, border:'none', background:'#c0392b', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:500 }}>
            Simuler résultat LNH
          </button>
        </div>
      </div>

      {/* Ticker */}
      <div style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'6px 12px', marginBottom:12, overflow:'hidden', whiteSpace:'nowrap', fontSize:11 }}>
        {TEAMS.slice(0, 14).map(t => {
          const ch = chgPct(t.id);
          return (
            <span key={t.id} style={{ marginRight:22 }}>
              <strong>{t.id}</strong> ${(prices[t.id]?.price || 5).toFixed(2)}{' '}
              <span style={{ color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</span>
            </span>
          );
        })}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:10, marginBottom:14 }}>
        {[
          { label:'Valeur portefeuille', val:`$${totalVal.toFixed(2)}`, sub:'liquidités + actions', hi:true },
          { label:'Liquidités',          val:`$${myCash.toFixed(2)}`,   sub:'disponibles' },
          { label:'Dividendes reçus',    val:`$${divTotal.toFixed(2)}`, sub:'cumul', up:true },
          { label:'Événements LNH',      val:eventCount,                sub:'traités ce soir' },
        ].map((m, i) => (
          <div key={i} style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'10px 14px', border: m.hi ? '1.5px solid #c0392b' : 'none' }}>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:3 }}>{m.label}</div>
            <div style={{ fontSize:18, fontWeight:500, color: m.hi ? '#c0392b' : m.up ? '#27ae60' : 'var(--color-text-primary)' }}>{m.val}</div>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {/* Marché */}
        <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>
            Marché — prix à 5 $/action · Spread AMM {config.spread}%
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead><tr>
                {['Équipe','Prix','Var.','Streak','7 jours',''].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'6px 8px', color:'var(--color-text-secondary)', fontWeight:400, borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:11 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {TEAMS.map(t => {
                  const p = prices[t.id]?.price || 5;
                  const ch = chgPct(t.id);
                  const sk = streaks[t.id] || 0;
                  const held = myHoldings[t.id] || 0;
                  return (
                    <tr key={t.id} onMouseEnter={e => e.currentTarget.style.background='var(--color-background-secondary)'} onMouseLeave={e => e.currentTarget.style.background=''}>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', whiteSpace:'nowrap' }}>
                        <TeamLogo id={t.id} size={22} /> {t.name}
                        {held > 0 && <span style={{ marginLeft:5, fontSize:10, background:'#eaf4fb', color:'#1a6fa0', padding:'1px 5px', borderRadius:4, fontWeight:500 }}>{held.toLocaleString()}</span>}
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontWeight:500 }}>${p.toFixed(2)}</td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <span style={{ display:'inline-block', padding:'2px 6px', borderRadius:5, fontSize:10, fontWeight:500, background: ch >= 0 ? '#eafaf1' : '#fdedec', color: ch >= 0 ? '#1e8449' : '#922b21' }}>
                          {ch >= 0 ? '+' : ''}{ch.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:11, color: sk > 0 ? '#27ae60' : sk < 0 ? '#c0392b' : 'var(--color-text-secondary)' }}>
                        {sk > 0 ? `+${sk}` : sk === 0 ? '—' : sk}
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <SparkSVG history={history[t.id] || [5,5]} up={ch >= 0} />
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', whiteSpace:'nowrap' }}>
                        <button onClick={() => setTradeModal(t)} style={{ padding:'3px 9px', borderRadius:5, border:'none', background:'#c0392b', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:500 }}>
                          {held > 0 ? 'Trade' : 'Acheter'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Droite */}
        <div>
          {/* Holdings */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Mon portefeuille</div>
            {TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>Aucune position — achetez dans le tableau!</div>
            ) : TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).map(t => {
              const q = myHoldings[t.id]; const p = prices[t.id]?.price || 5; const ch = chgPct(t.id);
              return (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                  <TeamLogo id={t.id} size={26} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:500, fontSize:13 }}>{t.name}</div>
                    <div style={{ fontSize:10, color:'var(--color-text-secondary)' }}>{q.toLocaleString()} actions · ${p.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:500 }}>${(q * p).toFixed(2)}</div>
                    <div style={{ fontSize:11, color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leaderboard */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Classement — {config.name || 'Ma ligue'}</div>
            {leaderboard.map((p, i) => {
              const medals = ['🥇','🥈','🥉','4e','5e','6e','7e','8e'];
              const gain = ((p.val - config.capital) / config.capital * 100);
              return (
                <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:12, background: p.me ? 'var(--color-background-secondary)' : '', borderRadius: p.me ? 6 : 0, paddingLeft: p.me ? 6 : 0 }}>
                  <span style={{ fontSize:16, minWidth:24 }}>{medals[i] || `${i+1}e`}</span>
                  <span style={{ flex:1, fontWeight: p.me ? 500 : 400 }}>{p.name}</span>
                  <span style={{ fontWeight:500 }}>${Math.round(p.val).toLocaleString('fr-CA')}</span>
                  <span style={{ minWidth:52, textAlign:'right', color: gain >= 0 ? '#27ae60' : '#c0392b', fontSize:11 }}>
                    {gain >= 0 ? '+' : ''}{gain.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Impact log */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Journal d'impact LNH</div>
            {impactLog.length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>En attente de résultats LNH...</div>
            ) : impactLog.map((e, i) => (
              <div key={i} style={{ fontSize:11, padding:'5px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', display:'flex', alignItems:'center', gap:7 }}>
                <TeamLogo id={e.team} size={18} />
                <span style={{ flex:1 }}>{e.desc}</span>
                {e.div && <span style={{ color:'#27ae60' }}>+${e.div.toFixed(2)}</span>}
                {!!e.chg && <span style={{ color: e.chg >= 0 ? '#27ae60' : '#c0392b' }}>{e.chg >= 0 ? '+' : ''}{e.chg.toFixed(2)}%</span>}
                <span style={{ color:'var(--color-text-secondary)', minWidth:40, textAlign:'right' }}>{e.ts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tradeModal && (
        <TradeModal team={tradeModal} prices={prices} myHoldings={myHoldings} cash={myCash}
          onBuy={handleBuy} onSell={handleSell} onClose={() => setTradeModal(null)} />
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:16, right:16, background:'var(--color-background-primary)', border:`0.5px solid ${toast.err ? '#c0392b' : 'var(--color-border-secondary)'}`, borderRadius:8, padding:'9px 14px', fontSize:12, zIndex:200, maxWidth:280 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
}{total.toFixed(2)}</strong>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:8, borderRadius:8, border:'0.5px solid var(--color-border-secondary)', background:'none', cursor:'pointer', fontSize:13, color:'var(--color-text-primary)' }}>Annuler</button>
          <button onClick={() => { side === 'buy' ? onBuy(team.id, qty, orderType, limitPrice ? parseFloat(limitPrice) : undefined) : onSell(team.id, qty, orderType, limitPrice ? parseFloat(limitPrice) : undefined); onClose(); }}
            style={{ flex:2, padding:8, borderRadius:8, border:'none', background: side === 'buy' ? '#c0392b' : '#1a5276', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:500 }}>
            Confirmer {side === 'buy' ? 'l\'achat' : 'la vente'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LiveMarket({ config, leagueId }) {
  const [prices, setPrices]       = useState({});
  const [history, setHistory]     = useState({});
  const [streaks, setStreaks]      = useState({});
  const [myHoldings, setHoldings] = useState({});
  const [myCash, setCash]         = useState(config.capital);
  const [divTotal, setDivTotal]   = useState(0);
  const [impactLog, setImpactLog] = useState([]);
  const [eventCount, setEventCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [tradeModal, setTradeModal] = useState(null);
  const [toast, setToast]         = useState(null);
  const [ts, setTs]               = useState('');
  const iRef = useRef(null);

  const { algo } = config;

  // Init
  useEffect(() => {
    const init = {};
    const hist = {};
    const sk = {};
    const hld = {};
    TEAMS.forEach(t => { init[t.id] = { price: 5.00 }; hist[t.id] = [5, 5]; sk[t.id] = 0; hld[t.id] = 0; });
    setPrices(init); setHistory(hist); setStreaks(sk); setHoldings(hld);
    setTs(new Date().toLocaleTimeString('fr-CA', { hour:'2-digit', minute:'2-digit', second:'2-digit' }));
    // Faux leaderboard
    setLeaderboard([
      { name:'Vous', val: config.capital, me: true },
      { name:'Marc L.', val: config.capital * 1.04 },
      { name:'Julie T.', val: config.capital * 0.98 },
      { name:'Patrick G.', val: config.capital * 1.01 },
    ].slice(0, config.players).sort((a,b) => b.val - a.val));
    // Auto drift
    iRef.current = setInterval(() => {
      const t = TEAMS[Math.floor(Math.random() * TEAMS.length)];
      setPrices(prev => {
        const old = prev[t.id]?.price || 5;
        const np = Math.max(0.5, parseFloat((old * (1 + (Math.random() - 0.497) * 0.012)).toFixed(2)));
        return { ...prev, [t.id]: { ...prev[t.id], price: np } };
      });
      setHistory(prev => {
        const h = [...(prev[t.id] || [5]), prices[t.id]?.price || 5].slice(-15);
        return { ...prev, [t.id]: h };
      });
    }, 2800);
    return () => clearInterval(iRef.current);
  }, []);

  function streakMult(s) { return s >= 7 ? algo.m7 : s >= 5 ? algo.m5 : s >= 3 ? algo.m3 : 1; }

  const simEvent = useCallback(() => {
    const t = TEAMS[Math.floor(Math.random() * TEAMS.length)];
    const won = Math.random() > 0.45;
    const ot = Math.random() > 0.65;
    const so = won && Math.random() > 0.75;
    const id = t.id;

    setPrices(prev => {
      const old = prev[id]?.price || 5;
      let pct = 0;
      const sk = streaks[id] || 0;
      if (won) {
        const ns = Math.max(0, sk) + 1;
        const mult = streakMult(ns);
        pct += (ot ? algo.winOT : algo.winReg) / 100 * mult;
        if (so) pct += algo.shutout / 100;
        setStreaks(prev2 => ({ ...prev2, [id]: ns }));
        const div = algo.divBase * mult;
        const held = myHoldings[id] || 0;
        if (held > 0) {
          const amt = parseFloat((div * held).toFixed(2));
          setCash(c => c + amt);
          setDivTotal(d => d + amt);
          setImpactLog(prev2 => [{ team:id, desc:`Dividende +$${div.toFixed(3)}/action`, chg:0, div:amt, ts: new Date().toLocaleTimeString('fr-CA',{hour:'2-digit',minute:'2-digit'}) }, ...prev2].slice(0,20));
        }
      } else {
        pct -= (ot ? algo.lossOT : algo.lossReg) / 100;
        setStreaks(prev2 => ({ ...prev2, [id]: Math.min(0, (prev2[id] || 0)) - 1 }));
      }
      const np = Math.max(0.5, parseFloat((old * (1 + pct)).toFixed(2)));
      const chg = ((np - old) / old * 100);
      setImpactLog(prev2 => [{ team:id, desc: won ? (ot ? 'Victoire OT' : 'Victoire'+(so?' + blanchissage':'')) : (ot?'Défaite OT':'Défaite'), chg, ts: new Date().toLocaleTimeString('fr-CA',{hour:'2-digit',minute:'2-digit'}) }, ...prev2].slice(0, 20));
      setEventCount(c => c + 1);
      return { ...prev, [id]: { ...prev[id], price: np } };
    });
    showToast(`${t.id} — {'won?(ot?'Victoire OT':'Victoire'):(ot?'Défaite OT':'Défaite')}`);
  }, [algo, streaks, myHoldings]);

  function handleBuy(teamId, qty, orderType, limitPrice) {
    const price = prices[teamId]?.price || 5;
    const effectivePrice = orderType === 'limit' && limitPrice ? limitPrice : price;
    const cost = parseFloat((effectivePrice * qty).toFixed(2));
    if (cost > myCash) { showToast('Liquidités insuffisantes', true); return; }
    setCash(c => parseFloat((c - cost).toFixed(2)));
    setHoldings(prev => ({ ...prev, [teamId]: (prev[teamId] || 0) + qty }));
    showToast(`Acheté ${qty.toLocaleString()} actions ${teamId} @ $${effectivePrice.toFixed(2)}`);
    updLeaderboard();
  }

  function handleSell(teamId, qty, orderType, limitPrice) {
    const price = prices[teamId]?.price || 5;
    const effectivePrice = orderType === 'limit' && limitPrice ? limitPrice : price;
    const proc = parseFloat((effectivePrice * qty).toFixed(2));
    setCash(c => parseFloat((c + proc).toFixed(2)));
    setHoldings(prev => ({ ...prev, [teamId]: Math.max(0, (prev[teamId] || 0) - qty) }));
    showToast(`Vendu ${qty.toLocaleString()} actions ${teamId} @ $${effectivePrice.toFixed(2)}`);
    updLeaderboard();
  }

  function updLeaderboard() {
    const portVal = TEAMS.reduce((s, t) => s + (myHoldings[t.id] || 0) * (prices[t.id]?.price || 5), 0);
    const myTotal = myCash + portVal;
    setLeaderboard(prev => prev.map(p => p.me ? { ...p, val: myTotal } : p).sort((a, b) => b.val - a.val));
  }

  function showToast(msg, err = false) {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 2800);
  }

  const portVal = TEAMS.reduce((s, t) => s + (myHoldings[t.id] || 0) * (prices[t.id]?.price || 5), 0);
  const totalVal = myCash + portVal;

  const chgPct = (id) => {
    const h = history[id] || [5, 5];
    return parseFloat(((( prices[id]?.price || 5) - h[0]) / h[0] * 100).toFixed(2));
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, paddingBottom:12, borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ width:34, height:34, background:'#c0392b', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:500, fontSize:13, flexShrink:0 }}>HC</div>
        <div>
          <div style={{ fontSize:17, fontWeight:500 }}>{config.name || 'Ma ligue'}</div>
          <div style={{ fontSize:11, color:'var(--color-text-secondary)' }}>
            <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:'#27ae60', marginRight:5 }}></span>
            Marché ouvert · AMM actif · {config.players} joueurs · Mise réelle {config.mise}$
          </div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ background:'var(--color-background-secondary)', borderRadius:7, padding:'6px 12px', fontSize:12 }}>
            Sylvain B. · <strong>${myCash.toFixed(2)}</strong>
          </div>
          <button onClick={simEvent} style={{ padding:'6px 14px', borderRadius:7, border:'none', background:'#c0392b', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:500 }}>
            Simuler résultat LNH
          </button>
        </div>
      </div>

      {/* Ticker */}
      <div style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'6px 12px', marginBottom:12, overflow:'hidden', whiteSpace:'nowrap', fontSize:11 }}>
        {TEAMS.slice(0, 14).map(t => {
          const ch = chgPct(t.id);
          return (
            <span key={t.id} style={{ marginRight:22 }}>
              <strong>{t.id}</strong> ${(prices[t.id]?.price || 5).toFixed(2)}{' '}
              <span style={{ color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</span>
            </span>
          );
        })}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:10, marginBottom:14 }}>
        {[
          { label:'Valeur portefeuille', val:`$${totalVal.toFixed(2)}`, sub:'liquidités + actions', hi:true },
          { label:'Liquidités',          val:`$${myCash.toFixed(2)}`,   sub:'disponibles' },
          { label:'Dividendes reçus',    val:`$${divTotal.toFixed(2)}`, sub:'cumul', up:true },
          { label:'Événements LNH',      val:eventCount,                sub:'traités ce soir' },
        ].map((m, i) => (
          <div key={i} style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'10px 14px', border: m.hi ? '1.5px solid #c0392b' : 'none' }}>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:3 }}>{m.label}</div>
            <div style={{ fontSize:18, fontWeight:500, color: m.hi ? '#c0392b' : m.up ? '#27ae60' : 'var(--color-text-primary)' }}>{m.val}</div>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {/* Marché */}
        <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>
            Marché — prix à 5 $/action · Spread AMM {config.spread}%
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead><tr>
                {['Équipe','Prix','Var.','Streak','7 jours',''].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'6px 8px', color:'var(--color-text-secondary)', fontWeight:400, borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:11 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {TEAMS.map(t => {
                  const p = prices[t.id]?.price || 5;
                  const ch = chgPct(t.id);
                  const sk = streaks[t.id] || 0;
                  const held = myHoldings[t.id] || 0;
                  return (
                    <tr key={t.id} onMouseEnter={e => e.currentTarget.style.background='var(--color-background-secondary)'} onMouseLeave={e => e.currentTarget.style.background=''}>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', whiteSpace:'nowrap' }}>
                        <TeamLogo id={t.id} size={22} /> {t.name}
                        {held > 0 && <span style={{ marginLeft:5, fontSize:10, background:'#eaf4fb', color:'#1a6fa0', padding:'1px 5px', borderRadius:4, fontWeight:500 }}>{held.toLocaleString()}</span>}
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontWeight:500 }}>${p.toFixed(2)}</td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <span style={{ display:'inline-block', padding:'2px 6px', borderRadius:5, fontSize:10, fontWeight:500, background: ch >= 0 ? '#eafaf1' : '#fdedec', color: ch >= 0 ? '#1e8449' : '#922b21' }}>
                          {ch >= 0 ? '+' : ''}{ch.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:11, color: sk > 0 ? '#27ae60' : sk < 0 ? '#c0392b' : 'var(--color-text-secondary)' }}>
                        {sk > 0 ? `+${sk}` : sk === 0 ? '—' : sk}
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <SparkSVG history={history[t.id] || [5,5]} up={ch >= 0} />
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', whiteSpace:'nowrap' }}>
                        <button onClick={() => setTradeModal(t)} style={{ padding:'3px 9px', borderRadius:5, border:'none', background:'#c0392b', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:500 }}>
                          {held > 0 ? 'Trade' : 'Acheter'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Droite */}
        <div>
          {/* Holdings */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Mon portefeuille</div>
            {TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>Aucune position — achetez dans le tableau!</div>
            ) : TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).map(t => {
              const q = myHoldings[t.id]; const p = prices[t.id]?.price || 5; const ch = chgPct(t.id);
              return (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                  <TeamLogo id={t.id} size={26} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:500, fontSize:13 }}>{t.name}</div>
                    <div style={{ fontSize:10, color:'var(--color-text-secondary)' }}>{q.toLocaleString()} actions · ${p.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:500 }}>${(q * p).toFixed(2)}</div>
                    <div style={{ fontSize:11, color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leaderboard */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Classement — {config.name || 'Ma ligue'}</div>
            {leaderboard.map((p, i) => {
              const medals = ['🥇','🥈','🥉','4e','5e','6e','7e','8e'];
              const gain = ((p.val - config.capital) / config.capital * 100);
              return (
                <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:12, background: p.me ? 'var(--color-background-secondary)' : '', borderRadius: p.me ? 6 : 0, paddingLeft: p.me ? 6 : 0 }}>
                  <span style={{ fontSize:16, minWidth:24 }}>{medals[i] || `${i+1}e`}</span>
                  <span style={{ flex:1, fontWeight: p.me ? 500 : 400 }}>{p.name}</span>
                  <span style={{ fontWeight:500 }}>${Math.round(p.val).toLocaleString('fr-CA')}</span>
                  <span style={{ minWidth:52, textAlign:'right', color: gain >= 0 ? '#27ae60' : '#c0392b', fontSize:11 }}>
                    {gain >= 0 ? '+' : ''}{gain.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Impact log */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Journal d'impact LNH</div>
            {impactLog.length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>En attente de résultats LNH...</div>
            ) : impactLog.map((e, i) => (
              <div key={i} style={{ fontSize:11, padding:'5px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', display:'flex', alignItems:'center', gap:7 }}>
                <TeamLogo id={e.team} size={18} />
                <span style={{ flex:1 }}>{e.desc}</span>
                {e.div && <span style={{ color:'#27ae60' }}>+${e.div.toFixed(2)}</span>}
                {!!e.chg && <span style={{ color: e.chg >= 0 ? '#27ae60' : '#c0392b' }}>{e.chg >= 0 ? '+' : ''}{e.chg.toFixed(2)}%</span>}
                <span style={{ color:'var(--color-text-secondary)', minWidth:40, textAlign:'right' }}>{e.ts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tradeModal && (
        <TradeModal team={tradeModal} prices={prices} myHoldings={myHoldings} cash={myCash}
          onBuy={handleBuy} onSell={handleSell} onClose={() => setTradeModal(null)} />
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:16, right:16, background:'var(--color-background-primary)', border:`0.5px solid ${toast.err ? '#c0392b' : 'var(--color-border-secondary)'}`, borderRadius:8, padding:'9px 14px', fontSize:12, zIndex:200, maxWidth:280 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
}{won?(ot?'Victoire OT':'Victoire'):(ot?'Défaite OT':'Défaite')}`);
  }, [algo, streaks, myHoldings]);

  function handleBuy(teamId, qty, orderType, limitPrice) {
    const price = prices[teamId]?.price || 5;
    const effectivePrice = orderType === 'limit' && limitPrice ? limitPrice : price;
    const cost = parseFloat((effectivePrice * qty).toFixed(2));
    if (cost > myCash) { showToast('Liquidités insuffisantes', true); return; }
    setCash(c => parseFloat((c - cost).toFixed(2)));
    setHoldings(prev => ({ ...prev, [teamId]: (prev[teamId] || 0) + qty }));
    showToast(`Acheté {'qty.toLocaleString()} actions ${teamId} @ $${effectivePrice.toFixed(2)}`);
    updLeaderboard();
  }

  function handleSell(teamId, qty, orderType, limitPrice) {
    const price = prices[teamId]?.price || 5;
    const effectivePrice = orderType === 'limit' && limitPrice ? limitPrice : price;
    const proc = parseFloat((effectivePrice * qty).toFixed(2));
    setCash(c => parseFloat((c + proc).toFixed(2)));
    setHoldings(prev => ({ ...prev, [teamId]: Math.max(0, (prev[teamId] || 0) - qty) }));
    showToast(`Vendu ${qty.toLocaleString()} actions ${teamId} @ $${effectivePrice.toFixed(2)}`);
    updLeaderboard();
  }

  function updLeaderboard() {
    const portVal = TEAMS.reduce((s, t) => s + (myHoldings[t.id] || 0) * (prices[t.id]?.price || 5), 0);
    const myTotal = myCash + portVal;
    setLeaderboard(prev => prev.map(p => p.me ? { ...p, val: myTotal } : p).sort((a, b) => b.val - a.val));
  }

  function showToast(msg, err = false) {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 2800);
  }

  const portVal = TEAMS.reduce((s, t) => s + (myHoldings[t.id] || 0) * (prices[t.id]?.price || 5), 0);
  const totalVal = myCash + portVal;

  const chgPct = (id) => {
    const h = history[id] || [5, 5];
    return parseFloat(((( prices[id]?.price || 5) - h[0]) / h[0] * 100).toFixed(2));
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, paddingBottom:12, borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ width:34, height:34, background:'#c0392b', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:500, fontSize:13, flexShrink:0 }}>HC</div>
        <div>
          <div style={{ fontSize:17, fontWeight:500 }}>{config.name || 'Ma ligue'}</div>
          <div style={{ fontSize:11, color:'var(--color-text-secondary)' }}>
            <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:'#27ae60', marginRight:5 }}></span>
            Marché ouvert · AMM actif · {config.players} joueurs · Mise réelle {config.mise}$
          </div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ background:'var(--color-background-secondary)', borderRadius:7, padding:'6px 12px', fontSize:12 }}>
            Sylvain B. · <strong>${myCash.toFixed(2)}</strong>
          </div>
          <button onClick={simEvent} style={{ padding:'6px 14px', borderRadius:7, border:'none', background:'#c0392b', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:500 }}>
            Simuler résultat LNH
          </button>
        </div>
      </div>

      {/* Ticker */}
      <div style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'6px 12px', marginBottom:12, overflow:'hidden', whiteSpace:'nowrap', fontSize:11 }}>
        {TEAMS.slice(0, 14).map(t => {
          const ch = chgPct(t.id);
          return (
            <span key={t.id} style={{ marginRight:22 }}>
              <strong>{t.id}</strong> ${(prices[t.id]?.price || 5).toFixed(2)}{' '}
              <span style={{ color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</span>
            </span>
          );
        })}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:10, marginBottom:14 }}>
        {[
          { label:'Valeur portefeuille', val:`$${totalVal.toFixed(2)}`, sub:'liquidités + actions', hi:true },
          { label:'Liquidités',          val:`$${myCash.toFixed(2)}`,   sub:'disponibles' },
          { label:'Dividendes reçus',    val:`$${divTotal.toFixed(2)}`, sub:'cumul', up:true },
          { label:'Événements LNH',      val:eventCount,                sub:'traités ce soir' },
        ].map((m, i) => (
          <div key={i} style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'10px 14px', border: m.hi ? '1.5px solid #c0392b' : 'none' }}>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:3 }}>{m.label}</div>
            <div style={{ fontSize:18, fontWeight:500, color: m.hi ? '#c0392b' : m.up ? '#27ae60' : 'var(--color-text-primary)' }}>{m.val}</div>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {/* Marché */}
        <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>
            Marché — prix à 5 $/action · Spread AMM {config.spread}%
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead><tr>
                {['Équipe','Prix','Var.','Streak','7 jours',''].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'6px 8px', color:'var(--color-text-secondary)', fontWeight:400, borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:11 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {TEAMS.map(t => {
                  const p = prices[t.id]?.price || 5;
                  const ch = chgPct(t.id);
                  const sk = streaks[t.id] || 0;
                  const held = myHoldings[t.id] || 0;
                  return (
                    <tr key={t.id} onMouseEnter={e => e.currentTarget.style.background='var(--color-background-secondary)'} onMouseLeave={e => e.currentTarget.style.background=''}>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', whiteSpace:'nowrap' }}>
                        <TeamLogo id={t.id} size={22} /> {t.name}
                        {held > 0 && <span style={{ marginLeft:5, fontSize:10, background:'#eaf4fb', color:'#1a6fa0', padding:'1px 5px', borderRadius:4, fontWeight:500 }}>{held.toLocaleString()}</span>}
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontWeight:500 }}>${p.toFixed(2)}</td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <span style={{ display:'inline-block', padding:'2px 6px', borderRadius:5, fontSize:10, fontWeight:500, background: ch >= 0 ? '#eafaf1' : '#fdedec', color: ch >= 0 ? '#1e8449' : '#922b21' }}>
                          {ch >= 0 ? '+' : ''}{ch.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:11, color: sk > 0 ? '#27ae60' : sk < 0 ? '#c0392b' : 'var(--color-text-secondary)' }}>
                        {sk > 0 ? `+${sk}` : sk === 0 ? '—' : sk}
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <SparkSVG history={history[t.id] || [5,5]} up={ch >= 0} />
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', whiteSpace:'nowrap' }}>
                        <button onClick={() => setTradeModal(t)} style={{ padding:'3px 9px', borderRadius:5, border:'none', background:'#c0392b', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:500 }}>
                          {held > 0 ? 'Trade' : 'Acheter'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Droite */}
        <div>
          {/* Holdings */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Mon portefeuille</div>
            {TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>Aucune position — achetez dans le tableau!</div>
            ) : TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).map(t => {
              const q = myHoldings[t.id]; const p = prices[t.id]?.price || 5; const ch = chgPct(t.id);
              return (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                  <TeamLogo id={t.id} size={26} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:500, fontSize:13 }}>{t.name}</div>
                    <div style={{ fontSize:10, color:'var(--color-text-secondary)' }}>{q.toLocaleString()} actions · ${p.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:500 }}>${(q * p).toFixed(2)}</div>
                    <div style={{ fontSize:11, color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leaderboard */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Classement — {config.name || 'Ma ligue'}</div>
            {leaderboard.map((p, i) => {
              const medals = ['🥇','🥈','🥉','4e','5e','6e','7e','8e'];
              const gain = ((p.val - config.capital) / config.capital * 100);
              return (
                <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:12, background: p.me ? 'var(--color-background-secondary)' : '', borderRadius: p.me ? 6 : 0, paddingLeft: p.me ? 6 : 0 }}>
                  <span style={{ fontSize:16, minWidth:24 }}>{medals[i] || `${i+1}e`}</span>
                  <span style={{ flex:1, fontWeight: p.me ? 500 : 400 }}>{p.name}</span>
                  <span style={{ fontWeight:500 }}>${Math.round(p.val).toLocaleString('fr-CA')}</span>
                  <span style={{ minWidth:52, textAlign:'right', color: gain >= 0 ? '#27ae60' : '#c0392b', fontSize:11 }}>
                    {gain >= 0 ? '+' : ''}{gain.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Impact log */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Journal d'impact LNH</div>
            {impactLog.length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>En attente de résultats LNH...</div>
            ) : impactLog.map((e, i) => (
              <div key={i} style={{ fontSize:11, padding:'5px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', display:'flex', alignItems:'center', gap:7 }}>
                <TeamLogo id={e.team} size={18} />
                <span style={{ flex:1 }}>{e.desc}</span>
                {e.div && <span style={{ color:'#27ae60' }}>+${e.div.toFixed(2)}</span>}
                {!!e.chg && <span style={{ color: e.chg >= 0 ? '#27ae60' : '#c0392b' }}>{e.chg >= 0 ? '+' : ''}{e.chg.toFixed(2)}%</span>}
                <span style={{ color:'var(--color-text-secondary)', minWidth:40, textAlign:'right' }}>{e.ts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tradeModal && (
        <TradeModal team={tradeModal} prices={prices} myHoldings={myHoldings} cash={myCash}
          onBuy={handleBuy} onSell={handleSell} onClose={() => setTradeModal(null)} />
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:16, right:16, background:'var(--color-background-primary)', border:`0.5px solid ${toast.err ? '#c0392b' : 'var(--color-border-secondary)'}`, borderRadius:8, padding:'9px 14px', fontSize:12, zIndex:200, maxWidth:280 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
}{qty.toLocaleString()} actions {'teamId} @ $${effectivePrice.toFixed(2)}`);
    updLeaderboard();
  }

  function handleSell(teamId, qty, orderType, limitPrice) {
    const price = prices[teamId]?.price || 5;
    const effectivePrice = orderType === 'limit' && limitPrice ? limitPrice : price;
    const proc = parseFloat((effectivePrice * qty).toFixed(2));
    setCash(c => parseFloat((c + proc).toFixed(2)));
    setHoldings(prev => ({ ...prev, [teamId]: Math.max(0, (prev[teamId] || 0) - qty) }));
    showToast(`Vendu ${qty.toLocaleString()} actions ${teamId} @ $${effectivePrice.toFixed(2)}`);
    updLeaderboard();
  }

  function updLeaderboard() {
    const portVal = TEAMS.reduce((s, t) => s + (myHoldings[t.id] || 0) * (prices[t.id]?.price || 5), 0);
    const myTotal = myCash + portVal;
    setLeaderboard(prev => prev.map(p => p.me ? { ...p, val: myTotal } : p).sort((a, b) => b.val - a.val));
  }

  function showToast(msg, err = false) {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 2800);
  }

  const portVal = TEAMS.reduce((s, t) => s + (myHoldings[t.id] || 0) * (prices[t.id]?.price || 5), 0);
  const totalVal = myCash + portVal;

  const chgPct = (id) => {
    const h = history[id] || [5, 5];
    return parseFloat(((( prices[id]?.price || 5) - h[0]) / h[0] * 100).toFixed(2));
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, paddingBottom:12, borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ width:34, height:34, background:'#c0392b', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:500, fontSize:13, flexShrink:0 }}>HC</div>
        <div>
          <div style={{ fontSize:17, fontWeight:500 }}>{config.name || 'Ma ligue'}</div>
          <div style={{ fontSize:11, color:'var(--color-text-secondary)' }}>
            <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:'#27ae60', marginRight:5 }}></span>
            Marché ouvert · AMM actif · {config.players} joueurs · Mise réelle {config.mise}$
          </div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ background:'var(--color-background-secondary)', borderRadius:7, padding:'6px 12px', fontSize:12 }}>
            Sylvain B. · <strong>${myCash.toFixed(2)}</strong>
          </div>
          <button onClick={simEvent} style={{ padding:'6px 14px', borderRadius:7, border:'none', background:'#c0392b', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:500 }}>
            Simuler résultat LNH
          </button>
        </div>
      </div>

      {/* Ticker */}
      <div style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'6px 12px', marginBottom:12, overflow:'hidden', whiteSpace:'nowrap', fontSize:11 }}>
        {TEAMS.slice(0, 14).map(t => {
          const ch = chgPct(t.id);
          return (
            <span key={t.id} style={{ marginRight:22 }}>
              <strong>{t.id}</strong> ${(prices[t.id]?.price || 5).toFixed(2)}{' '}
              <span style={{ color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</span>
            </span>
          );
        })}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:10, marginBottom:14 }}>
        {[
          { label:'Valeur portefeuille', val:`$${totalVal.toFixed(2)}`, sub:'liquidités + actions', hi:true },
          { label:'Liquidités',          val:`$${myCash.toFixed(2)}`,   sub:'disponibles' },
          { label:'Dividendes reçus',    val:`$${divTotal.toFixed(2)}`, sub:'cumul', up:true },
          { label:'Événements LNH',      val:eventCount,                sub:'traités ce soir' },
        ].map((m, i) => (
          <div key={i} style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'10px 14px', border: m.hi ? '1.5px solid #c0392b' : 'none' }}>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:3 }}>{m.label}</div>
            <div style={{ fontSize:18, fontWeight:500, color: m.hi ? '#c0392b' : m.up ? '#27ae60' : 'var(--color-text-primary)' }}>{m.val}</div>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {/* Marché */}
        <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>
            Marché — prix à 5 $/action · Spread AMM {config.spread}%
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead><tr>
                {['Équipe','Prix','Var.','Streak','7 jours',''].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'6px 8px', color:'var(--color-text-secondary)', fontWeight:400, borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:11 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {TEAMS.map(t => {
                  const p = prices[t.id]?.price || 5;
                  const ch = chgPct(t.id);
                  const sk = streaks[t.id] || 0;
                  const held = myHoldings[t.id] || 0;
                  return (
                    <tr key={t.id} onMouseEnter={e => e.currentTarget.style.background='var(--color-background-secondary)'} onMouseLeave={e => e.currentTarget.style.background=''}>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', whiteSpace:'nowrap' }}>
                        <TeamLogo id={t.id} size={22} /> {t.name}
                        {held > 0 && <span style={{ marginLeft:5, fontSize:10, background:'#eaf4fb', color:'#1a6fa0', padding:'1px 5px', borderRadius:4, fontWeight:500 }}>{held.toLocaleString()}</span>}
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontWeight:500 }}>${p.toFixed(2)}</td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <span style={{ display:'inline-block', padding:'2px 6px', borderRadius:5, fontSize:10, fontWeight:500, background: ch >= 0 ? '#eafaf1' : '#fdedec', color: ch >= 0 ? '#1e8449' : '#922b21' }}>
                          {ch >= 0 ? '+' : ''}{ch.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:11, color: sk > 0 ? '#27ae60' : sk < 0 ? '#c0392b' : 'var(--color-text-secondary)' }}>
                        {sk > 0 ? `+${sk}` : sk === 0 ? '—' : sk}
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <SparkSVG history={history[t.id] || [5,5]} up={ch >= 0} />
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', whiteSpace:'nowrap' }}>
                        <button onClick={() => setTradeModal(t)} style={{ padding:'3px 9px', borderRadius:5, border:'none', background:'#c0392b', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:500 }}>
                          {held > 0 ? 'Trade' : 'Acheter'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Droite */}
        <div>
          {/* Holdings */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Mon portefeuille</div>
            {TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>Aucune position — achetez dans le tableau!</div>
            ) : TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).map(t => {
              const q = myHoldings[t.id]; const p = prices[t.id]?.price || 5; const ch = chgPct(t.id);
              return (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                  <TeamLogo id={t.id} size={26} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:500, fontSize:13 }}>{t.name}</div>
                    <div style={{ fontSize:10, color:'var(--color-text-secondary)' }}>{q.toLocaleString()} actions · ${p.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:500 }}>${(q * p).toFixed(2)}</div>
                    <div style={{ fontSize:11, color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leaderboard */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Classement — {config.name || 'Ma ligue'}</div>
            {leaderboard.map((p, i) => {
              const medals = ['🥇','🥈','🥉','4e','5e','6e','7e','8e'];
              const gain = ((p.val - config.capital) / config.capital * 100);
              return (
                <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:12, background: p.me ? 'var(--color-background-secondary)' : '', borderRadius: p.me ? 6 : 0, paddingLeft: p.me ? 6 : 0 }}>
                  <span style={{ fontSize:16, minWidth:24 }}>{medals[i] || `${i+1}e`}</span>
                  <span style={{ flex:1, fontWeight: p.me ? 500 : 400 }}>{p.name}</span>
                  <span style={{ fontWeight:500 }}>${Math.round(p.val).toLocaleString('fr-CA')}</span>
                  <span style={{ minWidth:52, textAlign:'right', color: gain >= 0 ? '#27ae60' : '#c0392b', fontSize:11 }}>
                    {gain >= 0 ? '+' : ''}{gain.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Impact log */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Journal d'impact LNH</div>
            {impactLog.length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>En attente de résultats LNH...</div>
            ) : impactLog.map((e, i) => (
              <div key={i} style={{ fontSize:11, padding:'5px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', display:'flex', alignItems:'center', gap:7 }}>
                <TeamLogo id={e.team} size={18} />
                <span style={{ flex:1 }}>{e.desc}</span>
                {e.div && <span style={{ color:'#27ae60' }}>+${e.div.toFixed(2)}</span>}
                {!!e.chg && <span style={{ color: e.chg >= 0 ? '#27ae60' : '#c0392b' }}>{e.chg >= 0 ? '+' : ''}{e.chg.toFixed(2)}%</span>}
                <span style={{ color:'var(--color-text-secondary)', minWidth:40, textAlign:'right' }}>{e.ts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tradeModal && (
        <TradeModal team={tradeModal} prices={prices} myHoldings={myHoldings} cash={myCash}
          onBuy={handleBuy} onSell={handleSell} onClose={() => setTradeModal(null)} />
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:16, right:16, background:'var(--color-background-primary)', border:`0.5px solid ${toast.err ? '#c0392b' : 'var(--color-border-secondary)'}`, borderRadius:8, padding:'9px 14px', fontSize:12, zIndex:200, maxWidth:280 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
}{teamId} @ $${effectivePrice.toFixed(2)}`);
    updLeaderboard();
  }

  function handleSell(teamId, qty, orderType, limitPrice) {
    const price = prices[teamId]?.price || 5;
    const effectivePrice = orderType === 'limit' && limitPrice ? limitPrice : price;
    const proc = parseFloat((effectivePrice * qty).toFixed(2));
    setCash(c => parseFloat((c + proc).toFixed(2)));
    setHoldings(prev => ({ ...prev, [teamId]: Math.max(0, (prev[teamId] || 0) - qty) }));
    showToast(`Vendu {'qty.toLocaleString()} actions ${teamId} @ $${effectivePrice.toFixed(2)}`);
    updLeaderboard();
  }

  function updLeaderboard() {
    const portVal = TEAMS.reduce((s, t) => s + (myHoldings[t.id] || 0) * (prices[t.id]?.price || 5), 0);
    const myTotal = myCash + portVal;
    setLeaderboard(prev => prev.map(p => p.me ? { ...p, val: myTotal } : p).sort((a, b) => b.val - a.val));
  }

  function showToast(msg, err = false) {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 2800);
  }

  const portVal = TEAMS.reduce((s, t) => s + (myHoldings[t.id] || 0) * (prices[t.id]?.price || 5), 0);
  const totalVal = myCash + portVal;

  const chgPct = (id) => {
    const h = history[id] || [5, 5];
    return parseFloat(((( prices[id]?.price || 5) - h[0]) / h[0] * 100).toFixed(2));
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, paddingBottom:12, borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ width:34, height:34, background:'#c0392b', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:500, fontSize:13, flexShrink:0 }}>HC</div>
        <div>
          <div style={{ fontSize:17, fontWeight:500 }}>{config.name || 'Ma ligue'}</div>
          <div style={{ fontSize:11, color:'var(--color-text-secondary)' }}>
            <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:'#27ae60', marginRight:5 }}></span>
            Marché ouvert · AMM actif · {config.players} joueurs · Mise réelle {config.mise}$
          </div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ background:'var(--color-background-secondary)', borderRadius:7, padding:'6px 12px', fontSize:12 }}>
            Sylvain B. · <strong>${myCash.toFixed(2)}</strong>
          </div>
          <button onClick={simEvent} style={{ padding:'6px 14px', borderRadius:7, border:'none', background:'#c0392b', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:500 }}>
            Simuler résultat LNH
          </button>
        </div>
      </div>

      {/* Ticker */}
      <div style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'6px 12px', marginBottom:12, overflow:'hidden', whiteSpace:'nowrap', fontSize:11 }}>
        {TEAMS.slice(0, 14).map(t => {
          const ch = chgPct(t.id);
          return (
            <span key={t.id} style={{ marginRight:22 }}>
              <strong>{t.id}</strong> ${(prices[t.id]?.price || 5).toFixed(2)}{' '}
              <span style={{ color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</span>
            </span>
          );
        })}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:10, marginBottom:14 }}>
        {[
          { label:'Valeur portefeuille', val:`$${totalVal.toFixed(2)}`, sub:'liquidités + actions', hi:true },
          { label:'Liquidités',          val:`$${myCash.toFixed(2)}`,   sub:'disponibles' },
          { label:'Dividendes reçus',    val:`$${divTotal.toFixed(2)}`, sub:'cumul', up:true },
          { label:'Événements LNH',      val:eventCount,                sub:'traités ce soir' },
        ].map((m, i) => (
          <div key={i} style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'10px 14px', border: m.hi ? '1.5px solid #c0392b' : 'none' }}>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:3 }}>{m.label}</div>
            <div style={{ fontSize:18, fontWeight:500, color: m.hi ? '#c0392b' : m.up ? '#27ae60' : 'var(--color-text-primary)' }}>{m.val}</div>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {/* Marché */}
        <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>
            Marché — prix à 5 $/action · Spread AMM {config.spread}%
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead><tr>
                {['Équipe','Prix','Var.','Streak','7 jours',''].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'6px 8px', color:'var(--color-text-secondary)', fontWeight:400, borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:11 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {TEAMS.map(t => {
                  const p = prices[t.id]?.price || 5;
                  const ch = chgPct(t.id);
                  const sk = streaks[t.id] || 0;
                  const held = myHoldings[t.id] || 0;
                  return (
                    <tr key={t.id} onMouseEnter={e => e.currentTarget.style.background='var(--color-background-secondary)'} onMouseLeave={e => e.currentTarget.style.background=''}>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', whiteSpace:'nowrap' }}>
                        <TeamLogo id={t.id} size={22} /> {t.name}
                        {held > 0 && <span style={{ marginLeft:5, fontSize:10, background:'#eaf4fb', color:'#1a6fa0', padding:'1px 5px', borderRadius:4, fontWeight:500 }}>{held.toLocaleString()}</span>}
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontWeight:500 }}>${p.toFixed(2)}</td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <span style={{ display:'inline-block', padding:'2px 6px', borderRadius:5, fontSize:10, fontWeight:500, background: ch >= 0 ? '#eafaf1' : '#fdedec', color: ch >= 0 ? '#1e8449' : '#922b21' }}>
                          {ch >= 0 ? '+' : ''}{ch.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:11, color: sk > 0 ? '#27ae60' : sk < 0 ? '#c0392b' : 'var(--color-text-secondary)' }}>
                        {sk > 0 ? `+${sk}` : sk === 0 ? '—' : sk}
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <SparkSVG history={history[t.id] || [5,5]} up={ch >= 0} />
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', whiteSpace:'nowrap' }}>
                        <button onClick={() => setTradeModal(t)} style={{ padding:'3px 9px', borderRadius:5, border:'none', background:'#c0392b', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:500 }}>
                          {held > 0 ? 'Trade' : 'Acheter'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Droite */}
        <div>
          {/* Holdings */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Mon portefeuille</div>
            {TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>Aucune position — achetez dans le tableau!</div>
            ) : TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).map(t => {
              const q = myHoldings[t.id]; const p = prices[t.id]?.price || 5; const ch = chgPct(t.id);
              return (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                  <TeamLogo id={t.id} size={26} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:500, fontSize:13 }}>{t.name}</div>
                    <div style={{ fontSize:10, color:'var(--color-text-secondary)' }}>{q.toLocaleString()} actions · ${p.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:500 }}>${(q * p).toFixed(2)}</div>
                    <div style={{ fontSize:11, color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leaderboard */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Classement — {config.name || 'Ma ligue'}</div>
            {leaderboard.map((p, i) => {
              const medals = ['🥇','🥈','🥉','4e','5e','6e','7e','8e'];
              const gain = ((p.val - config.capital) / config.capital * 100);
              return (
                <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:12, background: p.me ? 'var(--color-background-secondary)' : '', borderRadius: p.me ? 6 : 0, paddingLeft: p.me ? 6 : 0 }}>
                  <span style={{ fontSize:16, minWidth:24 }}>{medals[i] || `${i+1}e`}</span>
                  <span style={{ flex:1, fontWeight: p.me ? 500 : 400 }}>{p.name}</span>
                  <span style={{ fontWeight:500 }}>${Math.round(p.val).toLocaleString('fr-CA')}</span>
                  <span style={{ minWidth:52, textAlign:'right', color: gain >= 0 ? '#27ae60' : '#c0392b', fontSize:11 }}>
                    {gain >= 0 ? '+' : ''}{gain.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Impact log */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Journal d'impact LNH</div>
            {impactLog.length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>En attente de résultats LNH...</div>
            ) : impactLog.map((e, i) => (
              <div key={i} style={{ fontSize:11, padding:'5px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', display:'flex', alignItems:'center', gap:7 }}>
                <TeamLogo id={e.team} size={18} />
                <span style={{ flex:1 }}>{e.desc}</span>
                {e.div && <span style={{ color:'#27ae60' }}>+${e.div.toFixed(2)}</span>}
                {!!e.chg && <span style={{ color: e.chg >= 0 ? '#27ae60' : '#c0392b' }}>{e.chg >= 0 ? '+' : ''}{e.chg.toFixed(2)}%</span>}
                <span style={{ color:'var(--color-text-secondary)', minWidth:40, textAlign:'right' }}>{e.ts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tradeModal && (
        <TradeModal team={tradeModal} prices={prices} myHoldings={myHoldings} cash={myCash}
          onBuy={handleBuy} onSell={handleSell} onClose={() => setTradeModal(null)} />
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:16, right:16, background:'var(--color-background-primary)', border:`0.5px solid ${toast.err ? '#c0392b' : 'var(--color-border-secondary)'}`, borderRadius:8, padding:'9px 14px', fontSize:12, zIndex:200, maxWidth:280 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
}{qty.toLocaleString()} actions {'teamId} @ $${effectivePrice.toFixed(2)}`);
    updLeaderboard();
  }

  function updLeaderboard() {
    const portVal = TEAMS.reduce((s, t) => s + (myHoldings[t.id] || 0) * (prices[t.id]?.price || 5), 0);
    const myTotal = myCash + portVal;
    setLeaderboard(prev => prev.map(p => p.me ? { ...p, val: myTotal } : p).sort((a, b) => b.val - a.val));
  }

  function showToast(msg, err = false) {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 2800);
  }

  const portVal = TEAMS.reduce((s, t) => s + (myHoldings[t.id] || 0) * (prices[t.id]?.price || 5), 0);
  const totalVal = myCash + portVal;

  const chgPct = (id) => {
    const h = history[id] || [5, 5];
    return parseFloat(((( prices[id]?.price || 5) - h[0]) / h[0] * 100).toFixed(2));
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, paddingBottom:12, borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ width:34, height:34, background:'#c0392b', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:500, fontSize:13, flexShrink:0 }}>HC</div>
        <div>
          <div style={{ fontSize:17, fontWeight:500 }}>{config.name || 'Ma ligue'}</div>
          <div style={{ fontSize:11, color:'var(--color-text-secondary)' }}>
            <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:'#27ae60', marginRight:5 }}></span>
            Marché ouvert · AMM actif · {config.players} joueurs · Mise réelle {config.mise}$
          </div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ background:'var(--color-background-secondary)', borderRadius:7, padding:'6px 12px', fontSize:12 }}>
            Sylvain B. · <strong>${myCash.toFixed(2)}</strong>
          </div>
          <button onClick={simEvent} style={{ padding:'6px 14px', borderRadius:7, border:'none', background:'#c0392b', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:500 }}>
            Simuler résultat LNH
          </button>
        </div>
      </div>

      {/* Ticker */}
      <div style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'6px 12px', marginBottom:12, overflow:'hidden', whiteSpace:'nowrap', fontSize:11 }}>
        {TEAMS.slice(0, 14).map(t => {
          const ch = chgPct(t.id);
          return (
            <span key={t.id} style={{ marginRight:22 }}>
              <strong>{t.id}</strong> ${(prices[t.id]?.price || 5).toFixed(2)}{' '}
              <span style={{ color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</span>
            </span>
          );
        })}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:10, marginBottom:14 }}>
        {[
          { label:'Valeur portefeuille', val:`$${totalVal.toFixed(2)}`, sub:'liquidités + actions', hi:true },
          { label:'Liquidités',          val:`$${myCash.toFixed(2)}`,   sub:'disponibles' },
          { label:'Dividendes reçus',    val:`$${divTotal.toFixed(2)}`, sub:'cumul', up:true },
          { label:'Événements LNH',      val:eventCount,                sub:'traités ce soir' },
        ].map((m, i) => (
          <div key={i} style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'10px 14px', border: m.hi ? '1.5px solid #c0392b' : 'none' }}>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:3 }}>{m.label}</div>
            <div style={{ fontSize:18, fontWeight:500, color: m.hi ? '#c0392b' : m.up ? '#27ae60' : 'var(--color-text-primary)' }}>{m.val}</div>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {/* Marché */}
        <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>
            Marché — prix à 5 $/action · Spread AMM {config.spread}%
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead><tr>
                {['Équipe','Prix','Var.','Streak','7 jours',''].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'6px 8px', color:'var(--color-text-secondary)', fontWeight:400, borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:11 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {TEAMS.map(t => {
                  const p = prices[t.id]?.price || 5;
                  const ch = chgPct(t.id);
                  const sk = streaks[t.id] || 0;
                  const held = myHoldings[t.id] || 0;
                  return (
                    <tr key={t.id} onMouseEnter={e => e.currentTarget.style.background='var(--color-background-secondary)'} onMouseLeave={e => e.currentTarget.style.background=''}>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', whiteSpace:'nowrap' }}>
                        <TeamLogo id={t.id} size={22} /> {t.name}
                        {held > 0 && <span style={{ marginLeft:5, fontSize:10, background:'#eaf4fb', color:'#1a6fa0', padding:'1px 5px', borderRadius:4, fontWeight:500 }}>{held.toLocaleString()}</span>}
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontWeight:500 }}>${p.toFixed(2)}</td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <span style={{ display:'inline-block', padding:'2px 6px', borderRadius:5, fontSize:10, fontWeight:500, background: ch >= 0 ? '#eafaf1' : '#fdedec', color: ch >= 0 ? '#1e8449' : '#922b21' }}>
                          {ch >= 0 ? '+' : ''}{ch.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:11, color: sk > 0 ? '#27ae60' : sk < 0 ? '#c0392b' : 'var(--color-text-secondary)' }}>
                        {sk > 0 ? `+${sk}` : sk === 0 ? '—' : sk}
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <SparkSVG history={history[t.id] || [5,5]} up={ch >= 0} />
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', whiteSpace:'nowrap' }}>
                        <button onClick={() => setTradeModal(t)} style={{ padding:'3px 9px', borderRadius:5, border:'none', background:'#c0392b', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:500 }}>
                          {held > 0 ? 'Trade' : 'Acheter'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Droite */}
        <div>
          {/* Holdings */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Mon portefeuille</div>
            {TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>Aucune position — achetez dans le tableau!</div>
            ) : TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).map(t => {
              const q = myHoldings[t.id]; const p = prices[t.id]?.price || 5; const ch = chgPct(t.id);
              return (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                  <TeamLogo id={t.id} size={26} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:500, fontSize:13 }}>{t.name}</div>
                    <div style={{ fontSize:10, color:'var(--color-text-secondary)' }}>{q.toLocaleString()} actions · ${p.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:500 }}>${(q * p).toFixed(2)}</div>
                    <div style={{ fontSize:11, color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leaderboard */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Classement — {config.name || 'Ma ligue'}</div>
            {leaderboard.map((p, i) => {
              const medals = ['🥇','🥈','🥉','4e','5e','6e','7e','8e'];
              const gain = ((p.val - config.capital) / config.capital * 100);
              return (
                <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:12, background: p.me ? 'var(--color-background-secondary)' : '', borderRadius: p.me ? 6 : 0, paddingLeft: p.me ? 6 : 0 }}>
                  <span style={{ fontSize:16, minWidth:24 }}>{medals[i] || `${i+1}e`}</span>
                  <span style={{ flex:1, fontWeight: p.me ? 500 : 400 }}>{p.name}</span>
                  <span style={{ fontWeight:500 }}>${Math.round(p.val).toLocaleString('fr-CA')}</span>
                  <span style={{ minWidth:52, textAlign:'right', color: gain >= 0 ? '#27ae60' : '#c0392b', fontSize:11 }}>
                    {gain >= 0 ? '+' : ''}{gain.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Impact log */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Journal d'impact LNH</div>
            {impactLog.length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>En attente de résultats LNH...</div>
            ) : impactLog.map((e, i) => (
              <div key={i} style={{ fontSize:11, padding:'5px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', display:'flex', alignItems:'center', gap:7 }}>
                <TeamLogo id={e.team} size={18} />
                <span style={{ flex:1 }}>{e.desc}</span>
                {e.div && <span style={{ color:'#27ae60' }}>+${e.div.toFixed(2)}</span>}
                {!!e.chg && <span style={{ color: e.chg >= 0 ? '#27ae60' : '#c0392b' }}>{e.chg >= 0 ? '+' : ''}{e.chg.toFixed(2)}%</span>}
                <span style={{ color:'var(--color-text-secondary)', minWidth:40, textAlign:'right' }}>{e.ts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tradeModal && (
        <TradeModal team={tradeModal} prices={prices} myHoldings={myHoldings} cash={myCash}
          onBuy={handleBuy} onSell={handleSell} onClose={() => setTradeModal(null)} />
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:16, right:16, background:'var(--color-background-primary)', border:`0.5px solid ${toast.err ? '#c0392b' : 'var(--color-border-secondary)'}`, borderRadius:8, padding:'9px 14px', fontSize:12, zIndex:200, maxWidth:280 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
}{teamId} @ $${effectivePrice.toFixed(2)}`);
    updLeaderboard();
  }

  function updLeaderboard() {
    const portVal = TEAMS.reduce((s, t) => s + (myHoldings[t.id] || 0) * (prices[t.id]?.price || 5), 0);
    const myTotal = myCash + portVal;
    setLeaderboard(prev => prev.map(p => p.me ? { ...p, val: myTotal } : p).sort((a, b) => b.val - a.val));
  }

  function showToast(msg, err = false) {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 2800);
  }

  const portVal = TEAMS.reduce((s, t) => s + (myHoldings[t.id] || 0) * (prices[t.id]?.price || 5), 0);
  const totalVal = myCash + portVal;

  const chgPct = (id) => {
    const h = history[id] || [5, 5];
    return parseFloat(((( prices[id]?.price || 5) - h[0]) / h[0] * 100).toFixed(2));
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, paddingBottom:12, borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ width:34, height:34, background:'#c0392b', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:500, fontSize:13, flexShrink:0 }}>HC</div>
        <div>
          <div style={{ fontSize:17, fontWeight:500 }}>{config.name || 'Ma ligue'}</div>
          <div style={{ fontSize:11, color:'var(--color-text-secondary)' }}>
            <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:'#27ae60', marginRight:5 }}></span>
            Marché ouvert · AMM actif · {config.players} joueurs · Mise réelle {config.mise}$
          </div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ background:'var(--color-background-secondary)', borderRadius:7, padding:'6px 12px', fontSize:12 }}>
            Sylvain B. · <strong>{'myCash.toFixed(2)}</strong>
          </div>
          <button onClick={simEvent} style={{ padding:'6px 14px', borderRadius:7, border:'none', background:'#c0392b', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:500 }}>
            Simuler résultat LNH
          </button>
        </div>
      </div>

      {/* Ticker */}
      <div style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'6px 12px', marginBottom:12, overflow:'hidden', whiteSpace:'nowrap', fontSize:11 }}>
        {TEAMS.slice(0, 14).map(t => {
          const ch = chgPct(t.id);
          return (
            <span key={t.id} style={{ marginRight:22 }}>
              <strong>{t.id}</strong> ${(prices[t.id]?.price || 5).toFixed(2)}{' '}
              <span style={{ color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</span>
            </span>
          );
        })}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:10, marginBottom:14 }}>
        {[
          { label:'Valeur portefeuille', val:`$${totalVal.toFixed(2)}`, sub:'liquidités + actions', hi:true },
          { label:'Liquidités',          val:`$${myCash.toFixed(2)}`,   sub:'disponibles' },
          { label:'Dividendes reçus',    val:`$${divTotal.toFixed(2)}`, sub:'cumul', up:true },
          { label:'Événements LNH',      val:eventCount,                sub:'traités ce soir' },
        ].map((m, i) => (
          <div key={i} style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'10px 14px', border: m.hi ? '1.5px solid #c0392b' : 'none' }}>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:3 }}>{m.label}</div>
            <div style={{ fontSize:18, fontWeight:500, color: m.hi ? '#c0392b' : m.up ? '#27ae60' : 'var(--color-text-primary)' }}>{m.val}</div>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {/* Marché */}
        <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>
            Marché — prix à 5 $/action · Spread AMM {config.spread}%
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead><tr>
                {['Équipe','Prix','Var.','Streak','7 jours',''].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'6px 8px', color:'var(--color-text-secondary)', fontWeight:400, borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:11 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {TEAMS.map(t => {
                  const p = prices[t.id]?.price || 5;
                  const ch = chgPct(t.id);
                  const sk = streaks[t.id] || 0;
                  const held = myHoldings[t.id] || 0;
                  return (
                    <tr key={t.id} onMouseEnter={e => e.currentTarget.style.background='var(--color-background-secondary)'} onMouseLeave={e => e.currentTarget.style.background=''}>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', whiteSpace:'nowrap' }}>
                        <TeamLogo id={t.id} size={22} /> {t.name}
                        {held > 0 && <span style={{ marginLeft:5, fontSize:10, background:'#eaf4fb', color:'#1a6fa0', padding:'1px 5px', borderRadius:4, fontWeight:500 }}>{held.toLocaleString()}</span>}
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontWeight:500 }}>${p.toFixed(2)}</td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <span style={{ display:'inline-block', padding:'2px 6px', borderRadius:5, fontSize:10, fontWeight:500, background: ch >= 0 ? '#eafaf1' : '#fdedec', color: ch >= 0 ? '#1e8449' : '#922b21' }}>
                          {ch >= 0 ? '+' : ''}{ch.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:11, color: sk > 0 ? '#27ae60' : sk < 0 ? '#c0392b' : 'var(--color-text-secondary)' }}>
                        {sk > 0 ? `+${sk}` : sk === 0 ? '—' : sk}
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <SparkSVG history={history[t.id] || [5,5]} up={ch >= 0} />
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', whiteSpace:'nowrap' }}>
                        <button onClick={() => setTradeModal(t)} style={{ padding:'3px 9px', borderRadius:5, border:'none', background:'#c0392b', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:500 }}>
                          {held > 0 ? 'Trade' : 'Acheter'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Droite */}
        <div>
          {/* Holdings */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Mon portefeuille</div>
            {TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>Aucune position — achetez dans le tableau!</div>
            ) : TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).map(t => {
              const q = myHoldings[t.id]; const p = prices[t.id]?.price || 5; const ch = chgPct(t.id);
              return (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                  <TeamLogo id={t.id} size={26} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:500, fontSize:13 }}>{t.name}</div>
                    <div style={{ fontSize:10, color:'var(--color-text-secondary)' }}>{q.toLocaleString()} actions · ${p.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:500 }}>${(q * p).toFixed(2)}</div>
                    <div style={{ fontSize:11, color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leaderboard */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Classement — {config.name || 'Ma ligue'}</div>
            {leaderboard.map((p, i) => {
              const medals = ['🥇','🥈','🥉','4e','5e','6e','7e','8e'];
              const gain = ((p.val - config.capital) / config.capital * 100);
              return (
                <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:12, background: p.me ? 'var(--color-background-secondary)' : '', borderRadius: p.me ? 6 : 0, paddingLeft: p.me ? 6 : 0 }}>
                  <span style={{ fontSize:16, minWidth:24 }}>{medals[i] || `${i+1}e`}</span>
                  <span style={{ flex:1, fontWeight: p.me ? 500 : 400 }}>{p.name}</span>
                  <span style={{ fontWeight:500 }}>${Math.round(p.val).toLocaleString('fr-CA')}</span>
                  <span style={{ minWidth:52, textAlign:'right', color: gain >= 0 ? '#27ae60' : '#c0392b', fontSize:11 }}>
                    {gain >= 0 ? '+' : ''}{gain.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Impact log */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Journal d'impact LNH</div>
            {impactLog.length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>En attente de résultats LNH...</div>
            ) : impactLog.map((e, i) => (
              <div key={i} style={{ fontSize:11, padding:'5px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', display:'flex', alignItems:'center', gap:7 }}>
                <TeamLogo id={e.team} size={18} />
                <span style={{ flex:1 }}>{e.desc}</span>
                {e.div && <span style={{ color:'#27ae60' }}>+${e.div.toFixed(2)}</span>}
                {!!e.chg && <span style={{ color: e.chg >= 0 ? '#27ae60' : '#c0392b' }}>{e.chg >= 0 ? '+' : ''}{e.chg.toFixed(2)}%</span>}
                <span style={{ color:'var(--color-text-secondary)', minWidth:40, textAlign:'right' }}>{e.ts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tradeModal && (
        <TradeModal team={tradeModal} prices={prices} myHoldings={myHoldings} cash={myCash}
          onBuy={handleBuy} onSell={handleSell} onClose={() => setTradeModal(null)} />
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:16, right:16, background:'var(--color-background-primary)', border:`0.5px solid ${toast.err ? '#c0392b' : 'var(--color-border-secondary)'}`, borderRadius:8, padding:'9px 14px', fontSize:12, zIndex:200, maxWidth:280 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
}{myCash.toFixed(2)}</strong>
          </div>
          <button onClick={simEvent} style={{ padding:'6px 14px', borderRadius:7, border:'none', background:'#c0392b', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:500 }}>
            Simuler résultat LNH
          </button>
        </div>
      </div>

      {/* Ticker */}
      <div style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'6px 12px', marginBottom:12, overflow:'hidden', whiteSpace:'nowrap', fontSize:11 }}>
        {TEAMS.slice(0, 14).map(t => {
          const ch = chgPct(t.id);
          return (
            <span key={t.id} style={{ marginRight:22 }}>
              <strong>{t.id}</strong> {'(prices[t.id]?.price || 5).toFixed(2)}{' '}
              <span style={{ color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</span>
            </span>
          );
        })}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:10, marginBottom:14 }}>
        {[
          { label:'Valeur portefeuille', val:`$${totalVal.toFixed(2)}`, sub:'liquidités + actions', hi:true },
          { label:'Liquidités',          val:`$${myCash.toFixed(2)}`,   sub:'disponibles' },
          { label:'Dividendes reçus',    val:`$${divTotal.toFixed(2)}`, sub:'cumul', up:true },
          { label:'Événements LNH',      val:eventCount,                sub:'traités ce soir' },
        ].map((m, i) => (
          <div key={i} style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'10px 14px', border: m.hi ? '1.5px solid #c0392b' : 'none' }}>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:3 }}>{m.label}</div>
            <div style={{ fontSize:18, fontWeight:500, color: m.hi ? '#c0392b' : m.up ? '#27ae60' : 'var(--color-text-primary)' }}>{m.val}</div>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {/* Marché */}
        <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>
            Marché — prix à 5 $/action · Spread AMM {config.spread}%
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead><tr>
                {['Équipe','Prix','Var.','Streak','7 jours',''].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'6px 8px', color:'var(--color-text-secondary)', fontWeight:400, borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:11 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {TEAMS.map(t => {
                  const p = prices[t.id]?.price || 5;
                  const ch = chgPct(t.id);
                  const sk = streaks[t.id] || 0;
                  const held = myHoldings[t.id] || 0;
                  return (
                    <tr key={t.id} onMouseEnter={e => e.currentTarget.style.background='var(--color-background-secondary)'} onMouseLeave={e => e.currentTarget.style.background=''}>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', whiteSpace:'nowrap' }}>
                        <TeamLogo id={t.id} size={22} /> {t.name}
                        {held > 0 && <span style={{ marginLeft:5, fontSize:10, background:'#eaf4fb', color:'#1a6fa0', padding:'1px 5px', borderRadius:4, fontWeight:500 }}>{held.toLocaleString()}</span>}
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontWeight:500 }}>${p.toFixed(2)}</td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <span style={{ display:'inline-block', padding:'2px 6px', borderRadius:5, fontSize:10, fontWeight:500, background: ch >= 0 ? '#eafaf1' : '#fdedec', color: ch >= 0 ? '#1e8449' : '#922b21' }}>
                          {ch >= 0 ? '+' : ''}{ch.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:11, color: sk > 0 ? '#27ae60' : sk < 0 ? '#c0392b' : 'var(--color-text-secondary)' }}>
                        {sk > 0 ? `+${sk}` : sk === 0 ? '—' : sk}
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <SparkSVG history={history[t.id] || [5,5]} up={ch >= 0} />
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', whiteSpace:'nowrap' }}>
                        <button onClick={() => setTradeModal(t)} style={{ padding:'3px 9px', borderRadius:5, border:'none', background:'#c0392b', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:500 }}>
                          {held > 0 ? 'Trade' : 'Acheter'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Droite */}
        <div>
          {/* Holdings */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Mon portefeuille</div>
            {TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>Aucune position — achetez dans le tableau!</div>
            ) : TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).map(t => {
              const q = myHoldings[t.id]; const p = prices[t.id]?.price || 5; const ch = chgPct(t.id);
              return (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                  <TeamLogo id={t.id} size={26} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:500, fontSize:13 }}>{t.name}</div>
                    <div style={{ fontSize:10, color:'var(--color-text-secondary)' }}>{q.toLocaleString()} actions · ${p.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:500 }}>${(q * p).toFixed(2)}</div>
                    <div style={{ fontSize:11, color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leaderboard */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Classement — {config.name || 'Ma ligue'}</div>
            {leaderboard.map((p, i) => {
              const medals = ['🥇','🥈','🥉','4e','5e','6e','7e','8e'];
              const gain = ((p.val - config.capital) / config.capital * 100);
              return (
                <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:12, background: p.me ? 'var(--color-background-secondary)' : '', borderRadius: p.me ? 6 : 0, paddingLeft: p.me ? 6 : 0 }}>
                  <span style={{ fontSize:16, minWidth:24 }}>{medals[i] || `${i+1}e`}</span>
                  <span style={{ flex:1, fontWeight: p.me ? 500 : 400 }}>{p.name}</span>
                  <span style={{ fontWeight:500 }}>${Math.round(p.val).toLocaleString('fr-CA')}</span>
                  <span style={{ minWidth:52, textAlign:'right', color: gain >= 0 ? '#27ae60' : '#c0392b', fontSize:11 }}>
                    {gain >= 0 ? '+' : ''}{gain.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Impact log */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Journal d'impact LNH</div>
            {impactLog.length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>En attente de résultats LNH...</div>
            ) : impactLog.map((e, i) => (
              <div key={i} style={{ fontSize:11, padding:'5px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', display:'flex', alignItems:'center', gap:7 }}>
                <TeamLogo id={e.team} size={18} />
                <span style={{ flex:1 }}>{e.desc}</span>
                {e.div && <span style={{ color:'#27ae60' }}>+${e.div.toFixed(2)}</span>}
                {!!e.chg && <span style={{ color: e.chg >= 0 ? '#27ae60' : '#c0392b' }}>{e.chg >= 0 ? '+' : ''}{e.chg.toFixed(2)}%</span>}
                <span style={{ color:'var(--color-text-secondary)', minWidth:40, textAlign:'right' }}>{e.ts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tradeModal && (
        <TradeModal team={tradeModal} prices={prices} myHoldings={myHoldings} cash={myCash}
          onBuy={handleBuy} onSell={handleSell} onClose={() => setTradeModal(null)} />
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:16, right:16, background:'var(--color-background-primary)', border:`0.5px solid ${toast.err ? '#c0392b' : 'var(--color-border-secondary)'}`, borderRadius:8, padding:'9px 14px', fontSize:12, zIndex:200, maxWidth:280 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
}{(prices[t.id]?.price || 5).toFixed(2)}{' '}
              <span style={{ color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</span>
            </span>
          );
        })}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:10, marginBottom:14 }}>
        {[
          { label:'Valeur portefeuille', val:`$${totalVal.toFixed(2)}`, sub:'liquidités + actions', hi:true },
          { label:'Liquidités',          val:`$${myCash.toFixed(2)}`,   sub:'disponibles' },
          { label:'Dividendes reçus',    val:`$${divTotal.toFixed(2)}`, sub:'cumul', up:true },
          { label:'Événements LNH',      val:eventCount,                sub:'traités ce soir' },
        ].map((m, i) => (
          <div key={i} style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'10px 14px', border: m.hi ? '1.5px solid #c0392b' : 'none' }}>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:3 }}>{m.label}</div>
            <div style={{ fontSize:18, fontWeight:500, color: m.hi ? '#c0392b' : m.up ? '#27ae60' : 'var(--color-text-primary)' }}>{m.val}</div>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {/* Marché */}
        <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>
            Marché — prix à 5 $/action · Spread AMM {config.spread}%
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead><tr>
                {['Équipe','Prix','Var.','Streak','7 jours',''].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'6px 8px', color:'var(--color-text-secondary)', fontWeight:400, borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:11 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {TEAMS.map(t => {
                  const p = prices[t.id]?.price || 5;
                  const ch = chgPct(t.id);
                  const sk = streaks[t.id] || 0;
                  const held = myHoldings[t.id] || 0;
                  return (
                    <tr key={t.id} onMouseEnter={e => e.currentTarget.style.background='var(--color-background-secondary)'} onMouseLeave={e => e.currentTarget.style.background=''}>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', whiteSpace:'nowrap' }}>
                        <TeamLogo id={t.id} size={22} /> {t.name}
                        {held > 0 && <span style={{ marginLeft:5, fontSize:10, background:'#eaf4fb', color:'#1a6fa0', padding:'1px 5px', borderRadius:4, fontWeight:500 }}>{held.toLocaleString()}</span>}
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontWeight:500 }}>{'p.toFixed(2)}</td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <span style={{ display:'inline-block', padding:'2px 6px', borderRadius:5, fontSize:10, fontWeight:500, background: ch >= 0 ? '#eafaf1' : '#fdedec', color: ch >= 0 ? '#1e8449' : '#922b21' }}>
                          {ch >= 0 ? '+' : ''}{ch.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:11, color: sk > 0 ? '#27ae60' : sk < 0 ? '#c0392b' : 'var(--color-text-secondary)' }}>
                        {sk > 0 ? `+${sk}` : sk === 0 ? '—' : sk}
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <SparkSVG history={history[t.id] || [5,5]} up={ch >= 0} />
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', whiteSpace:'nowrap' }}>
                        <button onClick={() => setTradeModal(t)} style={{ padding:'3px 9px', borderRadius:5, border:'none', background:'#c0392b', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:500 }}>
                          {held > 0 ? 'Trade' : 'Acheter'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Droite */}
        <div>
          {/* Holdings */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Mon portefeuille</div>
            {TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>Aucune position — achetez dans le tableau!</div>
            ) : TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).map(t => {
              const q = myHoldings[t.id]; const p = prices[t.id]?.price || 5; const ch = chgPct(t.id);
              return (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                  <TeamLogo id={t.id} size={26} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:500, fontSize:13 }}>{t.name}</div>
                    <div style={{ fontSize:10, color:'var(--color-text-secondary)' }}>{q.toLocaleString()} actions · ${p.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:500 }}>${(q * p).toFixed(2)}</div>
                    <div style={{ fontSize:11, color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leaderboard */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Classement — {config.name || 'Ma ligue'}</div>
            {leaderboard.map((p, i) => {
              const medals = ['🥇','🥈','🥉','4e','5e','6e','7e','8e'];
              const gain = ((p.val - config.capital) / config.capital * 100);
              return (
                <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:12, background: p.me ? 'var(--color-background-secondary)' : '', borderRadius: p.me ? 6 : 0, paddingLeft: p.me ? 6 : 0 }}>
                  <span style={{ fontSize:16, minWidth:24 }}>{medals[i] || `${i+1}e`}</span>
                  <span style={{ flex:1, fontWeight: p.me ? 500 : 400 }}>{p.name}</span>
                  <span style={{ fontWeight:500 }}>${Math.round(p.val).toLocaleString('fr-CA')}</span>
                  <span style={{ minWidth:52, textAlign:'right', color: gain >= 0 ? '#27ae60' : '#c0392b', fontSize:11 }}>
                    {gain >= 0 ? '+' : ''}{gain.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Impact log */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Journal d'impact LNH</div>
            {impactLog.length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>En attente de résultats LNH...</div>
            ) : impactLog.map((e, i) => (
              <div key={i} style={{ fontSize:11, padding:'5px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', display:'flex', alignItems:'center', gap:7 }}>
                <TeamLogo id={e.team} size={18} />
                <span style={{ flex:1 }}>{e.desc}</span>
                {e.div && <span style={{ color:'#27ae60' }}>+${e.div.toFixed(2)}</span>}
                {!!e.chg && <span style={{ color: e.chg >= 0 ? '#27ae60' : '#c0392b' }}>{e.chg >= 0 ? '+' : ''}{e.chg.toFixed(2)}%</span>}
                <span style={{ color:'var(--color-text-secondary)', minWidth:40, textAlign:'right' }}>{e.ts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tradeModal && (
        <TradeModal team={tradeModal} prices={prices} myHoldings={myHoldings} cash={myCash}
          onBuy={handleBuy} onSell={handleSell} onClose={() => setTradeModal(null)} />
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:16, right:16, background:'var(--color-background-primary)', border:`0.5px solid ${toast.err ? '#c0392b' : 'var(--color-border-secondary)'}`, borderRadius:8, padding:'9px 14px', fontSize:12, zIndex:200, maxWidth:280 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
}{p.toFixed(2)}</td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <span style={{ display:'inline-block', padding:'2px 6px', borderRadius:5, fontSize:10, fontWeight:500, background: ch >= 0 ? '#eafaf1' : '#fdedec', color: ch >= 0 ? '#1e8449' : '#922b21' }}>
                          {ch >= 0 ? '+' : ''}{ch.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:11, color: sk > 0 ? '#27ae60' : sk < 0 ? '#c0392b' : 'var(--color-text-secondary)' }}>
                        {sk > 0 ? `+{'sk}` : sk === 0 ? '—' : sk}
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <SparkSVG history={history[t.id] || [5,5]} up={ch >= 0} />
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', whiteSpace:'nowrap' }}>
                        <button onClick={() => setTradeModal(t)} style={{ padding:'3px 9px', borderRadius:5, border:'none', background:'#c0392b', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:500 }}>
                          {held > 0 ? 'Trade' : 'Acheter'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Droite */}
        <div>
          {/* Holdings */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Mon portefeuille</div>
            {TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>Aucune position — achetez dans le tableau!</div>
            ) : TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).map(t => {
              const q = myHoldings[t.id]; const p = prices[t.id]?.price || 5; const ch = chgPct(t.id);
              return (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                  <TeamLogo id={t.id} size={26} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:500, fontSize:13 }}>{t.name}</div>
                    <div style={{ fontSize:10, color:'var(--color-text-secondary)' }}>{q.toLocaleString()} actions · ${p.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:500 }}>${(q * p).toFixed(2)}</div>
                    <div style={{ fontSize:11, color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leaderboard */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Classement — {config.name || 'Ma ligue'}</div>
            {leaderboard.map((p, i) => {
              const medals = ['🥇','🥈','🥉','4e','5e','6e','7e','8e'];
              const gain = ((p.val - config.capital) / config.capital * 100);
              return (
                <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:12, background: p.me ? 'var(--color-background-secondary)' : '', borderRadius: p.me ? 6 : 0, paddingLeft: p.me ? 6 : 0 }}>
                  <span style={{ fontSize:16, minWidth:24 }}>{medals[i] || `${i+1}e`}</span>
                  <span style={{ flex:1, fontWeight: p.me ? 500 : 400 }}>{p.name}</span>
                  <span style={{ fontWeight:500 }}>${Math.round(p.val).toLocaleString('fr-CA')}</span>
                  <span style={{ minWidth:52, textAlign:'right', color: gain >= 0 ? '#27ae60' : '#c0392b', fontSize:11 }}>
                    {gain >= 0 ? '+' : ''}{gain.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Impact log */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Journal d'impact LNH</div>
            {impactLog.length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>En attente de résultats LNH...</div>
            ) : impactLog.map((e, i) => (
              <div key={i} style={{ fontSize:11, padding:'5px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', display:'flex', alignItems:'center', gap:7 }}>
                <TeamLogo id={e.team} size={18} />
                <span style={{ flex:1 }}>{e.desc}</span>
                {e.div && <span style={{ color:'#27ae60' }}>+${e.div.toFixed(2)}</span>}
                {!!e.chg && <span style={{ color: e.chg >= 0 ? '#27ae60' : '#c0392b' }}>{e.chg >= 0 ? '+' : ''}{e.chg.toFixed(2)}%</span>}
                <span style={{ color:'var(--color-text-secondary)', minWidth:40, textAlign:'right' }}>{e.ts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tradeModal && (
        <TradeModal team={tradeModal} prices={prices} myHoldings={myHoldings} cash={myCash}
          onBuy={handleBuy} onSell={handleSell} onClose={() => setTradeModal(null)} />
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:16, right:16, background:'var(--color-background-primary)', border:`0.5px solid ${toast.err ? '#c0392b' : 'var(--color-border-secondary)'}`, borderRadius:8, padding:'9px 14px', fontSize:12, zIndex:200, maxWidth:280 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
}{sk}` : sk === 0 ? '—' : sk}
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <SparkSVG history={history[t.id] || [5,5]} up={ch >= 0} />
                      </td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', whiteSpace:'nowrap' }}>
                        <button onClick={() => setTradeModal(t)} style={{ padding:'3px 9px', borderRadius:5, border:'none', background:'#c0392b', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:500 }}>
                          {held > 0 ? 'Trade' : 'Acheter'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Droite */}
        <div>
          {/* Holdings */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Mon portefeuille</div>
            {TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>Aucune position — achetez dans le tableau!</div>
            ) : TEAMS.filter(t => (myHoldings[t.id] || 0) > 0).map(t => {
              const q = myHoldings[t.id]; const p = prices[t.id]?.price || 5; const ch = chgPct(t.id);
              return (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                  <TeamLogo id={t.id} size={26} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:500, fontSize:13 }}>{t.name}</div>
                    <div style={{ fontSize:10, color:'var(--color-text-secondary)' }}>{q.toLocaleString()} actions · {'p.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:500 }}>${(q * p).toFixed(2)}</div>
                    <div style={{ fontSize:11, color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leaderboard */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Classement — {config.name || 'Ma ligue'}</div>
            {leaderboard.map((p, i) => {
              const medals = ['🥇','🥈','🥉','4e','5e','6e','7e','8e'];
              const gain = ((p.val - config.capital) / config.capital * 100);
              return (
                <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:12, background: p.me ? 'var(--color-background-secondary)' : '', borderRadius: p.me ? 6 : 0, paddingLeft: p.me ? 6 : 0 }}>
                  <span style={{ fontSize:16, minWidth:24 }}>{medals[i] || `${i+1}e`}</span>
                  <span style={{ flex:1, fontWeight: p.me ? 500 : 400 }}>{p.name}</span>
                  <span style={{ fontWeight:500 }}>${Math.round(p.val).toLocaleString('fr-CA')}</span>
                  <span style={{ minWidth:52, textAlign:'right', color: gain >= 0 ? '#27ae60' : '#c0392b', fontSize:11 }}>
                    {gain >= 0 ? '+' : ''}{gain.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Impact log */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Journal d'impact LNH</div>
            {impactLog.length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>En attente de résultats LNH...</div>
            ) : impactLog.map((e, i) => (
              <div key={i} style={{ fontSize:11, padding:'5px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', display:'flex', alignItems:'center', gap:7 }}>
                <TeamLogo id={e.team} size={18} />
                <span style={{ flex:1 }}>{e.desc}</span>
                {e.div && <span style={{ color:'#27ae60' }}>+${e.div.toFixed(2)}</span>}
                {!!e.chg && <span style={{ color: e.chg >= 0 ? '#27ae60' : '#c0392b' }}>{e.chg >= 0 ? '+' : ''}{e.chg.toFixed(2)}%</span>}
                <span style={{ color:'var(--color-text-secondary)', minWidth:40, textAlign:'right' }}>{e.ts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tradeModal && (
        <TradeModal team={tradeModal} prices={prices} myHoldings={myHoldings} cash={myCash}
          onBuy={handleBuy} onSell={handleSell} onClose={() => setTradeModal(null)} />
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:16, right:16, background:'var(--color-background-primary)', border:`0.5px solid ${toast.err ? '#c0392b' : 'var(--color-border-secondary)'}`, borderRadius:8, padding:'9px 14px', fontSize:12, zIndex:200, maxWidth:280 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
}{p.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:500 }}>{'(q * p).toFixed(2)}</div>
                    <div style={{ fontSize:11, color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leaderboard */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Classement — {config.name || 'Ma ligue'}</div>
            {leaderboard.map((p, i) => {
              const medals = ['🥇','🥈','🥉','4e','5e','6e','7e','8e'];
              const gain = ((p.val - config.capital) / config.capital * 100);
              return (
                <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:12, background: p.me ? 'var(--color-background-secondary)' : '', borderRadius: p.me ? 6 : 0, paddingLeft: p.me ? 6 : 0 }}>
                  <span style={{ fontSize:16, minWidth:24 }}>{medals[i] || `${i+1}e`}</span>
                  <span style={{ flex:1, fontWeight: p.me ? 500 : 400 }}>{p.name}</span>
                  <span style={{ fontWeight:500 }}>${Math.round(p.val).toLocaleString('fr-CA')}</span>
                  <span style={{ minWidth:52, textAlign:'right', color: gain >= 0 ? '#27ae60' : '#c0392b', fontSize:11 }}>
                    {gain >= 0 ? '+' : ''}{gain.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Impact log */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Journal d'impact LNH</div>
            {impactLog.length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>En attente de résultats LNH...</div>
            ) : impactLog.map((e, i) => (
              <div key={i} style={{ fontSize:11, padding:'5px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', display:'flex', alignItems:'center', gap:7 }}>
                <TeamLogo id={e.team} size={18} />
                <span style={{ flex:1 }}>{e.desc}</span>
                {e.div && <span style={{ color:'#27ae60' }}>+${e.div.toFixed(2)}</span>}
                {!!e.chg && <span style={{ color: e.chg >= 0 ? '#27ae60' : '#c0392b' }}>{e.chg >= 0 ? '+' : ''}{e.chg.toFixed(2)}%</span>}
                <span style={{ color:'var(--color-text-secondary)', minWidth:40, textAlign:'right' }}>{e.ts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tradeModal && (
        <TradeModal team={tradeModal} prices={prices} myHoldings={myHoldings} cash={myCash}
          onBuy={handleBuy} onSell={handleSell} onClose={() => setTradeModal(null)} />
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:16, right:16, background:'var(--color-background-primary)', border:`0.5px solid ${toast.err ? '#c0392b' : 'var(--color-border-secondary)'}`, borderRadius:8, padding:'9px 14px', fontSize:12, zIndex:200, maxWidth:280 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
}{(q * p).toFixed(2)}</div>
                    <div style={{ fontSize:11, color: ch >= 0 ? '#27ae60' : '#c0392b' }}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leaderboard */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Classement — {config.name || 'Ma ligue'}</div>
            {leaderboard.map((p, i) => {
              const medals = ['🥇','🥈','🥉','4e','5e','6e','7e','8e'];
              const gain = ((p.val - config.capital) / config.capital * 100);
              return (
                <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:12, background: p.me ? 'var(--color-background-secondary)' : '', borderRadius: p.me ? 6 : 0, paddingLeft: p.me ? 6 : 0 }}>
                  <span style={{ fontSize:16, minWidth:24 }}>{medals[i] || `${i+1}e`}</span>
                  <span style={{ flex:1, fontWeight: p.me ? 500 : 400 }}>{p.name}</span>
                  <span style={{ fontWeight:500 }}>{'Math.round(p.val).toLocaleString('fr-CA')}</span>
                  <span style={{ minWidth:52, textAlign:'right', color: gain >= 0 ? '#27ae60' : '#c0392b', fontSize:11 }}>
                    {gain >= 0 ? '+' : ''}{gain.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Impact log */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Journal d'impact LNH</div>
            {impactLog.length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>En attente de résultats LNH...</div>
            ) : impactLog.map((e, i) => (
              <div key={i} style={{ fontSize:11, padding:'5px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', display:'flex', alignItems:'center', gap:7 }}>
                <TeamLogo id={e.team} size={18} />
                <span style={{ flex:1 }}>{e.desc}</span>
                {e.div && <span style={{ color:'#27ae60' }}>+${e.div.toFixed(2)}</span>}
                {!!e.chg && <span style={{ color: e.chg >= 0 ? '#27ae60' : '#c0392b' }}>{e.chg >= 0 ? '+' : ''}{e.chg.toFixed(2)}%</span>}
                <span style={{ color:'var(--color-text-secondary)', minWidth:40, textAlign:'right' }}>{e.ts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tradeModal && (
        <TradeModal team={tradeModal} prices={prices} myHoldings={myHoldings} cash={myCash}
          onBuy={handleBuy} onSell={handleSell} onClose={() => setTradeModal(null)} />
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:16, right:16, background:'var(--color-background-primary)', border:`0.5px solid ${toast.err ? '#c0392b' : 'var(--color-border-secondary)'}`, borderRadius:8, padding:'9px 14px', fontSize:12, zIndex:200, maxWidth:280 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
}{Math.round(p.val).toLocaleString('fr-CA')}</span>
                  <span style={{ minWidth:52, textAlign:'right', color: gain >= 0 ? '#27ae60' : '#c0392b', fontSize:11 }}>
                    {gain >= 0 ? '+' : ''}{gain.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Impact log */}
          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Journal d'impact LNH</div>
            {impactLog.length === 0 ? (
              <div style={{ color:'var(--color-text-secondary)', fontSize:12 }}>En attente de résultats LNH...</div>
            ) : impactLog.map((e, i) => (
              <div key={i} style={{ fontSize:11, padding:'5px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', display:'flex', alignItems:'center', gap:7 }}>
                <TeamLogo id={e.team} size={18} />
                <span style={{ flex:1 }}>{e.desc}</span>
                {e.div && <span style={{ color:'#27ae60' }}>+{'e.div.toFixed(2)}</span>}
                {!!e.chg && <span style={{ color: e.chg >= 0 ? '#27ae60' : '#c0392b' }}>{e.chg >= 0 ? '+' : ''}{e.chg.toFixed(2)}%</span>}
                <span style={{ color:'var(--color-text-secondary)', minWidth:40, textAlign:'right' }}>{e.ts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tradeModal && (
        <TradeModal team={tradeModal} prices={prices} myHoldings={myHoldings} cash={myCash}
          onBuy={handleBuy} onSell={handleSell} onClose={() => setTradeModal(null)} />
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:16, right:16, background:'var(--color-background-primary)', border:`0.5px solid ${toast.err ? '#c0392b' : 'var(--color-border-secondary)'}`, borderRadius:8, padding:'9px 14px', fontSize:12, zIndex:200, maxWidth:280 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
}{e.div.toFixed(2)}</span>}
                {!!e.chg && <span style={{ color: e.chg >= 0 ? '#27ae60' : '#c0392b' }}>{e.chg >= 0 ? '+' : ''}{e.chg.toFixed(2)}%</span>}
                <span style={{ color:'var(--color-text-secondary)', minWidth:40, textAlign:'right' }}>{e.ts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tradeModal && (
        <TradeModal team={tradeModal} prices={prices} myHoldings={myHoldings} cash={myCash}
          onBuy={handleBuy} onSell={handleSell} onClose={() => setTradeModal(null)} />
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:16, right:16, background:'var(--color-background-primary)', border:`0.5px solid {'toast.err ? '#c0392b' : 'var(--color-border-secondary)'}`, borderRadius:8, padding:'9px 14px', fontSize:12, zIndex:200, maxWidth:280 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
}{toast.err ? '#c0392b' : 'var(--color-border-secondary)'}`, borderRadius:8, padding:'9px 14px', fontSize:12, zIndex:200, maxWidth:280 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
