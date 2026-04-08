'use client';
import { useState, useEffect } from 'react';

const S = {
  overlay: { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.65)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  card: { background:'#fff', borderRadius:16, width:'100%', maxWidth:500, maxHeight:'90vh', overflowY:'auto', boxSizing:'border-box', boxShadow:'0 24px 64px rgba(0,0,0,0.3)' },
  hdr: { padding:'22px 24px 16px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center' },
  body: { padding:'16px 24px 24px' },
  lbl: { fontSize:14, fontWeight:600, color:'#222', display:'block', marginBottom:6 },
  inp: { width:'100%', padding:'12px 14px', border:'1.5px solid #ddd', borderRadius:10, background:'#fff', color:'#111', fontSize:15, boxSizing:'border-box' },
  btn: { width:'100%', padding:14, borderRadius:10, border:'none', background:'#c0392b', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', marginTop:8 },
  btnGhost: { width:'100%', padding:12, borderRadius:10, border:'1.5px solid #ddd', background:'#fff', color:'#555', fontSize:14, cursor:'pointer', marginTop:8 },
  leagueCard: { border:'1.5px solid #eee', borderRadius:12, padding:'14px 16px', marginBottom:10, cursor:'pointer', transition:'border-color 0.2s' },
  badge: (s) => ({ display:'inline-block', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700, background: s==='active'?'#e8f8ee':s==='open'?'#fff3e0':'#f0f0f0', color: s==='active'?'#27ae60':s==='open'?'#e67e22':'#888' }),
  err: { color:'#c0392b', fontSize:13, marginTop:6 },
  divider: { display:'flex', alignItems:'center', gap:10, margin:'16px 0', color:'#aaa', fontSize:13 },
};

export default function MyLeagues({ onClose, token, onCreateNew }) {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => { fetchLeagues(); }, []);

  async function fetchLeagues() {
    try {
      const res = await fetch(`${API}/api/leagues/mine`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ inviteCode: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(`Vous avez rejoint "${data.league?.name || 'la ligue'}" !`);
      setJoinCode('');
      fetchLeagues();
    } catch(e) { setErr(e.message); }
    finally { setJoining(false); }
  }

  const STATUS_LABEL = { open:'En attente', active:'Active', closed:'Terminée' };

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.card}>
        <div style={S.hdr}>
          <div style={{ fontSize:19, fontWeight:700, color:'#111' }}>Mes Ligues</div>
          <button onClick={onClose} style={{ background:'#f0f0f0', border:'none', borderRadius:'50%', width:32, height:32, fontSize:18, cursor:'pointer', color:'#555' }}>×</button>
        </div>
        <div style={S.body}>
          {/* Mes ligues existantes */}
          {loading ? <div style={{ color:'#aaa', fontSize:14, textAlign:'center', padding:20 }}>Chargement...</div>
          : leagues.length === 0
            ? <div style={{ color:'#aaa', fontSize:14, textAlign:'center', padding:'12px 0 4px' }}>Vous ne participez à aucune ligue pour l'instant.</div>
            : <>
              <div style={{ fontSize:13, fontWeight:600, color:'#888', marginBottom:8 }}>MES LIGUES ({leagues.length})</div>
              {leagues.map(lg => (
                <div key={lg.id} style={S.leagueCard}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:15, color:'#111' }}>{lg.name}</div>
                      <div style={{ fontSize:12, color:'#888', marginTop:2 }}>
                        {lg.max_players} joueurs · {lg.duration} · Code: <strong>{lg.invite_code}</strong>
                      </div>
                    </div>
                    <span style={S.badge(lg.status)}>{STATUS_LABEL[lg.status] || lg.status}</span>
                  </div>
                  <div style={{ display:'flex', gap:6, marginTop:10 }}>
                    <div style={{ flex:1, fontSize:12, color:'#555' }}>
                      Mise: <strong>{lg.mise_reelle}$</strong> · Capital: <strong>{lg.capital_virtuel.toLocaleString()}$</strong>
                    </div>
                    <button onClick={() => navigator.clipboard?.writeText(lg.invite_code)}
                      style={{ padding:'4px 10px', borderRadius:8, border:'1px solid #ddd', background:'#f8f8f8', fontSize:12, cursor:'pointer', color:'#555' }}>
                      📋 Copier code
                    </button>
                  </div>
                </div>
              ))}
            </>
          }
          {/* Divider */}
          <div style={S.divider}><div style={{ flex:1, height:1, background:'#eee' }} />ou<div style={{ flex:1, height:1, background:'#eee' }} /></div>
          {/* Rejoindre avec un code */}
          <div style={{ marginBottom:8 }}>
            <label style={S.lbl}>Rejoindre une ligue avec un code</label>
            <div style={{ display:'flex', gap:8 }}>
              <input style={{ ...S.inp, marginBottom:0, textTransform:'uppercase', letterSpacing:2 }}
                placeholder="Ex: Q8T1XC" maxLength={8} value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && joinLeague()} />
              <button onClick={joinLeague} disabled={joining}
                style={{ padding:'12px 16px', borderRadius:10, border:'none', background:'#1a5276', color:'#fff', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                {joining ? '...' : 'Rejoindre'}
              </button>
            </div>
            {err && <div style={S.err}>{err}</div>}
            {msg && <div style={{ color:'#27ae60', fontSize:13, marginTop:6 }}>{msg}</div>}
          </div>
          {/* Créer une nouvelle ligue */}
          <button style={S.btn} onClick={() => { onClose(); onCreateNew(); }}>
            + Créer une nouvelle ligue
          </button>
        </div>
      </div>
    </div>
  );
}
