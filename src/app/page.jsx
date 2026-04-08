'use client';
import { useState, useCallback } from 'react';
import { useAuth, useMarket, usePortfolio, useOrders, useImpactLog } from '../hooks/useMarket';
import { orders as ordersApi, market as marketApi } from '../lib/api';
import LeagueWizard from '../components/LeagueWizard';
import MyLeagues from '../components/MyLeagues';
import LeaguePage from '../components/LeaguePage';

// ---- Couleurs équipes ----
const TEAM_COLORS = {
  MTL:'#AF1E2D',BOS:'#FFB81C',TOR:'#00205B',TBL:'#002868',FLA:'#041E42',OTT:'#C52032',
  BUF:'#002654',DET:'#CE1126',NYR:'#0038A8',PHI:'#F74902',PIT:'#1a1a1a',WSH:'#041E42',
  NJD:'#CE1126',NYI:'#00539B',CAR:'#CC0000',CBJ:'#002654',CHI:'#CF0A2C',NSH:'#FFB81C',
  STL:'#002F87',COL:'#6F263D',MIN:'#154734',DAL:'#006847',WPG:'#041E42',UTA:'#69B3E7',
  VGK:'#B4975A',EDM:'#FF4C00',CGY:'#C8102E',VAN:'#00843D',SEA:'#001628',SJS:'#006D75',
  ANA:'#FC4C02',LAK:'#333333',
};

// ================================================================
// Composant principal
// ================================================================
export default function HockeyCapital() {
  const { user, loading: authLoading, login, register, logout, isAuthenticated } = useAuth();
  const { teams, loading: mktLoading, wsConnected, lastUpdate, refresh: refreshMarket } = useMarket();
  const { data: pf, dividends, loading: pfLoading, refresh: refreshPortfolio } = usePortfolio(isAuthenticated);
  const { activeOrders, history, placeOrder, cancelOrder } = useOrders(isAuthenticated);
  const impactLog = useImpactLog();

  const [activeTab, setActiveTab] = useState('market');
  const [tradeModal, setTradeModal] = useState(null); // { team, side }
  const [authModal, setAuthModal] = useState(null);   // 'login' | 'register'
  const [showLeagueWizard, setShowLeagueWizard] = useState(false);
  const [showMyLeagues, setShowMyLeagues] = useState(false);
  const [currentLeague, setCurrentLeague] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterDiv, setFilterDiv] = useState('');

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ---- Auth ----
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

  // ---- Trade ----
  async function handleTrade(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const qty = parseInt(fd.get('qty'));
    const orderType = fd.get('orderType');
    const limitPrice = fd.get('limitPrice') ? parseFloat(fd.get('limitPrice')) : undefined;

    try {
      await placeOrder({
        teamId: tradeModal.team.id,
        side: tradeModal.side,
        orderType,
        qty,
        price: limitPrice,
      });
      setTradeModal(null);
      refreshPortfolio();
      refreshMarket();
      showToast(`${tradeModal.side === 'buy' ? 'Achat' : 'Vente'} de ${qty} action(s) ${tradeModal.team.id} exécuté!`);
    } catch (err) { showToast(err.message, 'error'); }
  }

  // ---- Filtres marché ----
  const filteredTeams = teams
    .filter(t => {
      if (filterDiv && t.division !== filterDiv) return false;
      if (searchQ && !t.name.toLowerCase().includes(searchQ.toLowerCase()) && !t.id.toLowerCase().includes(searchQ.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'change') return (b.lastChange || 0) - (a.lastChange || 0);
      if (sortBy === 'points') return (b.stats?.points || 0) - (a.stats?.points || 0);
      return a.name.localeCompare(b.name);
    });

  const heldTeam = tradeModal ? (pf?.positions || []).find(p => p.team_id === tradeModal.team.id) : null;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1rem', fontFamily: 'var(--font-sans)' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ width: 36, height: 36, background: '#c0392b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 500, fontSize: 14, flexShrink: 0 }}>HC</div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500 }}>Hockey Capital</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: wsConnected ? '#27ae60' : '#e74c3c', marginRight: 5 }}></span>
            {wsConnected ? 'Temps réel actif' : 'Reconnexion...'} &bull; {lastUpdate ? `Mis à jour ${lastUpdate.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : '—'}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {isAuthenticated ? (
            <>
              <div style={{ background: 'var(--color-background-secondary)', borderRadius: 8, padding: '7px 14px', fontSize: 13 }}>
                Liquidités: <strong>{'$'}{pf?.cash?.toFixed(2) ?? '—'}</strong>
              </div>
              <button onClick={() => setShowMyLeagues(true)} style={{ padding: '6px 14px', borderRadius: 8, border: '0.5px solid #c0392b', background: 'none', cursor: 'pointer', fontSize: 13, color: '#c0392b', fontWeight: 500 }}>
                🏒 Mes Ligues
              </button>
              <button onClick={logout} style={{ padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-text-primary)' }}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setAuthModal('login')} style={{ padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-text-primary)' }}>Connexion</button>
              <button onClick={() => setAuthModal('register')} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#c0392b', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>S'inscrire</button>
            </>
          )}
        </div>
      </div>

      {/* TICKER */}
      <div style={{ background: 'var(--color-background-secondary)', borderRadius: 8, padding: '7px 12px', marginBottom: '1rem', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: 12 }}>
        <span style={{ color: 'var(--color-text-secondary)' }}>
          {teams.slice(0, 16).map(t => {
            const ch = t.lastChange || 0;
            return (
              <span key={t.id} style={{ marginRight: 28, display: 'inline-block' }}>
                <strong>{t.id}</strong> {'$'}{(t.price || 5).toFixed(2)}{' '}
                <span style={{ color: ch > 0 ? '#27ae60' : ch < 0 ? '#c0392b' : 'inherit' }}>
                  {ch >= 0 ? '+' : ''}{ch.toFixed(2)}%
                </span>
              </span>
            );
          })}
        </span>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
        {[
          { key: 'market', label: 'Marché' },
          { key: 'portfolio', label: isAuthenticated ? `Portefeuille${pf ? ` · $${(pf.totalValue || 0).toFixed(0)}` : ''}` : 'Portefeuille' },
          { key: 'orders', label: `Mes ordres${activeOrders.length ? ` (${activeOrders.length})` : ''}` },
          { key: 'impact', label: 'Impact LNH' },
          { key: 'dividends', label: 'Dividendes' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ padding: '8px 14px', fontSize: 13, cursor: 'pointer', border: 'none', background: 'none', color: activeTab === tab.key ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', borderBottom: activeTab === tab.key ? '2px solid #c0392b' : '2px solid transparent', marginBottom: -1, fontWeight: activeTab === tab.key ? 500 : 400, borderRadius: '8px 8px 0 0' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ---- ONGLET MARCHÉ ---- */}
      {activeTab === 'market' && (
        <div>
          {/* Stats en-tête */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, marginBottom: '1.5rem' }}>
            {[
              { label: 'Capitalisation', value: teams.length ? '$' + Math.round(teams.reduce((s, t) => s + (t.price || 5) * 100, 0)).toLocaleString() : '—', sub: 'toutes équipes' },
              { label: 'Équipes disponibles', value: teams.filter(t => (t.available || 0) > 0).length, sub: 'actions restantes' },
              { label: 'Meilleur gain', value: teams.length ? '+' + Math.max(...teams.map(t => t.lastChange || 0)).toFixed(2) + '%' : '—', sub: teams.length ? teams.reduce((best, t) => (t.lastChange || 0) > (best.lastChange || 0) ? t : best, teams[0])?.id : '—', up: true },
              { label: 'Plus grande baisse', value: teams.length ? Math.min(...teams.map(t => t.lastChange || 0)).toFixed(2) + '%' : '—', sub: teams.length ? teams.reduce((worst, t) => (t.lastChange || 0) < (worst.lastChange || 0) ? t : worst, teams[0])?.id : '—', down: true },
            ].map((m, i) => (
              <div key={i} style={{ background: 'var(--color-background-secondary)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: 20, fontWeight: 500, color: m.up ? '#27ae60' : m.down ? '#c0392b' : 'var(--color-text-primary)' }}>{m.value}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{m.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '1rem 1.25rem' }}>
            {/* Filtres */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <input placeholder="Rechercher..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
                style={{ flex: 1, minWidth: 160, padding: '7px 10px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13 }} />
              <select value={filterDiv} onChange={e => setFilterDiv(e.target.value)}
                style={{ padding: '7px 10px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13 }}>
                <option value="">Toutes divisions</option>
                {['Atlantique','Métropolitaine','Centrale','Pacifique'].map(d => <option key={d}>{d}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ padding: '7px 10px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13 }}>
                <option value="name">Trier: Nom</option>
                <option value="price">Trier: Prix</option>
                <option value="change">Trier: Variation</option>
                <option value="points">Trier: Points LNH</option>
              </select>
            </div>

            {/* Bannière contextuelle */}
            {!isAuthenticated ? (
              <div style={{ background:'#fff8f0', border:'1px solid #f0d080', borderRadius:10, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                <div style={{ fontSize:13, color:'#7a5800' }}>
                  🏒 <strong>Hockey Capital</strong> — Connectez-vous pour rejoindre une ligue et investir dans vos équipes LNH.
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => setAuthModal('login')} style={{ padding:'6px 14px', borderRadius:8, border:'1px solid #c0392b', background:'none', color:'#c0392b', cursor:'pointer', fontSize:13, fontWeight:500 }}>Connexion</button>
                  <button onClick={() => setAuthModal('register')} style={{ padding:'6px 14px', borderRadius:8, border:'none', background:'#c0392b', color:'white', cursor:'pointer', fontSize:13, fontWeight:600 }}>S'inscrire</button>
                </div>
              </div>
            ) : (
              <div style={{ background:'#f0f7ff', border:'1px solid #cce0ff', borderRadius:10, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                <div style={{ fontSize:13, color:'#1a4a7a' }}>
                  📊 Ceci est le marché global en lecture seule. Pour acheter et vendre, allez dans <strong>Mes Ligues</strong> et sélectionnez votre ligue.
                </div>
                <button onClick={() => setShowMyLeagues(true)} style={{ padding:'6px 14px', borderRadius:8, border:'none', background:'#c0392b', color:'white', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                  🏒 Mes Ligues
                </button>
              </div>
            )}

            {/* Tableau */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Équipe','Division','Prix','Var.','Pts LNH','Rang div.','Dispo.'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '7px 8px', color: 'var(--color-text-secondary)', fontWeight: 400, borderBottom: '0.5px solid var(--color-border-tertiary)', fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mktLoading ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>Chargement du marché...</td></tr>
                  ) : filteredTeams.map(t => {
                    const ch = t.lastChange || 0;
                    const price = t.price || 5;
                    const held = (pf?.positions || []).find(p => p.team_id === t.id);
                    return (
                      <tr key={t.id} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td style={{ padding: '8px 8px', whiteSpace: 'nowrap' }}>
                          <span style={{ width: 24, height: 24, borderRadius: '50%', background: TEAM_COLORS[t.id] || '#888', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 500, color: 'white', verticalAlign: 'middle', marginRight: 8 }}>{t.id}</span>
                          {t.name}
                          {t.stats?.clinched && <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#eafaf1', color: '#1e8449', fontWeight: 500 }}>Qualifié</span>}
                        </td>
                        <td style={{ padding: '8px 8px', color: 'var(--color-text-secondary)', fontSize: 11 }}>{t.division}</td>
                        <td style={{ padding: '8px 8px', fontWeight: 500 }}>{'$'}{price.toFixed(2)}</td>
                        <td style={{ padding: '8px 8px' }}>
                          <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: ch > 0 ? '#eafaf1' : ch < 0 ? '#fdedec' : 'var(--color-background-secondary)', color: ch > 0 ? '#1e8449' : ch < 0 ? '#922b21' : 'var(--color-text-secondary)' }}>
                            {ch >= 0 ? '+' : ''}{ch.toFixed(2)}%
                          </span>
                        </td>
                        <td style={{ padding: '8px 8px' }}>{t.stats?.points ?? '—'}</td>
                        <td style={{ padding: '8px 8px' }}>{t.stats?.division_rank ? '#' + t.stats.division_rank : '—'}</td>
                        <td style={{ padding: '8px 8px', fontSize: 12, color: 'var(--color-text-secondary)' }}>{t.available ?? 100}/100</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---- ONGLET PORTFOLIO ---- */}
      {activeTab === 'portfolio' && (
        <div>
          {!isAuthenticated ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)' }}>
              <div style={{ fontSize: 16, marginBottom: 12 }}>Connectez-vous pour voir votre portefeuille</div>
              <button onClick={() => setAuthModal('login')} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#c0392b', color: 'white', cursor: 'pointer', fontSize: 14 }}>Se connecter</button>
            </div>
          ) : pfLoading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)' }}>Chargement...</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, marginBottom: '1.5rem' }}>
                {[
                  { label: 'Valeur totale', value: `$${(pf?.totalValue || 0).toFixed(2)}` },
                  { label: 'Liquidités', value: `$${(pf?.cash || 0).toFixed(2)}` },
                  { label: 'Gain / Perte', value: `${(pf?.pnl || 0) >= 0 ? '+' : ''}$${(pf?.pnl || 0).toFixed(2)}`, up: (pf?.pnl || 0) > 0, down: (pf?.pnl || 0) < 0 },
                  { label: 'Positions', value: pf?.positions?.length ? `${pf.positions.length} équipe${pf.positions.length > 1 ? 's' : ''}` : '—' },
                ].map((m, i) => (
                  <div key={i} style={{ background: 'var(--color-background-secondary)', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 3 }}>{m.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 500, color: m.up ? '#27ae60' : m.down ? '#c0392b' : 'var(--color-text-primary)' }}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '1rem 1.25rem' }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Mes positions</div>
                {(pf?.positions || []).length === 0 ? (
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Aucune position. Achetez des actions dans le marché!</div>
                ) : (pf?.positions || []).map(pos => (
                  <div key={pos.team_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: TEAM_COLORS[pos.team_id] || '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, color: 'white', flexShrink: 0 }}>{pos.team_id}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{pos.teams?.name || pos.team_id}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{pos.shares} action{pos.shares > 1 ? 's' : ''} · Coût moy. {'$'}{(pos.avg_cost || 0).toFixed(2)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 500 }}>{'$'}{(pos.value || 0).toFixed(2)}</div>
                      <div style={{ fontSize: 12, color: (pos.pnl || 0) >= 0 ? '#27ae60' : '#c0392b' }}>
                        {(pos.pnl || 0) >= 0 ? '+' : ''}{'$'}{(pos.pnl || 0).toFixed(2)}
                      </div>
                    </div>
                    <button onClick={() => setTradeModal({ team: teams.find(t => t.id === pos.team_id) || { id: pos.team_id, name: pos.team_id, price: pos.currentPrice }, side: 'sell' })}
                      style={{ padding: '5px 12px', borderRadius: 6, border: '0.5px solid #c0392b', background: 'none', color: '#c0392b', cursor: 'pointer', fontSize: 12 }}>Vendre</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ---- ONGLET ORDRES ---- */}
      {activeTab === 'orders' && (
        <div>
          {!isAuthenticated ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)', fontSize: 14 }}>Connectez-vous pour voir vos ordres</div>
          ) : (
            <>
              <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Ordres actifs</div>
                {activeOrders.length === 0 ? (
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>Aucun ordre actif</div>
                ) : activeOrders.map(o => (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid var(--color-border-tertiary)', fontSize: 13 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: o.side === 'buy' ? '#eafaf1' : '#fdedec', color: o.side === 'buy' ? '#1e8449' : '#922b21' }}>{o.side === 'buy' ? 'Achat' : 'Vente'}</span>
                    <span style={{ fontWeight: 500 }}>{o.team_id}</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{o.qty} action{o.qty > 1 ? 's' : ''} @ {'$'}{parseFloat(o.price || 0).toFixed(2)}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-text-secondary)' }}>Limité</span>
                    <button onClick={() => cancelOrder(o.id).then(() => showToast('Ordre annulé'))}
                      style={{ padding: '3px 10px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-secondary)' }}>Annuler</button>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '1rem 1.25rem' }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Historique des transactions</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr>
                      {['Date','Équipe','Type','Qté','Prix','Total'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--color-text-secondary)', fontWeight: 400, borderBottom: '0.5px solid var(--color-border-tertiary)', fontSize: 12 }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {history.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--color-text-secondary)' }}>Aucune transaction</td></tr>
                      ) : history.slice(0, 30).map(tx => (
                        <tr key={tx.id} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                          <td style={{ padding: '7px 8px', color: 'var(--color-text-secondary)', fontSize: 11 }}>{new Date(tx.executed_at).toLocaleString('fr-CA', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</td>
                          <td style={{ padding: '7px 8px', fontWeight: 500 }}>{tx.team_id}</td>
                          <td style={{ padding: '7px 8px' }}><span style={{ padding: '2px 7px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: tx.type === 'Achat' ? '#eafaf1' : '#fdedec', color: tx.type === 'Achat' ? '#1e8449' : '#922b21' }}>{tx.type}</span></td>
                          <td style={{ padding: '7px 8px' }}>{tx.qty}</td>
                          <td style={{ padding: '7px 8px' }}>{'$'}{parseFloat(tx.price).toFixed(2)}</td>
                          <td style={{ padding: '7px 8px', fontWeight: 500 }}>{'$'}{(tx.price * tx.qty).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ---- ONGLET IMPACT LNH ---- */}
      {activeTab === 'impact' && (
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Journal d'impact — résultats LNH → prix (VERSION INITIALE)</div>
          {impactLog.length === 0 ? (
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 13, textAlign: 'center', padding: 40 }}>En attente de résultats LNH...</div>
          ) : impactLog.map((entry, i) => {
            const ch = parseFloat(entry.pct_change || 0);
            const t = teams.find(x => x.id === entry.team_id);
            return (
              <div key={i} style={{ padding: '10px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  {entry._live && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#27ae60', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>}
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: TEAM_COLORS[entry.team_id] || '#888', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'white', fontWeight: 500, flexShrink: 0 }}>{entry.team_id}</span>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{entry.description}</span>
                  <span style={{ marginLeft: 'auto', padding: '2px 7px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: ch >= 0 ? '#eafaf1' : '#fdedec', color: ch >= 0 ? '#1e8449' : '#922b21' }}>
                    {ch >= 0 ? '+' : ''}{ch.toFixed(2)}%
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', minWidth: 50, textAlign: 'right' }}>
                    {new Date(entry.created_at).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---- ONGLET DIVIDENDES ---- */}
      {activeTab === 'dividends' && (
        <div>
          {!isAuthenticated ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)', fontSize: 14 }}>Connectez-vous pour voir vos dividendes</div>
          ) : (
            <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Dividendes reçus</div>
              {dividends.length === 0 ? (
                <div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>Aucun dividende reçu. Détenez des actions lors des victoires!</div>
              ) : dividends.map(d => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '0.5px solid var(--color-border-tertiary)', fontSize: 13 }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: TEAM_COLORS[d.team_id] || '#888', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white', fontWeight: 500, flexShrink: 0 }}>{d.team_id}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{d.dividends?.reason || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{d.shares_held} actions · Mult. ×{d.dividends?.multiplier || 1}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 500, color: '#27ae60' }}>+{'$'}{parseFloat(d.amount).toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{new Date(d.paid_at).toLocaleDateString('fr-CA')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---- MODAL AUTH ---- */}
      {authModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: '24px 20px', width: '100%', maxWidth: 400, boxSizing: 'border-box', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#111' }}>
                {authModal === 'login' ? 'Connexion' : 'Créer un compte'}
              </div>
              <button type="button" onClick={() => setAuthModal(null)} style={{ background: '#f0f0f0', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <form onSubmit={authModal === 'login' ? handleLogin : handleRegister}>
              {authModal === 'register' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 14, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Nom d'utilisateur</label>
                  <input name="username" required placeholder="ex: HockeyKing99" style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #ddd', borderRadius: 10, background: '#fff', color: '#111', fontSize: 16, boxSizing: 'border-box', outline: 'none' }} />
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Courriel</label>
                <input name="email" type="email" required placeholder="ton@email.com" style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #ddd', borderRadius: 10, background: '#fff', color: '#111', fontSize: 16, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Mot de passe</label>
                <input name="password" type="password" required minLength={8} placeholder="8 caractères minimum" style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #ddd', borderRadius: 10, background: '#fff', color: '#111', fontSize: 16, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              {authModal === 'register' && (
                <div style={{ fontSize: 13, color: '#555', marginBottom: 16, background: '#f5f9ff', borderRadius: 10, padding: '10px 14px', border: '1px solid #dce8ff' }}>
                  💰 Capital de départ: <strong style={{ color: '#c0392b' }}>$2 500.00</strong> — chaque joueur commence avec le même capital
                </div>
              )}
              <button type="submit" style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#c0392b', color: 'white', cursor: 'pointer', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                {authModal === 'login' ? 'Se connecter' : 'Créer mon compte'}
              </button>
              <div style={{ textAlign: 'center', fontSize: 14, color: '#666', cursor: 'pointer', padding: '4px' }}
                onClick={() => setAuthModal(authModal === 'login' ? 'register' : 'login')}>
                {authModal === 'login' ? "Pas de compte? " : "Déjà un compte? "}
                <span style={{ color: '#c0392b', fontWeight: 500 }}>
                  {authModal === 'login' ? "S'inscrire" : "Se connecter"}
                </span>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- MODAL TRADE ---- */}
      {tradeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: '24px 20px', width: '100%', maxWidth: 420, boxSizing: 'border-box', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: TEAM_COLORS[tradeModal.team.id] || '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>{tradeModal.team.id}</div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: '#111' }}>{tradeModal.side === 'buy' ? 'Acheter' : 'Vendre'}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>{tradeModal.team.name}</div>
                </div>
              </div>
              <button type="button" onClick={() => setTradeModal(null)} style={{ background: '#f0f0f0', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            {/* Infos */}
            <div style={{ background: '#f7f7f7', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
              {[
                { label: 'Prix actuel', val: `$${(tradeModal.team.price || 5).toFixed(2)}` },
                { label: 'Actions disponibles', val: tradeModal.side === 'buy' ? `${tradeModal.team.available ?? 100}` : `${heldTeam?.shares ?? 0} détenues` },
                { label: 'Vos liquidités', val: `$${(pf?.cash || 0).toFixed(2)}` },
              ].map((row, i, arr) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0', borderBottom: i < arr.length - 1 ? '1px solid #eee' : 'none' }}>
                  <span style={{ color: '#666' }}>{row.label}</span>
                  <span style={{ fontWeight: 500, color: '#111' }}>{row.val}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleTrade}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 14, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Type d'ordre</label>
                <select name="orderType" style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #ddd', borderRadius: 10, background: '#fff', color: '#111', fontSize: 16, boxSizing: 'border-box' }}>
                  <option value="market">Au marché (exécution immédiate)</option>
                  <option value="limit">Ordre limité</option>
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Quantité</label>
                <input name="qty" type="number" min={1} defaultValue={1} required style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #ddd', borderRadius: 10, background: '#fff', color: '#111', fontSize: 16, boxSizing: 'border-box' }} />
              </div>
              <button type="submit" style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: tradeModal.side === 'buy' ? '#c0392b' : '#1a5276', color: 'white', cursor: 'pointer', fontSize: 16, fontWeight: 600, marginBottom: 10 }}>
                Confirmer {tradeModal.side === 'buy' ? "l'achat" : 'la vente'}
              </button>
              <button type="button" onClick={() => setTradeModal(null)} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 15, color: '#555' }}>Annuler</button>
            </form>
          </div>
        </div>
      )}

      {/* ---- PAGE LIGUE ---- */}
      {currentLeague && (
        <LeaguePage
          league={currentLeague}
          token={user?.token}
          onBack={() => setCurrentLeague(null)}
        />
      )}

      {/* ---- MODALS LIGUES ---- */}
      {showMyLeagues && (
        <MyLeagues
          token={user?.token}
          onClose={() => setShowMyLeagues(false)}
          onCreateNew={() => setShowLeagueWizard(true)}
          onOpenLeague={(lg) => setCurrentLeague(lg)}
        />
      )}
      {showLeagueWizard && (
        <LeagueWizard
          token={user?.token}
          onClose={() => setShowLeagueWizard(false)}
        />
      )}

      {/* ---- TOAST ---- */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: 'var(--color-background-primary)', border: `0.5px solid ${toast.type === 'error' ? '#c0392b' : 'var(--color-border-secondary)'}`, borderRadius: 8, padding: '10px 16px', fontSize: 13, zIndex: 200, maxWidth: 280 }}>
          {toast.msg}
        </div>
      )}

    </div>
  );
}
