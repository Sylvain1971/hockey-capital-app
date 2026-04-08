'use client';
import { useState } from 'react';

const S = {
  overlay: { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.65)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  card: { background:'#fff', borderRadius:16, width:'100%', maxWidth:540, maxHeight:'92vh', overflowY:'auto', boxSizing:'border-box', boxShadow:'0 24px 64px rgba(0,0,0,0.35)' },
  hdr: { padding:'22px 24px 16px', borderBottom:'1px solid #eee', position:'sticky', top:0, background:'#fff', zIndex:1 },
  body: { padding:'20px 24px 24px' },
  lbl: { fontSize:14, fontWeight:600, color:'#222', display:'block', marginBottom:6 },
  inp: { width:'100%', padding:'12px 14px', border:'1.5px solid #ddd', borderRadius:10, background:'#fff', color:'#111', fontSize:15, boxSizing:'border-box', outline:'none' },
  sel: { width:'100%', padding:'12px 14px', border:'1.5px solid #ddd', borderRadius:10, background:'#fff', color:'#111', fontSize:15, boxSizing:'border-box' },
  row: { display:'flex', gap:12, marginBottom:16 },
  half: { flex:1 },
  mb: { marginBottom:16 },
  btn: { width:'100%', padding:14, borderRadius:10, border:'none', background:'#c0392b', color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer' },
  btnSec: { width:'100%', padding:12, borderRadius:10, border:'1.5px solid #ddd', background:'#fff', color:'#555', fontSize:15, cursor:'pointer', marginTop:8 },
  info: { background:'#f0f7ff', border:'1px solid #cce0ff', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#1a4a7a', marginBottom:16 },
  err: { color:'#c0392b', fontSize:13, marginTop:8, textAlign:'center' },
  chip: { display:'inline-flex', alignItems:'center', gap:6, background:'#f0f0f0', borderRadius:20, padding:'5px 12px', fontSize:13, margin:'3px' },
  steps: { display:'flex', gap:6, marginBottom:20 },
  dot: (a,i) => ({ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, background: i < a ? '#c0392b' : i === a ? '#c0392b' : '#eee', color: i <= a ? '#fff' : '#aaa', flexShrink:0 }),
  line: (a,i) => ({ flex:1, height:2, background: i < a ? '#c0392b' : '#eee', marginTop:13 }),
  success: { textAlign:'center', padding:'20px 0' },
  code: { background:'#f8f8f8', border:'2px dashed #c0392b', borderRadius:12, padding:'16px 24px', fontSize:28, fontWeight:800, letterSpacing:6, color:'#c0392b', textAlign:'center', margin:'16px 0' },
};

const STEP_LABELS = ['Ligue','Capital','Prix','Invitations','Confirmation'];

function StepDots({ current }) {
  return (
    <div style={S.steps}>
      {STEP_LABELS.map((lbl, i) => (
        <>
          <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={S.dot(current, i)}>{i + 1}</div>
            <div style={{ fontSize:10, color: i <= current ? '#c0392b' : '#aaa', fontWeight:600, whiteSpace:'nowrap' }}>{lbl}</div>
          </div>
          {i < STEP_LABELS.length - 1 && <div key={'l'+i} style={S.line(current, i)} />}
        </>
      ))}
    </div>
  );
}

// ---- Etape 1: Infos de base ----
function Step1({ d, set }) {
  return <>
    <div style={S.info}>Configurez votre ligue - les joueurs rejoindront via un code ou invitation email.</div>
    <div style={S.mb}>
      <label style={S.lbl}>Nom de la ligue *</label>
      <input style={S.inp} placeholder="Ex: Pool Hockey 2026" value={d.name} onChange={e => set('name', e.target.value)} />
    </div>
    <div style={S.row}>
      <div style={S.half}>
        <label style={S.lbl}>Nombre de joueurs</label>
        <select style={S.sel} value={d.players} onChange={e => set('players', parseInt(e.target.value))}>
          {[1,2,3,4,5,6,7,8,10,12,15,20].map(n => <option key={n} value={n}>{n === 1 ? '1 joueur (solo)' : `${n} joueurs`}</option>)}
        </select>
      </div>
      <div style={S.half}>
        <label style={S.lbl}>Duree de la saison</label>
        <select style={S.sel} value={d.duration} onChange={e => set('duration', e.target.value)}>
          <option value="week">1 semaine</option>
          <option value="month">1 mois</option>
          <option value="season">Saison complete</option>
          <option value="playoffs">Series seulement</option>
        </select>
      </div>
    </div>
    <div style={S.mb}>
      <label style={S.lbl}>Mode de draft</label>
      <select style={S.sel} value={d.draft} onChange={e => set('draft', e.target.value)}>
        <option value="libre">Libre - chacun achete ses equipes</option>
        <option value="serpentin">Serpentin - ordre alterne</option>
      </select>
    </div>
    <div style={S.mb}>
      <label style={S.lbl}>Limites de transactions</label>
      <select style={S.sel} value={d.tradeLimit} onChange={e => set('tradeLimit', parseInt(e.target.value))}>
        <option value={0}>Illimite</option>
        <option value={3}>3 par semaine</option>
        <option value={5}>5 par semaine</option>
        <option value={10}>10 par semaine</option>
      </select>
    </div>
  </>;
}

// ---- Etape 2: Capital et mise ----
function Step2({ d, set }) {
  return <>
    <div style={S.info}>Definissez la mise reelle et le capital virtuel de depart de chaque joueur.</div>
    <div style={S.row}>
      <div style={S.half}>
        <label style={S.lbl}>Mise reelle ($ CAD)</label>
        <input style={S.inp} type="number" min={0} value={d.mise} onChange={e => set('mise', parseFloat(e.target.value))} />
      </div>
      <div style={S.half}>
        <label style={S.lbl}>Capital virtuel par joueur</label>
        <select style={S.sel} value={d.capital} onChange={e => set('capital', parseInt(e.target.value))}>
          <option value={50000}>50 000 $</option>
          <option value={75000}>75 000 $</option>
          <option value={100000}>100 000 $</option>
          <option value={150000}>150 000 $</option>
          <option value={250000}>250 000 $</option>
        </select>
      </div>
    </div>
    <div style={S.mb}>
      <label style={S.lbl}>Options</label>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {[
          { key:'dividendsEnabled', lbl:'Dividendes actives (victoires = revenus)' },
          { key:'limitOrdersEnabled', lbl:'Ordres limites permis' },
          { key:'elimPenalty', lbl:'Penalite si equipe eliminee des series' },
        ].map(opt => (
          <label key={opt.key} style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, cursor:'pointer' }}>
            <input type="checkbox" checked={d[opt.key]} onChange={e => set(opt.key, e.target.checked)} style={{ width:18, height:18 }} />
            {opt.lbl}
          </label>
        ))}
      </div>
    </div>
  </>;
}

// ---- Etape 3: Distribution des prix ----
function Step3({ d, set }) {
  return <>
    <div style={S.info}>Comment les mises reelles seront-elles distribuees aux gagnants?</div>
    <div style={S.mb}>
      <label style={S.lbl}>Mode de distribution</label>
      <select style={S.sel} value={d.prizeMode} onChange={e => set('prizeMode', e.target.value)}>
        <option value="winner">Gagnant remporte tout</option>
        <option value="top2">Top 2 (70% / 30%)</option>
        <option value="top3">Top 3 (60% / 30% / 10%)</option>
        <option value="custom">Personnalise</option>
      </select>
    </div>
    {d.prizeMode !== 'custom' && d.mise > 0 && (
      <div style={{ background:'#f9f9f9', borderRadius:10, padding:'12px 16px', marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'#333', marginBottom:8 }}>Apercu avec {d.players} joueurs ({(d.players * d.mise).toFixed(2)}$ total)</div>
        {d.prizeMode === 'winner' && <div style={{ fontSize:14, color:'#27ae60' }}>1er: 1er: {(d.players * d.mise).toFixed(2)}$</div>}
        {d.prizeMode === 'top2' && <>
          <div style={{ fontSize:14, color:'#27ae60' }}>1er: 1er: {(d.players * d.mise * 0.70).toFixed(2)}$</div>
          <div style={{ fontSize:14, color:'#2980b9' }}>2e: 2e: {(d.players * d.mise * 0.30).toFixed(2)}$</div>
        </>}
        {d.prizeMode === 'top3' && <>
          <div style={{ fontSize:14, color:'#27ae60' }}>1er: 1er: {(d.players * d.mise * 0.60).toFixed(2)}$</div>
          <div style={{ fontSize:14, color:'#2980b9' }}>2e: 2e: {(d.players * d.mise * 0.30).toFixed(2)}$</div>
          <div style={{ fontSize:14, color:'#8e44ad' }}>3e: 3e: {(d.players * d.mise * 0.10).toFixed(2)}$</div>
        </>}
      </div>
    )}
    <div style={S.mb}>
      <label style={S.lbl}>Bonus en cours de saison (optionnel)</label>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {[
          { key:'bonusWeekly', lbl:'Bonus hebdomadaire au meilleur joueur de la semaine' },
          { key:'bonusMid', lbl:'Bonus a mi-saison' },
        ].map(opt => (
          <label key={opt.key} style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, cursor:'pointer' }}>
            <input type="checkbox" checked={d[opt.key] || false} onChange={e => set(opt.key, e.target.checked)} style={{ width:18, height:18 }} />
            {opt.lbl}
          </label>
        ))}
      </div>
    </div>
  </>;
}

// ---- Etape 4: Invitations par email ----
function Step4({ d, set }) {
  const [emailInput, setEmailInput] = useState('');
  const [err, setErr] = useState('');

  function addEmail() {
    const e = emailInput.trim().toLowerCase();
    if (!e.includes('@')) { setErr('Email invalide'); return; }
    if ((d.emails || []).includes(e)) { setErr('Deja ajoute'); return; }
    if ((d.emails || []).length >= d.players - 1) { setErr(`Maximum ${d.players - 1} invites (vous etes le createur)`); return; }
    set('emails', [...(d.emails || []), e]);
    setEmailInput('');
    setErr('');
  }

  function removeEmail(e) { set('emails', (d.emails || []).filter(x => x !== e)); }

  return <>
    <div style={S.info}>
      {d.players === 1
        ? 'Ligue solo - aucune invitation requise. Passez directement a la confirmation.'
        : 'Invitez vos joueurs par email. Ils recevront le code de la ligue et pourront s\'inscrire et rejoindre directement.'}
    </div>
    <div style={S.mb}>
      <label style={S.lbl}>Ajouter un joueur par email</label>
      <div style={{ display:'flex', gap:8 }}>
        <input style={{ ...S.inp, marginBottom:0 }} placeholder="joueur@email.com" value={emailInput}
          onChange={e => setEmailInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addEmail()} />
        <button onClick={addEmail} style={{ padding:'12px 18px', borderRadius:10, border:'none', background:'#c0392b', color:'#fff', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>+ Ajouter</button>
      </div>
      {err && <div style={S.err}>{err}</div>}
    </div>
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:13, color:'#888', marginBottom:8 }}>{(d.emails || []).length}/{d.players - 1} invites ajoutes</div>
      {(d.emails || []).length === 0
        ? <div style={{ fontSize:13, color:'#aaa', fontStyle:'italic' }}>Aucun invite - vous pouvez aussi partager le code manuellement apres creation.</div>
        : (d.emails || []).map(e => (
          <span key={e} style={S.chip}>{e} <span style={S.chipX} onClick={() => removeEmail(e)}>x</span></span>
        ))
      }
    </div>
    <div style={{ background:'#fffbf0', border:'1px solid #f0d080', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#7a5800' }}>
       Les joueurs invites pourront s'inscrire avec leur email et rejoindre automatiquement votre ligue.
    </div>
  </>;
}

// ---- Etape 5: Confirmation ----
function Step5({ d, result }) {
  if (result) return (
    <div style={S.success}>
      <div style={{ fontSize:40 }}>HC</div>
      <div style={{ fontSize:22, fontWeight:700, color:'#111', margin:'12px 0 4px' }}>Ligue creee!</div>
      <div style={{ fontSize:14, color:'#555', marginBottom:16 }}>Partagez ce code avec vos joueurs:</div>
      <div style={S.code}>{result.invite_code}</div>
      <div style={{ fontSize:13, color:'#888' }}>
        {(d.emails || []).length > 0 && `Invitations envoyees a ${(d.emails || []).length} joueur(s).`}
      </div>
      <div style={{ fontSize:13, color:'#555', marginTop:12 }}>
        Lien: <strong>hockey-capital-app.vercel.app</strong> — Code: 
      </div>
    </div>
  );
  return <>
    <div style={{ fontSize:15, fontWeight:600, color:'#222', marginBottom:16 }}>Resume de votre ligue</div>
    {[
      ['Nom', d.name],
      ['Joueurs', `${d.players} joueurs`],
      ['Duree', { week:'1 semaine', month:'1 mois', season:'Saison complete', playoffs:'Series seulement' }[d.duration]],
      ['Draft', { libre:'Libre', serpentin:'Serpentin' }[d.draft]],
      ['Mise reelle', `${d.mise}$ CAD`],
      ['Capital virtuel', `${d.capital.toLocaleString()}$`],
      ['Distribution', { winner:'Gagnant tout', top2:'Top 2', top3:'Top 3' }[d.prizeMode] || d.prizeMode],
      ['Transactions', d.tradeLimit === 0 ? 'Illimitees' : `${d.tradeLimit}/semaine`],
      ['Invites', (d.emails || []).length > 0 ? (d.emails || []).join(', ') : 'Aucun (code manuel)'],
    ].map(([lbl, val]) => (
      <div key={lbl} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f0f0f0', fontSize:14 }}>
        <span style={{ color:'#666' }}>{lbl}</span>
        <span style={{ fontWeight:500, color:'#111', maxWidth:'60%', textAlign:'right' }}>{val}</span>
      </div>
    ))}
  </>;
}

// ---- Composant principal LeagueWizard ----
const DEFAULT = {
  name:'', players:1, duration:'season', draft:'libre', tradeLimit:5,
  mise:20, capital:100000, maxConc:100, spread:2,
  dividendsEnabled:true, limitOrdersEnabled:true, elimPenalty:true,
  prizeMode:'top3', bonusWeekly:false, bonusMid:false,
  emails:[],
};

export default function LeagueWizard({ onClose, token }) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState({ ...DEFAULT });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);

  function set(k, v) { setD(prev => ({ ...prev, [k]: v })); }

  function canNext() {
    if (step === 0) return d.name.trim().length >= 2;
    return true;
  }

  async function submit() {
    setLoading(true); setErr('');
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API}/api/leagues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: d.name, players: d.players, duration: d.duration,
          draft: d.draft, mise: d.mise, capital: d.capital,
          tradeLimit: d.tradeLimit, maxConc: d.maxConc, spread: d.spread,
          dividendsEnabled: d.dividendsEnabled, limitOrdersEnabled: d.limitOrdersEnabled,
          elimPenalty: d.elimPenalty, prizeMode: d.prizeMode,
          bonusWeekly: d.bonusWeekly, bonusMid: d.bonusMid,
          inviteEmails: d.emails,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur serveur');
      setResult(data.league);
      setStep(4);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  const steps = [Step1, Step2, Step3, Step4, Step5];
  const StepComp = steps[step];

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.card}>
        <div style={S.hdr}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:19, fontWeight:700, color:'#111' }}>
              {result ? 'Ligue creee!' : 'Creer une ligue'}
            </div>
            <button onClick={onClose} style={{ background:'#f0f0f0', border:'none', borderRadius:'50%', width:32, height:32, fontSize:18, cursor:'pointer', color:'#555' }}>x</button>
          </div>
          {!result && <StepDots current={step} />}
        </div>
        <div style={S.body}>
          <StepComp d={d} set={set} result={result} />
          {err && <div style={S.err}>{err}</div>}
          {!result && (
            <div style={{ marginTop:20 }}>
              {step < 4 ? (
                <>
                  <button style={{ ...S.btn, opacity: canNext() ? 1 : 0.5 }}
                    disabled={!canNext()}
                    onClick={() => step === 3 ? submit() : setStep(s => s + 1)}>
                    {loading ? 'Creation...' : step === 3 ? 'Creer la ligue HC' : 'Suivant'}
                  </button>
                  {step > 0 && <button style={S.btnSec} onClick={() => setStep(s => s - 1)}>Retour</button>}
                </>
              ) : null}
            </div>
          )}
          {result && <button style={{ ...S.btn, marginTop:20 }} onClick={onClose}>Fermer</button>}
        </div>
      </div>
    </div>
  );
}
