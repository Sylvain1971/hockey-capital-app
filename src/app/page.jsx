import { useState, useCallback } from 'react';
import { useAuth, useMarket, usePortfolio, useOrders, useImpactLog } from '../hooks/useMarket';
import { orders as ordersApi, market as marketApi } from '../lib/api';
import LeagueWizard from '../components/LeagueWizard';
import MyLeagues from '../components/MyLeagues';
import LeaguePage from '../components/LeaguePage';

const TEAM_COLORS = {
  MTL:'#AF1E2D',BOS:'#FFB81C',TOR:'#00205B',TBL:'#002868',FLA:'#041E42',OTT:'#C52032',
  BUF:'#002654',DET:'#CE1126',NYR:'#0038A8',PHI:'#F74902',PIT:'#1a1a1a',WSH:'#041E42',
  NJD:'#CE1126',NYI:'#00539B',CAR:'#CC0000',CBJ:'#002654',CHI:'#CF0A2C',NSH:'#FFB81C',
  STL:'#002F87',COL:'#6F263D',MIN:'#154734',DAL:'#006847',WPG:'#041E42',UTA:'#69B3E7',
  VGK:'#B4975A',EDM:'#FF4C00',CGY:'#C8102E',VAN:'#00843D',SEA:'#001628',SJS:'#006D75',
  ANA:'#FC4C02',LAK:'#333333',
};

function fmt(n) { return Number(n || 0).toFixed(2); }
function fmtM(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + ' T$';
  if (n >= 1e9)  return (n / 1e9).toFixed(1)  + ' G$';
  if (n >= 1e6)  return Math.round(n / 1e6).toLocaleString('fr-CA') + ' M$';
  return Math.round(n).toLocaleString('fr-CA');
}

export default function HockeyCapital() {
  const { user, loading: authLoading, login, register, logout, isAuthenticated } = useAuth();
  const { teams, loading: mktLoading, wsConnected, lastUpdate, refresh: refreshMarket } = useMarket();
  const { data: pf, dividends, loading: pfLoading, refresh: refreshPortfolio } = usePortfolio(isAuthenticated);
  const { activeOrders, history, placeOrder, cancelOrder } = useOrders(isAuthenticated);
  const impactLog = useImpactLog();

  const [activeTab, setActiveTab] = useState('market');
  const [tradeModal, setTradeModal] = useState(null);
  const [authModal, setAuthModal] = useState(null);
  const [showLeagueWizard, setShowLeagueWizard] = useState(false);
  const [showMyLeagues, setShowMyLeagues] = useState(false);
  const [currentLeague, setCurrentLeague] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [sortBy, setSortBy] = useState('price');
  const [filterDiv, setFilterDiv] = useState('');

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleLogin(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await login(fd.get('email'), fd.get('password'));
      setAuthModal(null);
      showToast('Connexion réussie!');
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await register(fd.get('email'), fd.get('password'), fd.get('username'));
      setAuthModal('login');
      showToast('Compte créé! Connectez-vous.');
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function handleTrade(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const qty = parseInt(fd.get('qty'));
    const orderType = fd.get('orderType');
    const limitPrice = fd.get('limitPrice') ? parseFloat(fd.get('limitPrice')) : undefined;
    try {
      await placeOrder({ teamId: tradeModal.team.id, side: tradeModal.side, orderType, qty, price: limitPrice });
      setTradeModal(null);
      refreshPortfolio();
      refreshMarket();
      showToast((tradeModal.side === 'buy' ? 'Achat' : 'Vente') + ' de ' + qty + ' action(s) ' + tradeModal.team.id + ' executé!');
    } catch (err) { showToast(err.message, 'error'); }
  }

  const filteredTeams = teams
    .filter(t => {
      if (filterDiv && t.division !== filterDiv) return false;
      if (searchQ && !t.name.toLowerCase().includes(searchQ.toLowerCase()) && !t.id.toLowerCase().includes(searchQ.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'change') return (b.changePct || 0) - (a.changePct || 0);
      if (sortBy === 'points') return (b.stats?.points || 0) - (a.stats?.points || 0);
      return a.name.localeCompare(b.name);
    });

  const heldTeam = tradeModal ? (pf?.positions || []).find(p => p.team_id === tradeModal.team.id) : null;
  const totalMarketCap = teams.reduce((s, t) => s + (t.price || 25) * 120000000, 0);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1rem', fontFamily: 'var(--font-sans)' }}>

      {/* HEADER */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'1rem', paddingBottom:'1rem', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ width:36, height:36, background:'#c0392b', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:500, fontSize:14, flexShrink:0 }}>HC</div>
        <div>
          <div style={{ fontSize:20, fontWeight:500 }}>Hockey Capital</div>
          <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>
            <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:wsConnected?'#27ae60':'#e74c3c', marginRight:5 }}></span>
            {wsConnected ? 'Temps réel actif' : 'Reconnexion...'}{lastUpdate ? ' · Mis à jour ' + lastUpdate.toLocaleTimeString('fr-CA',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) : ''}
          </div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          {isAuthenticated ? (
            <>
              <button onClick={() => setShowMyLeagues(true)} style={{ padding:'6px 14px', borderRadius:8, border:'0.5px solid #c0392b', background:'none', cursor:'pointer', fontSize:13, color:'#c0392b', fontWeight:500 }}>
                🏒 Mes Ligues
              </button>
              <button onClick={logout} style={{ padding:'6px 14px', borderRadius:8, border:'0.5px solid var(--color-border-secondary)', background:'none', cursor:'pointer', fontSize:13, color:'var(--color-text-primary)' }}>Déconnexion</button>
            </>
          ) : (
            <>
              <button onClick={() => setAuthModal('login')} style={{ padding:'6px 14px', borderRadius:8, border:'0.5px solid var(--color-border-secondary)', background:'none', cursor:'pointer', fontSize:13, color:'var(--color-text-primary)' }}>Connexion</button>
              <button onClick={() => setAuthModal('register')} style={{ padding:'6px 14px', borderRadius:8, border:'none', background:'#c0392b', color:'white', cursor:'pointer', fontSize:13, fontWeight:500 }}>S'inscrire</button>
            </>
          )}
        </div>
      </div>

      {/* TICKER */}
      <div style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'7px 12px', marginBottom:'1rem', overflow:'hidden', whiteSpace:'nowrap', fontSize:12 }}>
        {teams.slice(0,16).map(t => {
          const ch = t.changePct || 0;
          return (
            <span key={t.id} style={{ marginRight:28, display:'inline-block' }}>
              <strong>{t.id}</strong>{' '}{'$'}{(t.price||25).toFixed(2)}{' '}
              <span style={{ color:ch>0?'#27ae60':ch<0?'#c0392b':'inherit' }}>
                {ch>=0?'+':''}{ch.toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>

      {/* TABS */}
      <div style={{ display:'flex', gap:4, marginBottom:'1.5rem', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
        {[
          { key:'market', label:'Marché' },
          { key:'portfolio', label:'Portefeuille' },
          { key:'orders', label:'Mes ordres' + (activeOrders.length ? ' (' + activeOrders.length + ')' : '') },
          { key:'impact', label:'Impact LNH' },
          { key:'dividends', label:'Dividendes' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ padding:'8px 14px', fontSize:13, cursor:'pointer', border:'none', background:'none', color:activeTab===tab.key?'var(--color-text-primary)':'var(--color-text-secondary)', borderBottom:activeTab===tab.key?'2px solid #c0392b':'2px solid transparent', marginBottom:-1, fontWeight:activeTab===tab.key?500:400, borderRadius:'8px 8px 0 0' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ---- MARCHÉ ---- */}
      {activeTab === 'market' && (
        <div>
          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:10, marginBottom:'1.5rem' }}>
            {[
              { label:'Capitalisation totale', value:'$' + fmtM(totalMarketCap), sub:'32 équipes LNH' },
              { label:'Prix moyen', value:'$' + (teams.length ? fmt(teams.reduce((s,t)=>s+(t.price||25),0)/teams.length) : '25.00'), sub:'par action' },
              { label:'Meilleur gain', value:teams.length?('+'+Math.max(...teams.map(t=>t.lastChange||0)).toFixed(2)+'%'):'—', sub:teams.length?teams.reduce((b,t)=>(t.lastChange||0)>(b.lastChange||0)?t:b,teams[0])?.id:'—', up:true },
              { label:'Plus grande baisse', value:teams.length?(Math.min(...teams.map(t=>t.lastChange||0)).toFixed(2)+'%'):'—', sub:teams.length?teams.reduce((w,t)=>(t.lastChange||0)<(w.lastChange||0)?t:w,teams[0])?.id:'—', down:true },
            ].map((m,i) => (
              <div key={i} style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'12px 14px' }}>
                <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:3 }}>{m.label}</div>
                <div style={{ fontSize:20, fontWeight:500, color:m.up?'#27ae60':m.down?'#c0392b':'var(--color-text-primary)' }}>{m.value}</div>
                <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:2 }}>{m.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem' }}>
            {/* Filtres */}
            <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
              <input placeholder="Rechercher..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                style={{ flex:1, minWidth:160, padding:'7px 10px', border:'0.5px solid var(--color-border-secondary)', borderRadius:8, background:'var(--color-background-primary)', color:'var(--color-text-primary)', fontSize:13 }} />
              <select value={filterDiv} onChange={e=>setFilterDiv(e.target.value)}
                style={{ padding:'7px 10px', border:'0.5px solid var(--color-border-secondary)', borderRadius:8, background:'var(--color-background-primary)', color:'var(--color-text-primary)', fontSize:13 }}>
                <option value="">Toutes divisions</option>
                {['Atlantique','Métropolitaine','Centrale','Pacifique'].map(d=><option key={d}>{d}</option>)}
              </select>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                style={{ padding:'7px 10px', border:'0.5px solid var(--color-border-secondary)', borderRadius:8, background:'var(--color-background-primary)', color:'var(--color-text-primary)', fontSize:13 }}>
                <option value="price">Trier: Prix</option>
                <option value="name">Trier: Nom</option>
                <option value="change">Trier: Variation</option>
                <option value="points">Trier: Points LNH</option>
              </select>
            </div>
            {/* Bannière */}
            {!isAuthenticated ? (
              <div style={{ background:'#fff8f0', border:'1px solid #f0d080', borderRadius:10, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                <div style={{ fontSize:13, color:'#7a5800' }}>🏒 <strong>Hockey Capital</strong> — Connectez-vous pour rejoindre une ligue et investir.</div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>setAuthModal('login')} style={{ padding:'6px 14px', borderRadius:8, border:'1px solid #c0392b', background:'none', color:'#c0392b', cursor:'pointer', fontSize:13, fontWeight:500 }}>Connexion</button>
                  <button onClick={()=>setAuthModal('register')} style={{ padding:'6px 14px', borderRadius:8, border:'none', background:'#c0392b', color:'white', cursor:'pointer', fontSize:13, fontWeight:600 }}>S'inscrire</button>
                </div>
              </div>
            ) : (
              <div style={{ background:'#f0f7ff', border:'1px solid #cce0ff', borderRadius:10, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                <div style={{ fontSize:13, color:'#1a4a7a' }}>📊 Marché global — lecture seule. Pour transiger, ouvrez une ligue dans <strong>Mes Ligues</strong>.</div>
                <button onClick={()=>setShowMyLeagues(true)} style={{ padding:'6px 14px', borderRadius:8, border:'none', background:'#c0392b', color:'white', cursor:'pointer', fontSize:13, fontWeight:600 }}>🏒 Mes Ligues</button>
              </div>
            )}
            {/* Tableau */}
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr>
                    {['Équipe','Division','Prix','Variation','Pts LNH','Rang div.'].map(h=>(
                      <th key={h} style={{ textAlign:'left', padding:'7px 8px', color:'var(--color-text-secondary)', fontWeight:400, borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:12, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mktLoading ? (
                    <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'var(--color-text-secondary)' }}>Chargement...</td></tr>
                  ) : filteredTeams.map(t => {
                    const ch = t.lastChange || 0;
                    const price = t.price || 25;
                    return (
                      <tr key={t.id} style={{ borderBottom:'0.5px solid var(--color-border-tertiary)' }}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--color-background-secondary)'}
                        onMouseLeave={e=>e.currentTarget.style.background=''}>
                        <td style={{ padding:'8px 8px', whiteSpace:'nowrap' }}>
                          <span style={{ width:24, height:24, borderRadius:'50%', background:TEAM_COLORS[t.id]||'#888', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:500, color:'white', verticalAlign:'middle', marginRight:8 }}>{t.id}</span>
                          {t.name}
                          {t.stats?.clinched && <span style={{ marginLeft:6, fontSize:10, padding:'1px 6px', borderRadius:4, background:'#eafaf1', color:'#1e8449', fontWeight:500 }}>Qualifié</span>}
                        </td>
                        <td style={{ padding:'8px 8px', color:'var(--color-text-secondary)', fontSize:11 }}>{t.division}</td>
                        <td style={{ padding:'8px 8px', fontWeight:600 }}>{'$'}{price.toFixed(2)}</td>
                        <td style={{ padding:'8px 8px' }}>
                          <span style={{ display:'inline-block', padding:'2px 7px', borderRadius:6, fontSize:11, fontWeight:500, background:ch>0?'#eafaf1':ch<0?'#fdedec':'var(--color-background-secondary)', color:ch>0?'#1e8449':ch<0?'#922b21':'var(--color-text-secondary)' }}>
                            {ch>=0?'+':''}{ch.toFixed(2)}%
                          </span>
                        </td>
                        <td style={{ padding:'8px 8px' }}>{t.stats?.points ?? '—'}</td>
                        <td style={{ padding:'8px 8px' }}>{t.stats?.division_rank ? '#'+t.stats.division_rank : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
