'use client';
import { useState, useEffect } from 'react';

/**
 * DistressSellModal — vente de détresse pour équipes figées
 * Affiche la pénalité progressive en temps réel et demande confirmation.
 */
export default function DistressSellModal({ position, team, token, leagueId, onClose, onSuccess }) {
  const [penalty, setPenalty]     = useState(0);
  const [cashOut, setCashOut]     = useState(0);
  const [cashBurn, setCashBurn]   = useState(0);
  const [loading, setLoading]     = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError]         = useState('');

  const API     = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const hdrs    = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const SPREAD  = 0.01;
  const shares  = position?.shares || 0;
  const locked  = team?.season_close_price || team?.price || 0;

  function calcPenalty() {
    const elimAt = team?.eliminated_at ? new Date(team.eliminated_at) : new Date();
    const jours  = Math.max(0, (Date.now() - elimAt.getTime()) / 86400000);
    const p      = Math.min(0.15 + Math.pow(jours, 2) * 0.025, 0.50);
    const gross  = locked * shares;
    const after  = gross * (1 - p) * (1 - SPREAD);
    const burned = gross * p;
    setPenalty(p);
    setCashOut(after);
    setCashBurn(burned);
  }

  // Recalculer toutes les 60 secondes
  useEffect(() => {
    calcPenalty();
    const iv = setInterval(calcPenalty, 60000);
    return () => clearInterval(iv);
  }, [team, position]);

  async function execute() {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/playoffs/distress-sell`, {
        method: 'POST', headers: hdrs,
        body: JSON.stringify({ leagueId, teamId: team.id, qty: shares }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur serveur');
      onSuccess(`Vente de détresse confirmée — ${cashOut.toFixed(2)}$ récupérés`);
      onClose();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const pctLabel = (penalty * 100).toFixed(1);
  const statusLabel = team?.playoff_status === 'eliminated' ? 'Éliminée en séries' : 'Non qualifiée';

  return (
    <div style={{ position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.7)',zIndex:4000,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'#fff',borderRadius:16,width:'100%',maxWidth:400,padding:'24px 20px',boxSizing:'border-box' }}>

        {/* En-tête */}
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16 }}>
          <div>
            <div style={{ fontWeight:700,fontSize:17,color:'#922b21' }}>⚠️ Vente de détresse</div>
            <div style={{ fontSize:13,color:'#666',marginTop:2 }}>{team?.name} · {statusLabel}</div>
          </div>
          <button onClick={onClose} style={{ background:'#f0f0f0',border:'none',borderRadius:'50%',width:30,height:30,fontSize:16,cursor:'pointer' }}>×</button>
        </div>

        {/* Résumé position */}
        <div style={{ background:'#f7f7f7',borderRadius:10,padding:'12px 14px',marginBottom:16 }}>
          {[
            ['Actions détenues', `${shares.toLocaleString()} actions`],
            ['Prix figé', `$${locked.toFixed(2)}/action`],
            ['Valeur brute', `$${(locked * shares).toLocaleString('fr-CA', {minimumFractionDigits:2, maximumFractionDigits:2})}`],
          ].map(([l,v]) => (
            <div key={l} style={{ display:'flex',justifyContent:'space-between',fontSize:13,padding:'4px 0',borderBottom:'1px solid #eee' }}>
              <span style={{ color:'#666' }}>{l}</span>
              <span style={{ fontWeight:600 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Pénalité temps réel */}
        <div style={{ background:'#fff0f0',borderRadius:10,padding:'14px',marginBottom:16,border:'1px solid #f5c6cb' }}>
          <div style={{ fontSize:11,fontWeight:700,color:'#922b21',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8 }}>
            Décompte de pénalité (recalculé à la minute)
          </div>
          {[
            ['Pénalité de détresse', `${pctLabel}%`, '#922b21'],
            ['Spread AMM', '1.0%', '#666'],
            ['💸 Cash brûlé', `-$${cashBurn.toLocaleString('fr-CA', {minimumFractionDigits:2, maximumFractionDigits:2})}`, '#922b21'],
            ['✅ Vous recevez', `$${cashOut.toLocaleString('fr-CA', {minimumFractionDigits:2, maximumFractionDigits:2})}`, '#27ae60'],
          ].map(([l,v,c]) => (
            <div key={l} style={{ display:'flex',justifyContent:'space-between',fontSize:13,padding:'4px 0',borderBottom:'1px solid #f5c6cb' }}>
              <span style={{ color:'#666' }}>{l}</span>
              <span style={{ fontWeight:700,color: c }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Avertissement pénalité croissante */}
        <div style={{ fontSize:12,color:'#888',marginBottom:16,padding:'8px 12px',background:'#fffbe6',borderRadius:8,border:'1px solid #f0c040' }}>
          ⏱ La pénalité augmente chaque jour — plafond à 50%. Après les séries, la vente sera impossible.
        </div>

        {error && <div style={{ color:'#c0392b',fontSize:13,marginBottom:12,padding:'8px 12px',background:'#fff0f0',borderRadius:8 }}>{error}</div>}

        {/* Confirmation à deux étapes */}
        {!confirmed ? (
          <button
            onClick={() => setConfirmed(true)}
            style={{ width:'100%',padding:14,borderRadius:10,border:'none',background:'#922b21',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer' }}>
            Je comprends — voir la confirmation
          </button>
        ) : (
          <div>
            <div style={{ fontSize:13,fontWeight:700,color:'#922b21',textAlign:'center',marginBottom:12 }}>
              Cette action est irréversible. Les actions seront détruites.
            </div>
            <button
              onClick={execute}
              disabled={loading}
              style={{ width:'100%',padding:14,borderRadius:10,border:'none',background: loading ? '#ccc' : '#922b21',color:'#fff',fontSize:15,fontWeight:700,cursor: loading ? 'default' : 'pointer' }}>
              {loading ? 'Traitement...' : `Confirmer — perdre $${cashBurn.toFixed(2)}`}
            </button>
            <button onClick={() => setConfirmed(false)} style={{ width:'100%',padding:12,borderRadius:10,border:'1px solid #ddd',background:'none',color:'#555',fontSize:14,cursor:'pointer',marginTop:8 }}>
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
