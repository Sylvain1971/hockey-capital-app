'use client';
import { useState, useEffect } from 'react';
import PlayoffBadge, { PlayoffStatusBar } from './PlayoffBadge';
import DistressSellModal from './DistressSellModal';

// ---- Logo équipe NHL ----
function TeamLogo({ id, size = 36 }) {
  const [err, setErr] = useState(false);
  const TEAM_COLORS_FB = {
    MTL:'#AF1E2D',BOS:'#FFB81C',TOR:'#00205B',TBL:'#002868',FLA:'#041E42',OTT:'#C52032',
    BUF:'#002654',DET:'#CE1126',NYR:'#0038A8',PHI:'#F74902',PIT:'#1a1a1a',WSH:'#041E42',
    NJD:'#CE1126',NYI:'#00539B',CAR:'#CC0000',CBJ:'#002654',CHI:'#CF0A2C',NSH:'#FFB81C',
    STL:'#002F87',COL:'#6F263D',MIN:'#154734',DAL:'#006847',WPG:'#041E42',UTA:'#69B3E7',
    VGK:'#B4975A',EDM:'#FF4C00',CGY:'#C8102E',VAN:'#00843D',SEA:'#001628',SJS:'#006D75',
    ANA:'#FC4C02',LAK:'#333333',
  };
  if (!err) {
    return (
      <img src={`https://assets.nhle.com/logos/nhl/svg/${id}_light.svg`} alt={id}
        width={size} height={size} onError={() => setErr(true)}
        style={{ width:size, height:size, objectFit:'contain', flexShrink:0, padding:2 }}
      />
    );
  }
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:TEAM_COLORS_FB[id]||'#888', display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.28, fontWeight:700, color:'#fff', flexShrink:0 }}>
      {id}
    </div>
  );
}

const S = {
  overlay: { position:'fixed',top:0,left:0,right:0,bottom:0,background:'#f5f5f5',zIndex:1500,overflowY:'auto' },
  hdr: { background:'#fff',borderBottom:'1px solid #eee',padding:'16px 20px',display:'flex',alignItems:'center',gap:12,position:'sticky',top:0,zIndex:10 },
  back: { padding:'6px 14px',borderRadius:8,border:'1px solid #ddd',background:'none',cursor:'pointer',fontSize:13,color:'#555' },
  body: { maxWidth:960,margin:'0 auto',padding:'20px 16px' },
  section: { background:'#fff',borderRadius:12,padding:'16px 20px',marginBottom:16,border:'1px solid #eee' },
  stat: { textAlign:'center' },
  statVal: { fontSize:22,fontWeight:700,color:'#111' },
  statLbl: { fontSize:12,color:'#888',marginTop:2 },
  teamRow: { display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid #f0f0f0' },
  btnBuy: { padding:'6px 14px',borderRadius:8,border:'none',background:'#c0392b',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer' },
  btnSell: { padding:'6px 14px',borderRadius:8,border:'1px solid #c0392b',background:'none',color:'#c0392b',fontSize:13,fontWeight:600,cursor:'pointer' },
  btnDistress: { padding:'6px 14px',borderRadius:8,border:'1px solid #922b21',background:'#fff0f0',color:'#922b21',fontSize:13,fontWeight:600,cursor:'pointer' },
  modalBg: { position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.6)',zIndex:3000,display:'flex',alignItems:'center',justifyContent:'center',padding:16 },
  modalCard: { background:'#fff',borderRadius:16,width:'100%',maxWidth:420,padding:'24px 20px',boxSizing:'border-box',boxShadow:'0 20px 60px rgba(0,0,0,0.3)' },
  inp: { width:'100%',padding:'12px 14px',border:'1.5px solid #ddd',borderRadius:10,background:'#fff',color:'#111',fontSize:16,boxSizing:'border-box',marginTop:6 },
  btnFull: (color) => ({ width:'100%',padding:14,borderRadius:10,border:'none',background:color,color:'#fff',fontSize:16,fontWeight:700,cursor:'pointer',marginTop:12 }),
};

export default function LeaguePage({ league, token, onBack }) {
  const [teams, setTeams]             = useState([]);
  const [portfolio, setPortfolio]     = useState(null);
  const [members, setMembers]         = useState([]);
  const [seasonConfig, setSeasonConfig] = useState({ mode: 'regular' });
  const [tab, setTab]                 = useState('marche');
  const [tradeModal, setTradeModal]   = useState(null);
  const [distressModal, setDistressModal] = useState(null);
  const [qty, setQty]                 = useState(100);
  const [modalKey, setModalKey]       = useState(0);
  const [qtyDisplay, setQtyDisplay]   = useState('100');
  const [loading, setLoading]         = useState(true);
  const [toast, setToast]             = useState('');

  const API  = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const hdrs = { 'Content-Type':'application/json', Authorization:`Bearer ${token}` };

  const isPlayoffs = seasonConfig?.mode === 'playoffs';

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [t, p, m, cfg] = await Promise.all([
        fetch(`${API}/api/market/teams`, { headers:hdrs }).then(r => r.json()),
        fetch(`${API}/api/leagues/${league.id}/portfolio`, { headers:hdrs }).then(r => r.json()),
        fetch(`${API}/api/leagues/${league.id}/members`, { headers:hdrs }).then(r => r.json()),
        fetch(`${API}/api/market/season-config`, { headers:hdrs }).then(r => r.json()).catch(() => ({ mode:'regular' })),
      ]);
      setTeams(Array.isArray(t) ? t : []);
      setPortfolio(p);
      setMembers(Array.isArray(m) ? m : []);
      setSeasonConfig(cfg || { mode:'regular' });
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3500); }

  async function executeTrade() {
    try {
      const res = await fetch(`${API}/api/leagues/${league.id}/market/${tradeModal.side === 'buy' ? 'buy' : 'sell'}`, {
        method:'POST', headers:hdrs,
        body: JSON.stringify({ teamId:tradeModal.team.id, qty:parseInt(qty), orderType:'market' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(tradeModal.side === 'buy' ? `Achat de ${qty} action(s) ${tradeModal.team.id} confirmé!` : `Vente de ${qty} action(s) confirmée!`);
      setTradeModal(null); setQty(100); setQtyDisplay('100'); setModalKey(k => k+1);
      fetchAll();
    } catch(e) { showToast('Erreur: ' + e.message); }
  }

  const positions  = portfolio?.positions || [];
  const cash       = portfolio?.cash || 0;
  const totalValue = portfolio?.totalValue || cash;

  function getConcentration(teamId, addQty, addPrice) {
    const held = positions.find(p => p.team_id === teamId);
    const currentShares = held?.shares || 0;
    const newShares = currentShares + addQty;
    const newPositionValue = newShares * addPrice;
    const newTotal = totalValue - (currentShares * addPrice) + newPositionValue;
    return newTotal > 0 ? newPositionValue / newTotal : 0;
  }

  function getNbEquipes(includeTeamId) {
    const ids = new Set(positions.filter(p => p.shares > 0).map(p => p.team_id));
    ids.add(includeTeamId); return ids.size;
  }

  // Trier les équipes: actives d'abord, figées ensuite (grisées)
  const sortedTeams = isPlayoffs
    ? [...teams].sort((a, b) => {
        const order = { active:0, champion:1, not_qualified:2, eliminated:3 };
        return (order[a.playoff_status]??2) - (order[b.playoff_status]??2);
      })
    : teams;

  return (
    <div style={S.overlay}>
      {/* Barre séries si actives */}
      {isPlayoffs && <PlayoffStatusBar seasonConfig={seasonConfig} />}

      <div style={S.hdr}>
        <button style={S.back} onClick={onBack}>Retour</button>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700,fontSize:17,color:'#111' }}>{league.name}</div>
          <div style={{ fontSize:12,color:'#888' }}>Code: <strong>{league.invite_code}</strong> · {league.max_players} joueurs</div>
        </div>
        <div style={{ fontSize:14,fontWeight:600,color:'#111',textAlign:'right' }}>
          <div><span style={{ color:'#27ae60' }}>${totalValue.toLocaleString('fr-CA',{minimumFractionDigits:2,maximumFractionDigits:2})}</span><span style={{ fontSize:11,color:'#888',fontWeight:400,marginLeft:6 }}>valeur totale</span></div>
          <div style={{ fontSize:11,color:'#888',fontWeight:400 }}>💵 {cash.toLocaleString('fr-CA',{minimumFractionDigits:2,maximumFractionDigits:2})}$ liquidités{(portfolio?.stockValue||0)>0&&<span> · 📈 {(portfolio?.stockValue||0).toLocaleString('fr-CA',{minimumFractionDigits:2,maximumFractionDigits:2})}$ actions</span>}</div>
        </div>
      </div>

      <div style={S.body}>
        {/* Tabs */}
        <div style={{ display:'flex',gap:0,marginBottom:16,border:'1px solid #eee',borderRadius:10,overflow:'hidden',background:'#f8f8f8' }}>
          {[['marche','Marché'],['portefeuille','Portefeuille'],['classement','Classement']].map(([id,lbl]) => (
            <button key={id} onClick={() => setTab(id)} style={{ flex:1,padding:'10px 0',border:'none',background:tab===id?'#c0392b':'none',color:tab===id?'#fff':'#555',fontWeight:tab===id?700:400,cursor:'pointer',fontSize:13 }}>{lbl}</button>
          ))}
        </div>

        {/* TAB MARCHE */}
        {tab === 'marche' && (
          <div style={S.section}>
            <div style={{ fontSize:15,fontWeight:700,color:'#111',marginBottom:12 }}>
              Marché — Acheter / Vendre
              {isPlayoffs && <span style={{ fontSize:12,color:'#888',fontWeight:400,marginLeft:8 }}>🔒 = prix figé</span>}
            </div>
            {loading ? <div style={{ color:'#aaa',textAlign:'center',padding:20 }}>Chargement...</div> : sortedTeams.map(t => {
              const held   = positions.find(p => p.team_id === t.id);
              const locked = isPlayoffs && t.playoff_locked;
              const isChamp = t.playoff_status === 'champion';
              return (
                <div key={t.id} style={{ ...S.teamRow, opacity: locked && !isChamp ? 0.65 : 1, background: isChamp ? '#fffde7' : 'transparent' }}>
                  <TeamLogo id={t.id} size={36} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600,fontSize:14,color:'#111',display:'flex',alignItems:'center',gap:6 }}>
                      {t.name}
                      {isPlayoffs && <PlayoffBadge team={t} />}
                    </div>
                    <div style={{ fontSize:12,color:'#888' }}>{t.division} · {t.stats?.points||0}pts · #{t.stats?.division_rank||'-'}</div>
                  </div>
                  <div style={{ textAlign:'right',marginRight:12 }}>
                    <div style={{ fontWeight:700,fontSize:15 }}>${(t.price||5).toFixed(2)}</div>
                    {held&&held.shares>0&&<div style={{ fontSize:11,color:'#27ae60' }}>{held.shares} détenues</div>}
                  </div>
                  <div style={{ display:'flex',gap:6,flexShrink:0 }}>
                    {!locked && <button style={S.btnBuy} onClick={() => { setTradeModal({team:t,side:'buy'}); setQty(100); setQtyDisplay('100'); setModalKey(k=>k+1); }}>Acheter</button>}
                    {!locked && held&&held.shares>0 && <button style={S.btnSell} onClick={() => { setTradeModal({team:t,side:'sell'}); setQty(100); setQtyDisplay('100'); setModalKey(k=>k+1); }}>Vendre</button>}
                    {locked && !isChamp && held&&held.shares>0 && (
                      <button style={S.btnDistress} onClick={() => setDistressModal({ position:held, team:t })}>
                        Détresse 🔒
                      </button>
                    )}
                    {isChamp && <span style={{ fontSize:18 }}>🏆</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB PORTEFEUILLE */}
        {tab === 'portefeuille' && (
          <div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16 }}>
              {[
                { lbl:'Liquidités',val:`${cash.toLocaleString('fr-CA',{minimumFractionDigits:2,maximumFractionDigits:2})}$`,color:'#27ae60' },
                { lbl:'Valeur actions',val:`${(portfolio?.stockValue||0).toLocaleString('fr-CA',{minimumFractionDigits:2,maximumFractionDigits:2})}$`,color:'#2980b9' },
                { lbl:'Valeur TOTALE',val:`${(portfolio?.totalValue||0).toLocaleString('fr-CA',{minimumFractionDigits:2,maximumFractionDigits:2})}$`,color:'#c0392b',highlight:true },
              ].map(({lbl,val,color,highlight}) => (
                <div key={lbl} style={{ ...S.section,...S.stat,padding:'14px 10px',border:highlight?'2px solid #c0392b':'1px solid #eee',background:highlight?'#fff8f7':'#fff' }}>
                  <div style={{ ...S.statVal,color,fontSize:highlight?24:22 }}>{val}</div>
                  <div style={{ ...S.statLbl,fontWeight:highlight?700:400,color:highlight?'#c0392b':'#888' }}>{lbl}</div>
                </div>
              ))}
            </div>
            <div style={S.section}>
              <div style={{ fontSize:15,fontWeight:700,marginBottom:12 }}>Mes positions</div>
              {positions.length === 0
                ? <div style={{ color:'#aaa',fontSize:14 }}>Aucune position. Allez dans le Marché pour acheter des actions!</div>
                : positions.map(p => {
                    const teamData  = teams.find(t => t.id === p.team_id) || {};
                    const locked    = isPlayoffs && teamData.playoff_locked;
                    const isChamp   = teamData.playoff_status === 'champion';
                    return (
                      <div key={p.team_id} style={{ ...S.teamRow, opacity: locked && !isChamp ? 0.75 : 1 }}>
                        <TeamLogo id={p.team_id} size={36} />
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:600,display:'flex',alignItems:'center',gap:6 }}>
                            {p.teams?.name||p.team_id}
                            {isPlayoffs && <PlayoffBadge team={teamData} />}
                          </div>
                          <div style={{ fontSize:12,color:'#888' }}>{p.shares} actions · Coût moy. ${(p.avg_cost||0).toFixed(2)}</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontWeight:700 }}>${(p.value||0).toLocaleString('fr-CA',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                          {p.pnl !== 0 ? (
                            <div style={{ fontSize:12,color:p.pnl>=0?'#27ae60':'#e74c3c',fontWeight:600 }}>
                              {p.pnl>=0?'▲':'▼'} {p.pnl>=0?'+':''}{(p.pnl||0).toLocaleString('fr-CA',{minimumFractionDigits:2,maximumFractionDigits:2})}$ ({p.pnlPct>=0?'+':''}{(p.pnlPct||0).toFixed(2)}% auj.)
                            </div>
                          ) : <div style={{ fontSize:11,color:'#aaa' }}>— variation demain</div>}
                          {locked && !isChamp && (
                            <button style={{ ...S.btnDistress,padding:'4px 10px',fontSize:11,marginTop:4 }} onClick={() => setDistressModal({position:p, team:teamData})}>
                              Vendre (détresse) 🔒
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          </div>
        )}

        {/* TAB CLASSEMENT — identique à l'original */}
        {tab === 'classement' && (
          <div>
            {(() => {
              const mise=league.mise_reelle||0, nbJ=league.max_players||0, FRAIS_PCT=0;
              const cagnotteBrute=mise*nbJ, frais=Math.round(cagnotteBrute*FRAIS_PCT/100), cagnotteNette=cagnotteBrute-frais;
              const mode=league.prize_mode||'top3';
              const repartitions={
                winner_takes_all:[{label:'🥇 1er',pct:100}],
                top2:[{label:'🥇 1er',pct:70},{label:'🥈 2e',pct:30}],
                top3:[{label:'🥇 1er',pct:60},{label:'🥈 2e',pct:30},{label:'🥉 3e',pct:10}],
                equal:Array.from({length:nbJ},(_,i)=>({label:`#${i+1}`,pct:Math.floor(100/nbJ)})),
              };
              const distrib=repartitions[mode]||repartitions.top3;
              return (
                <div style={{ display:'grid',gridTemplateColumns:`1fr ${distrib.map(()=>'1fr').join(' ')}`,gap:10,marginBottom:16 }}>
                  <div style={{ background:'#fff',borderRadius:12,padding:'14px 16px',border:'1px solid #eee' }}>
                    <div style={{ fontSize:11,color:'#888',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6 }}>💰 Cagnotte nette</div>
                    <div style={{ fontSize:20,fontWeight:700,color:'#111' }}>{cagnotteNette.toLocaleString('fr-CA')}$</div>
                    <div style={{ fontSize:11,color:'#888',marginTop:4 }}>{mise}$ / joueur × {nbJ} joueur{nbJ>1?'s':''} = {cagnotteBrute}$</div>
                    {frais>0&&<div style={{ fontSize:11,color:'#aaa',marginTop:2 }}>Frais {FRAIS_PCT}% : -{frais}$</div>}
                  </div>
                  {distrib.map((r,i)=>{
                    const montant=Math.round(cagnotteNette*r.pct/100);
                    const membre=members[i];
                    return (
                      <div key={i} style={{ background:i===0?'#fffbea':i===1?'#f8f8f8':'#fdf6f0',borderRadius:12,padding:'14px 16px',border:`1px solid ${i===0?'#f1c40f':i===1?'#bdc3c7':'#cd7f32'}` }}>
                        <div style={{ fontSize:11,color:'#888',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6 }}>{r.label} · {r.pct}%</div>
                        <div style={{ fontSize:20,fontWeight:700,color:i===0?'#7d6608':i===1?'#555':'#7d4e00' }}>{montant.toLocaleString('fr-CA')}$</div>
                        {membre&&<div style={{ fontSize:11,color:'#888',marginTop:4 }}>→ {membre.username}</div>}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            <div style={S.section}>
              <div style={{ fontSize:15,fontWeight:700,marginBottom:4 }}>Classement de la ligue</div>
              <div style={{ fontSize:12,color:'#888',marginBottom:16 }}>Valeur totale = liquidités + actions au prix du marché en temps réel</div>
              {members.length===0 ? <div style={{ color:'#aaa',fontSize:14 }}>Aucun membre pour l'instant.</div>
                : members.map((m,i)=>{
                    const cashVal=m.cash||0, stockVal=m.stock_value||0;
                    const displayTotal=cashVal+stockVal;
                    const medals=['🥇','🥈','🥉'];
                    const capitalDepart=league.capital_virtuel||0;
                    const gainPct=capitalDepart>0?((displayTotal-capitalDepart)/capitalDepart*100):0;
                    return (
                      <div key={m.user_id||i} style={{ ...S.teamRow,cursor:'default',padding:'14px 0' }}>
                        <div style={{ width:32,height:32,borderRadius:'50%',background:i===0?'#f1c40f':i===1?'#bdc3c7':i===2?'#cd7f32':'#eee',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,color:i<3?'#fff':'#888',flexShrink:0 }}>
                          {i<3?medals[i]:i+1}
                        </div>
                        <div style={{ flex:1,marginLeft:10 }}>
                          <div style={{ fontWeight:700,fontSize:14,color:'#111' }}>{m.username||m.user_id?.substring(0,8)}</div>
                          <div style={{ fontSize:11,color:'#888',marginTop:3,display:'flex',gap:10,flexWrap:'wrap' }}>
                            {m.is_creator&&<span style={{ color:'#c0392b',fontWeight:600 }}>Créateur</span>}
                            <span>💵 {cashVal.toLocaleString('fr-CA',{minimumFractionDigits:2,maximumFractionDigits:2})}$</span>
                            {stockVal>0&&<span>📈 {stockVal.toLocaleString('fr-CA',{minimumFractionDigits:2,maximumFractionDigits:2})}$ actions</span>}
                          </div>
                        </div>
                        <div style={{ textAlign:'right',flexShrink:0 }}>
                          <div style={{ fontWeight:700,fontSize:16,color:'#111' }}>{displayTotal.toLocaleString('fr-CA',{minimumFractionDigits:2,maximumFractionDigits:2})}$</div>
                          <div style={{ fontSize:11,marginTop:2,color:gainPct>0?'#27ae60':gainPct<0?'#c0392b':'#888',fontWeight:gainPct!==0?600:400 }}>
                            {gainPct===0?'— 0.00%':gainPct>0?`▲ +${gainPct.toFixed(2)}%`:`▼ ${gainPct.toFixed(2)}%`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>
        )}
      </div>

      {/* Modal trade standard */}
      {tradeModal && (
        <div style={S.modalBg} onClick={e => e.target===e.currentTarget&&setTradeModal(null)}>
          <div style={S.modalCard}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <TeamLogo id={tradeModal.team.id} size={40} />
                <div>
                  <div style={{ fontWeight:700,fontSize:16 }}>{tradeModal.side==='buy'?'Acheter':'Vendre'}</div>
                  <div style={{ fontSize:13,color:'#666' }}>{tradeModal.team.name}</div>
                </div>
              </div>
              <button onClick={() => setTradeModal(null)} style={{ background:'#f0f0f0',border:'none',borderRadius:'50%',width:32,height:32,fontSize:18,cursor:'pointer' }}>×</button>
            </div>
            <div style={{ background:'#f7f7f7',borderRadius:10,padding:'12px 14px',marginBottom:16 }}>
              {[['Prix actuel','$'+(tradeModal.team.price||25).toFixed(2)],['Variation (veille)',(tradeModal.team.changePct>=0?'+':'')+(tradeModal.team.changePct||0).toFixed(2)+'%'],['Vos liquidités','$'+cash.toFixed(2)]].map(([l,v]) => (
                <div key={l} style={{ display:'flex',justifyContent:'space-between',fontSize:14,padding:'5px 0',borderBottom:'1px solid #eee' }}>
                  <span style={{ color:'#666' }}>{l}</span><span style={{ fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>
            <label style={{ fontSize:14,fontWeight:600,color:'#333' }}>Lot (actions)</label>
            <div style={{ display:'flex',gap:6,marginTop:6,marginBottom:8,flexWrap:'wrap' }}>
              {[100,500,1000,5000,10000].map(n => (
                <button key={n} onClick={() => { setQty(n); setQtyDisplay(String(n)); }}
                  style={{ padding:'6px 12px',borderRadius:8,border:qty===n?'none':'1px solid #ddd',background:qty===n?'#c0392b':'#f8f8f8',color:qty===n?'#fff':'#555',fontSize:13,cursor:'pointer',fontWeight:qty===n?700:400 }}>
                  {n.toLocaleString()}
                </button>
              ))}
            </div>
            <input type="text" inputMode="numeric" value={qtyDisplay}
              onChange={e => { const raw=e.target.value.replace(/[^0-9]/g,''); setQtyDisplay(raw); const n=parseInt(raw); if(!isNaN(n)&&n>0) setQty(n); }}
              onFocus={e => e.target.select()} style={{ ...S.inp,fontSize:18,fontWeight:600 }} placeholder="Quantité..." />
            <div style={{ fontSize:13,color:'#888',marginTop:8,padding:'8px 12px',background:'#f0f7ff',borderRadius:8 }}>
              {(() => {
                const prix=tradeModal.team.price||25, spread=0.01;
                const prixAvecFrais=tradeModal.side==='buy'?prix*(1+spread):prix*(1-spread);
                const total=prixAvecFrais*qty;
                const insuffisant=tradeModal.side==='buy'&&cash<total;
                return (<><div>Prix exécution: <strong>${prixAvecFrais.toFixed(2)}</strong><span style={{ color:'#aaa',marginLeft:6,fontSize:11 }}>({tradeModal.side==='buy'?'+1% frais achat':'-1% frais vente'})</span></div><div style={{ marginTop:4 }}>Total: <strong>${total.toLocaleString('fr-CA',{minimumFractionDigits:2,maximumFractionDigits:2})}</strong>{insuffisant&&<span style={{ color:'#c0392b',marginLeft:8 }}>(!) Liquidités insuffisantes</span>}</div></>);
              })()}
            </div>
            {tradeModal.side==='buy'&&(()=>{
              const conc=getConcentration(tradeModal.team.id,qty,tradeModal.team.price||25);
              const nb=getNbEquipes(tradeModal.team.id);
              const over40=conc>0.40, over25need3=conc>0.25&&nb<3, warn=conc>0.25&&!over40;
              if(!over40&&!over25need3&&!warn) return null;
              return (<div style={{ marginTop:8,padding:'10px 12px',borderRadius:8,background:over40||over25need3?'#fff0f0':'#fffbe6',border:`1px solid ${over40||over25need3?'#c0392b':'#f0c040'}` }}><div style={{ fontSize:12,fontWeight:700,color:over40||over25need3?'#c0392b':'#7a5800',marginBottom:4 }}>{over40?'🚫 Limite concentration (40% max)':over25need3?'🚫 Diversification requise (3 équipes min >25%)':'⚠️ Concentration élevée'}</div><div style={{ fontSize:12,color:'#555' }}>Cette position: <strong>{Math.round(conc*100)}%</strong> du portefeuille.</div></div>);
            })()}
            <button style={S.btnFull(tradeModal.side==='buy'?'#c0392b':'#1a5276')} onClick={executeTrade}>Confirmer {tradeModal.side==='buy'?"l'achat":'la vente'}</button>
            <button style={{ ...S.btnFull('#f0f0f0'),color:'#555',marginTop:8 }} onClick={() => setTradeModal(null)}>Annuler</button>
          </div>
        </div>
      )}

      {/* Modal vente de détresse */}
      {distressModal && (
        <DistressSellModal
          position={distressModal.position}
          team={distressModal.team}
          token={token}
          leagueId={league.id}
          onClose={() => setDistressModal(null)}
          onSuccess={msg => { showToast(msg); fetchAll(); }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed',bottom:20,right:20,background:'#111',color:'#fff',padding:'12px 20px',borderRadius:10,fontSize:14,zIndex:9999 }}>{toast}</div>
      )}
    </div>
  );
}
