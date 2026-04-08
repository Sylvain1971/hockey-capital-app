'use client';
import { useState, useEffect } from 'react';

const TEAM_COLORS = {
  MTL:'#AF1E2D',BOS:'#FFB81C',TOR:'#00205B',TBL:'#002868',FLA:'#041E42',OTT:'#C52032',
  BUF:'#002654',DET:'#CE1126',NYR:'#0038A8',PHI:'#F74902',PIT:'#1a1a1a',WSH:'#041E42',
  NJD:'#CE1126',NYI:'#00539B',CAR:'#CC0000',CBJ:'#002654',CHI:'#CF0A2C',NSH:'#FFB81C',
  STL:'#002F87',COL:'#6F263D',MIN:'#154734',DAL:'#006847',WPG:'#041E42',UTA:'#69B3E7',
  VGK:'#B4975A',EDM:'#FF4C00',CGY:'#C8102E',VAN:'#00843D',SEA:'#001628',SJS:'#006D75',
  ANA:'#FC4C02',LAK:'#333333',
};

const S = {
  overlay: { position:'fixed', top:0, left:0, right:0, bottom:0, background:'#f5f5f5', zIndex:1500, overflowY:'auto' },
  hdr: { background:'#fff', borderBottom:'1px solid #eee', padding:'16px 20px', display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:10 },
  back: { padding:'6px 14px', borderRadius:8, border:'1px solid #ddd', background:'none', cursor:'pointer', fontSize:13, color:'#555' },
  body: { maxWidth:960, margin:'0 auto', padding:'20px 16px' },
  section: { background:'#fff', borderRadius:12, padding:'16px 20px', marginBottom:16, border:'1px solid #eee' },
  stat: { textAlign:'center' },
  statVal: { fontSize:22, fontWeight:700, color:'#111' },
  statLbl: { fontSize:12, color:'#888', marginTop:2 },
  teamRow: { display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid #f0f0f0' },
  logo: (id) => ({ width:36, height:36, borderRadius:'50%', background: TEAM_COLORS[id]||'#888', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', flexShrink:0 }),
  btnBuy: { padding:'6px 14px', borderRadius:8, border:'none', background:'#c0392b', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' },
  btnSell: { padding:'6px 14px', borderRadius:8, border:'1px solid #c0392b', background:'none', color:'#c0392b', fontSize:13, fontWeight:600, cursor:'pointer' },
  modalBg: { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  modalCard: { background:'#fff', borderRadius:16, width:'100%', maxWidth:420, padding:'24px 20px', boxSizing:'border-box', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' },
  inp: { width:'100%', padding:'12px 14px', border:'1.5px solid #ddd', borderRadius:10, background:'#fff', color:'#111', fontSize:16, boxSizing:'border-box', marginTop:6 },
  btnFull: (color) => ({ width:'100%', padding:14, borderRadius:10, border:'none', background:color, color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer', marginTop:12 }),
};

export default function LeaguePage({ league, token, onBack }) {
  const [teams, setTeams] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState('marche');
  const [tradeModal, setTradeModal] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const hdrs = { 'Content-Type':'application/json', Authorization:`Bearer ${token}` };

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [t, p, m] = await Promise.all([
        fetch(`${API}/api/market/teams`, { headers: hdrs }).then(r => r.json()),
        fetch(`${API}/api/portfolio`, { headers: hdrs }).then(r => r.json()),
        fetch(`${API}/api/leagues/${league.id}/members`, { headers: hdrs }).then(r => r.json()),
      ]);
      setTeams(Array.isArray(t) ? t : []);
      setPortfolio(p);
      setMembers(Array.isArray(m) ? m : []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function executeTrade() {
    try {
      const res = await fetch(`${API}/api/orders/place`, {
        method: 'POST', headers: hdrs,
        body: JSON.stringify({ teamId: tradeModal.team.id, side: tradeModal.side, orderType: 'market', qty: parseInt(qty) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(tradeModal.side === 'buy' ? `Achat de ${qty} action(s) ${tradeModal.team.id} confirmé!` : `Vente de ${qty} action(s) confirmée!`);
      setTradeModal(null);
      setQty(1);
      fetchAll();
    } catch(e) { showToast('Erreur: ' + e.message); }
  }

  const positions = portfolio?.positions || [];
  const cash = portfolio?.cash || 0;

  return (
    <div style={S.overlay}>
      <div style={S.hdr}>
        <button style={S.back} onClick={onBack}>← Retour</button>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:17, color:'#111' }}>{league.name}</div>
          <div style={{ fontSize:12, color:'#888' }}>Code: <strong>{league.invite_code}</strong> · {league.max_players} joueurs · {league.duration}</div>
        </div>
        <div style={{ fontSize:14, fontWeight:600, color:'#111' }}>💰 {cash.toFixed(2)}$</div>
      </div>

      <div style={S.body}>
        {/* Tabs */}
        <div style={{ display:'flex', gap:0, marginBottom:16, border:'1px solid #eee', borderRadius:10, overflow:'hidden', background:'#f8f8f8' }}>
          {[['marche','📊 Marché'],['portefeuille','💼 Portefeuille'],['classement','🏆 Classement']].map(([id, lbl]) => (
            <button key={id} onClick={() => setTab(id)} style={{ flex:1, padding:'10px 0', border:'none', background: tab===id?'#c0392b':'none', color: tab===id?'#fff':'#555', fontWeight: tab===id?700:400, cursor:'pointer', fontSize:13 }}>{lbl}</button>
          ))}
        </div>

        {/* TAB MARCHÉ */}
        {tab === 'marche' && (
          <div style={S.section}>
            <div style={{ fontSize:15, fontWeight:700, color:'#111', marginBottom:12 }}>Marché — Acheter / Vendre</div>
            {loading ? <div style={{ color:'#aaa', textAlign:'center', padding:20 }}>Chargement...</div> : teams.map(t => {
              const held = positions.find(p => p.team_id === t.id);
              return (
                <div key={t.id} style={S.teamRow}>
                  <div style={S.logo(t.id)}>{t.id}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:14, color:'#111' }}>{t.name}</div>
                    <div style={{ fontSize:12, color:'#888' }}>{t.division} · {t.stats?.points || 0}pts · {'#'}{t.stats?.division_rank || '—'}</div>
                  </div>
                  <div style={{ textAlign:'right', marginRight:12 }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>${(t.price||5).toFixed(2)}</div>
                    {held && held.shares > 0 && <div style={{ fontSize:11, color:'#27ae60' }}>{held.shares} détenues</div>}
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button style={S.btnBuy} onClick={() => { setTradeModal({ team:t, side:'buy' }); setQty(1); }}>Acheter</button>
                    {held && held.shares > 0 && (
                      <button style={S.btnSell} onClick={() => { setTradeModal({ team:t, side:'sell' }); setQty(1); }}>Vendre</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB PORTEFEUILLE */}
        {tab === 'portefeuille' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
              {[
                ['Liquidités', `${cash.toFixed(2)}$`],
                ['Valeur actions', `${(portfolio?.stockValue||0).toFixed(2)}$`],
                ['Valeur totale', `${(portfolio?.totalValue||0).toFixed(2)}$`],
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ ...S.section, ...S.stat, padding:'14px 10px' }}>
                  <div style={S.statVal}>{val}</div>
                  <div style={S.statLbl}>{lbl}</div>
                </div>
              ))}
            </div>
            <div style={S.section}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>Mes positions</div>
              {positions.length === 0
                ? <div style={{ color:'#aaa', fontSize:14 }}>Aucune position. Allez dans le Marché pour acheter des actions!</div>
                : positions.map(p => (
                  <div key={p.team_id} style={S.teamRow}>
                    <div style={S.logo(p.team_id)}>{p.team_id}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600 }}>{p.teams?.name || p.team_id}</div>
                      <div style={{ fontSize:12, color:'#888' }}>{p.shares} actions · Coût moy. ${(p.avg_cost||0).toFixed(2)}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:700 }}>${(p.value||0).toFixed(2)}</div>
                      <div style={{ fontSize:12, color: p.pnl >= 0 ? '#27ae60' : '#e74c3c' }}>
                        {p.pnl >= 0 ? '+' : ''}{(p.pnl||0).toFixed(2)}$
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* TAB CLASSEMENT */}
        {tab === 'classement' && (
          <div style={S.section}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>Classement de la ligue</div>
            {members.length === 0
              ? <div style={{ color:'#aaa', fontSize:14 }}>Aucun membre pour l'instant.</div>
              : members.map((m, i) => (
                <div key={m.user_id || i} style={{ ...S.teamRow, cursor:'default' }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background: i===0?'#f1c40f':i===1?'#bdc3c7':i===2?'#cd7f32':'#eee', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color: i<3?'#fff':'#888', flexShrink:0 }}>{i+1}</div>
                  <div style={{ flex:1, marginLeft:4 }}>
                    <div style={{ fontWeight:600, fontSize:14 }}>{m.username || m.user_id?.substring(0,8)}</div>
                    {m.is_creator && <span style={{ fontSize:11, color:'#c0392b', fontWeight:600 }}>Créateur</span>}
                  </div>
                  <div style={{ fontWeight:700, fontSize:15 }}>{(m.net_worth||m.cash||0).toFixed(2)}$</div>
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* Modal trade */}
      {tradeModal && (
        <div style={S.modalBg} onClick={e => e.target===e.currentTarget && setTradeModal(null)}>
          <div style={S.modalCard}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={S.logo(tradeModal.team.id)}>{tradeModal.team.id}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:16 }}>{tradeModal.side === 'buy' ? 'Acheter' : 'Vendre'}</div>
                  <div style={{ fontSize:13, color:'#666' }}>{tradeModal.team.name}</div>
                </div>
              </div>
              <button onClick={() => setTradeModal(null)} style={{ background:'#f0f0f0', border:'none', borderRadius:'50%', width:32, height:32, fontSize:18, cursor:'pointer' }}>×</button>
            </div>
            <div style={{ background:'#f7f7f7', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
              {[
                ['Prix actuel', `$${(tradeModal.team.price||5).toFixed(2)}`],
                ['Vos liquidités', `$${cash.toFixed(2)}`],
                ['Actions disponibles', `${tradeModal.team.available ?? 100}`],
              ].map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:14, padding:'5px 0', borderBottom:'1px solid #eee' }}>
                  <span style={{ color:'#666' }}>{l}</span><span style={{ fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>
            <label style={{ fontSize:14, fontWeight:600, color:'#333' }}>Quantité</label>
            <input type="number" min={1} value={qty} onChange={e => setQty(e.target.value)} style={S.inp} />
            <div style={{ fontSize:13, color:'#888', marginTop:6 }}>
              Total estimé: <strong>${((tradeModal.team.price||5) * qty).toFixed(2)}</strong>
            </div>
            <button style={S.btnFull(tradeModal.side==='buy'?'#c0392b':'#1a5276')} onClick={executeTrade}>
              Confirmer {tradeModal.side==='buy'?"l'achat":'la vente'}
            </button>
            <button style={{ ...S.btnFull('#f0f0f0'), color:'#555', marginTop:8 }} onClick={() => setTradeModal(null)}>Annuler</button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:20, right:20, background:'#111', color:'#fff', padding:'12px 20px', borderRadius:10, fontSize:14, zIndex:9999 }}>{toast}</div>
      )}
    </div>
  );
}
