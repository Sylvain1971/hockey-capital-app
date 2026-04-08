'use client';
import { useState, useEffect } from 'react';

const S = {
  overlay: { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.65)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  card: { background:'#fff', borderRadius:16, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', boxSizing:'border-box', boxShadow:'0 24px 64px rgba(0,0,0,0.3)' },
  hdr: { padding:'22px 24px 16px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'#fff', zIndex:1 },
  body: { padding:'16px 24px 24px' },
  lbl: { fontSize:14, fontWeight:600, color:'#222', display:'block', marginBottom:6 },
  inp: { width:'100%', padding:'12px 14px', border:'1.5px solid #ddd', borderRadius:10, background:'#fff', color:'#111', fontSize:15, boxSizing:'border-box' },
  btn: { width:'100%', padding:14, borderRadius:10, border:'none', background:'#c0392b', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', marginTop:8 },
  leagueCard: { border:'1.5px solid #eee', borderRadius:12, padding:'14px 16px', marginBottom:10, transition:'border-color 0.2s', cursor:'pointer' },
  leagueCardHover: { borderColor:'#c0392b' },
  badge: (s) => ({ display:'inline-block', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700, background: s==='active'?'#e8f8ee':s==='open'?'#fff3e0':'#f0f0f0', color: s==='active'?'#27ae60':s==='open'?'#e67e22':'#888' }),
  err: { color:'#c0392b', fontSize:13, marginTop:6 },
  divider: { display:'flex', alignItems:'center', gap:10, margin:'16px 0', color:'#aaa', fontSize:13 },
  btnDanger: { padding:'5px 12px', borderRadius:8, border:'1px solid #e74c3c', background:'#fff5f5', color:'#e74c3c', fontSize:12, cursor:'pointer', fontWeight:500 },
  btnCopy: { padding:'5px 12px', borderRadius:8, border:'1px solid #ddd', background:'#f8f8f8', fontSize:12, cursor:'pointer', color:'#555' },
  btnOpen: { padding:'6px 14px', borderRadius:8, border:'none', background:'#c0392b', color:'#fff', fontSize:13, cursor:'pointer', fontWeight:600 },
};

const STATUS_LABEL = { open:'En attente', active:'Active', closed:'Terminee' };

export default function MyLeagues({ onClose, token, onCreateNew, onOpenLeague }) {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => { fetchLeagues(); }, []);

  async function fetchLeagues() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/leagues/mine`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setLeagues(Array.isArray(data) ? data : []);
    } catch { setLeagues([]); }
    finally { setLoading(false); }
  }

  async function joinLeague() {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) { setErr('Code invalide'); return; }
    setJoining(true); setErr(''); setMsg('');
    try {
      const res = await fetch(`${API}/api/leagues/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ inviteCode: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(`Vous avez rejoint "${data.league?.name}" !`);
      setJoinCode('');
      fetchLeagues();
    } catch(e) { setErr(e.message); }
    finally { setJoining(false); }
  }

  async function deleteLeague(leagueId) {
    try {
      const res = await fetch(`${API}/api/leagues/${leagueId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setConfirmDelete(null);
      fetchLeagues();
    } catch(e) { alert('Erreur: ' + e.message); }
  }

  function handleOpenLeague(lg) {
    onClose();
    if (onOpenLeague) onOpenLeague(lg);
  }

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.card}>
        <div style={S.hdr}>
          <div style={{ fontSize:19, fontWeight:700, color:'#111' }}>Mes Ligues</div>
          <button onClick={onClose} style={{ background:'#f0f0f0', border:'none', borderRadius:'50%', width:32, height:32, fontSize:18, cursor:'pointer', color:'#555' }}>x</button>
        </div>
        <div style={S.body}>

          {/* Liste des ligues */}
          {loading
            ? <div style={{ color:'#aaa', fontSize:14, textAlign:'center', padding:20 }}>Chargement...</div>
            : leagues.length === 0
              ? <div style={{ color:'#aaa', fontSize:14, textAlign:'center', padding:'12px 0 4px' }}>Aucune ligue pour l'instant.</div>
              : <>
                <div style={{ fontSize:12, fontWeight:700, color:'#888', letterSpacing:1, marginBottom:10 }}>MES LIGUES ({leagues.length})</div>
                {leagues.map(lg => (
                  <div key={lg.id}
                    style={{ ...S.leagueCard, ...(hoveredId === lg.id ? S.leagueCardHover : {}) }}
                    onMouseEnter={() => setHoveredId(lg.id)}
                    onMouseLeave={() => setHoveredId(null)}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:15, color:'#111' }}>{lg.name}</div>
                        <div style={{ fontSize:12, color:'#888', marginTop:3 }}>
                          {lg.max_players} joueurs . {lg.duration} . Code: <strong style={{ letterSpacing:1 }}>{lg.invite_code}</strong>
                          {lg.is_creator && <span style={{ marginLeft:8, padding:'1px 8px', borderRadius:10, background:'#fff0f0', color:'#c0392b', fontSize:11, fontWeight:600 }}>Createur</span>}
                        </div>
                        <div style={{ fontSize:12, color:'#666', marginTop:2 }}>
                          Mise: <strong>{lg.mise_reelle}$</strong> . Capital: <strong>{(lg.capital_virtuel||0).toLocaleString()}$</strong>
                        </div>
                      </div>
                      <span style={S.badge(lg.status)}>{STATUS_LABEL[lg.status] || lg.status}</span>
                    </div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <button style={S.btnOpen} onClick={() => handleOpenLeague(lg)}>
                        > Ouvrir la ligue
                      </button>
                      <button style={S.btnCopy} onClick={() => { navigator.clipboard?.writeText(lg.invite_code); setMsg('Code copie!'); setTimeout(() => setMsg(''), 2000); }}>
                         {lg.invite_code}
                      </button>
                      {lg.is_creator && (
                        confirmDelete === lg.id
                          ? <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                              <span style={{ fontSize:12, color:'#e74c3c' }}>Supprimer?</span>
                              <button style={{ ...S.btnDanger, background:'#e74c3c', color:'#fff' }} onClick={() => deleteLeague(lg.id)}>Oui</button>
                              <button style={S.btnCopy} onClick={() => setConfirmDelete(null)}>Non</button>
                            </div>
                          : <button style={S.btnDanger} onClick={() => setConfirmDelete(lg.id)}>Supprimer</button>
                      )}
                    </div>
                  </div>
                ))}
              </>
          }
          {msg && <div style={{ color:'#27ae60', fontSize:13, margin:'6px 0', textAlign:'center' }}>{msg}</div>}
          {/* Divider */}
          <div style={S.divider}><div style={{ flex:1, height:1, background:'#eee' }} />ou<div style={{ flex:1, height:1, background:'#eee' }} /></div>
          {/* Rejoindre */}
          <div style={{ marginBottom:8 }}>
            <label style={S.lbl}>Rejoindre avec un code d'invitation</label>
            <div style={{ display:'flex', gap:8 }}>
              <input style={{ ...S.inp, textTransform:'uppercase', letterSpacing:2 }}
                placeholder="Ex: Q8T1XC" maxLength={8} value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && joinLeague()} />
              <button onClick={joinLeague} disabled={joining}
                style={{ padding:'12px 16px', borderRadius:10, border:'none', background:'#1a5276', color:'#fff', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                {joining ? '...' : 'Rejoindre'}
              </button>
            </div>
            {err && <div style={S.err}>{err}</div>}
          </div>
          <button style={S.btn} onClick={() => { onClose(); onCreateNew(); }}>+ Creer une nouvelle ligue</button>
        </div>
      </div>
    </div>
  );
}
