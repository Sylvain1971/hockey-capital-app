'use client';
import { useLeagueSetup } from '../../../hooks/useLeague';
import Step1League from '../../../components/wizard/Step1League';
import { Step2Market, Step3Prize, Step4Algo } from '../../../components/wizard/Step2345';
import LiveMarket from '../../../components/market/LiveMarket';
import { leagues } from '../../../lib/leagueApi';
import { useState } from 'react';

const STEPS = [
  { n:1, label:'Ma ligue' },
  { n:2, label:'Règles du marché' },
  { n:3, label:'Cagnotte' },
  { n:4, label:'Algorithme' },
  { n:5, label:'Bourse live' },
];

export default function CreateLeaguePage() {
  const { step, setStep, config, update, updateAlgo, derived } = useLeagueSetup();
  const [creating, setCreating] = useState(false);

  async function handleLaunch() {
    setCreating(true);
    try {
      // En production, appeler l'API backend
      // const league = await leagues.create(config);
      // router.push(`/league/${league.id}/play`);
      setStep(5);
    } catch (e) {
      console.error('Erreur création ligue:', e);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'1rem', fontFamily:'var(--font-sans)' }}>

      {/* Wizard header */}
      <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:'2rem' }}>
        {STEPS.map((s, i) => (
          <div key={s.n} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length - 1 ? '1' : 'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, cursor: step > s.n ? 'pointer' : 'default' }}
              onClick={() => step > s.n && setStep(s.n)}>
              <div style={{
                width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:12, fontWeight:500, flexShrink:0,
                background: step === s.n ? '#c0392b' : step > s.n ? '#27ae60' : 'var(--color-background-primary)',
                color: step >= s.n ? '#fff' : 'var(--color-text-secondary)',
                border: step < s.n ? '1.5px solid var(--color-border-secondary)' : 'none',
              }}>
                {step > s.n ? '✓' : s.n}
              </div>
              <span style={{ fontSize:12, fontWeight: step === s.n ? 500 : 400, color: step === s.n ? 'var(--color-text-primary)' : step > s.n ? '#27ae60' : 'var(--color-text-secondary)', whiteSpace:'nowrap' }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex:1, height:1, background: step > s.n ? '#27ae60' : 'var(--color-border-tertiary)', margin:'0 8px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Étape 1 */}
      {step === 1 && <Step1League config={config} update={update} derived={derived} />}

      {/* Étape 2 */}
      {step === 2 && <Step2Market config={config} update={update} derived={derived} />}

      {/* Étape 3 */}
      {step === 3 && <Step3Prize config={config} update={update} derived={derived} />}

      {/* Étape 4 */}
      {step === 4 && <Step4Algo config={config} update={update} updateAlgo={updateAlgo} />}

      {/* Étape 5 — Bourse live */}
      {step === 5 && <LiveMarket config={config} leagueId={null} />}

      {/* Navigation */}
      {step < 5 && (
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'1.5rem' }}>
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            style={{ padding:'10px 22px', borderRadius:8, border:'0.5px solid var(--color-border-secondary)', background:'none', color:'var(--color-text-primary)', cursor: step === 1 ? 'not-allowed' : 'pointer', fontSize:14, opacity: step === 1 ? 0.4 : 1 }}>
            ← Retour
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              style={{ padding:'10px 22px', borderRadius:8, border:'none', background:'#c0392b', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:500 }}>
              Suivant — {STEPS[step].label} →
            </button>
          ) : (
            <button
              onClick={handleLaunch}
              disabled={creating}
              style={{ padding:'10px 28px', borderRadius:8, border:'none', background:'#27ae60', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:500, opacity: creating ? 0.7 : 1 }}>
              {creating ? 'Création...' : 'Lancer la bourse →'}
            </button>
          )}
        </div>
      )}

      {step === 5 && (
        <div style={{ textAlign:'center', marginTop:12 }}>
          <button onClick={() => setStep(1)} style={{ padding:'5px 14px', borderRadius:6, border:'0.5px solid var(--color-border-secondary)', background:'none', cursor:'pointer', fontSize:12, color:'var(--color-text-secondary)' }}>
            ← Modifier la configuration
          </button>
        </div>
      )}
    </div>
  );
}
