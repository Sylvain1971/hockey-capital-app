'use client';
import { DELAY_OPTIONS, DEFAULT_ALGO } from '../../lib/leagueApi';

const s = {
  card: { background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 },
  label: { fontSize:12, color:'var(--color-text-secondary)', display:'block', marginBottom:5, fontWeight:500 },
  slRow: { display:'flex', alignItems:'center', gap:10, marginBottom:12 },
  slLabel: { fontSize:12, color:'var(--color-text-secondary)', minWidth:190 },
  slVal: (up) => ({ fontSize:13, fontWeight:500, minWidth:72, textAlign:'right', color: up === true ? '#27ae60' : up === false ? '#c0392b' : 'var(--color-text-primary)' }),
  opt: (sel) => ({ border: sel ? '2px solid #c0392b' : '0.5px solid var(--color-border-tertiary)', borderRadius:10, padding:'10px 14px', cursor:'pointer', background: sel ? 'var(--color-background-secondary)' : 'var(--color-background-primary)' }),
  checkRow: { display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', fontSize:13, marginBottom:12 },
  obAsk: { background:'rgba(192,57,43,0.07)', borderRadius:4, padding:'5px 9px', marginBottom:2, fontSize:12, display:'flex', justifyContent:'space-between' },
  obBid: { background:'rgba(39,174,96,0.07)', borderRadius:4, padding:'5px 9px', marginBottom:2, fontSize:12, display:'flex', justifyContent:'space-between' },
  obMM:  { background:'rgba(41,128,185,0.07)', borderRadius:4, padding:'5px 9px', marginBottom:2, fontSize:12, display:'flex', justifyContent:'space-between' },
  spreadLine: { textAlign:'center', fontSize:11, color:'var(--color-text-secondary)', padding:'4px 0', borderTop:'0.5px dashed var(--color-border-secondary)', borderBottom:'0.5px dashed var(--color-border-secondary)', margin:'3px 0' },
  badge: (bg, color) => ({ display:'inline-block', padding:'2px 7px', borderRadius:5, fontSize:10, fontWeight:500, background:bg, color }),
  infoBox: (bg, color) => ({ background:bg, color, borderRadius:8, padding:'10px 14px', fontSize:12, lineHeight:1.6, marginBottom:12 }),
  finRow: { display:'flex', justifyContent:'space-between', fontSize:13, padding:'5px 0', borderBottom:'0.5px solid var(--color-border-tertiary)' },
  prizBar: { height:8, background:'var(--color-background-secondary)', borderRadius:4, overflow:'hidden', marginTop:4 },
};

// ================================================================
// ÉTAPE 2 — Règles du marché
// ================================================================
export function Step2Market({ config, update, derived }) {
  const ask = derived.ammAsk.toFixed(2);
  const bid = derived.ammBid.toFixed(2);
  const spread$ = derived.spreadDollar;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
      <div>
        <div style={s.card}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:14 }}>Paramètres de trading</div>
          <div style={{ marginBottom:4 }}>
            <label style={s.label}>Transactions max par semaine <span style={{ fontWeight:400 }}>(0 = illimité)</span></label>
            <div style={s.slRow}>
              <input type="range" min={0} max={20} step={1} value={config.tradeLimit} onChange={e => update({ tradeLimit: parseInt(e.target.value) })} style={{ flex:1 }} />
              <span style={s.slVal()}>{config.tradeLimit === 0 ? 'Illimité' : `${config.tradeLimit} /sem.`}</span>
            </div>
          </div>
          <div style={{ marginBottom:4 }}>
            <label style={s.label}>Concentration max par équipe <span style={{ fontWeight:400 }}>({config.maxConc}% du capital = {derived.maxInvestPerTeam.toLocaleString('fr-CA')} $)</span></label>
            <div style={s.slRow}>
              <input type="range" min={10} max={100} step={5} value={config.maxConc} onChange={e => update({ maxConc: parseInt(e.target.value) })} style={{ flex:1 }} />
              <span style={s.slVal()}>{config.maxConc} %</span>
            </div>
          </div>
          <div style={{ marginBottom:4 }}>
            <label style={s.label}>Spread AMM <span style={{ fontWeight:400 }}>(friction de marché)</span></label>
            <div style={s.slRow}>
              <input type="range" min={0.5} max={5} step={0.5} value={config.spread} onChange={e => update({ spread: parseFloat(e.target.value) })} style={{ flex:1 }} />
              <span style={s.slVal()}>±{spread$.toFixed(2)} $ / action</span>
            </div>
          </div>
          <div>
            <label style={s.label}>Délai minimum entre deux trades</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {DELAY_OPTIONS.map(d => (
                <div key={d.id} style={s.opt(config.delay === d.id)} onClick={() => update({ delay: d.id })}>
                  <div style={{ fontSize:13, fontWeight:500, marginBottom:3 }}>{d.label}</div>
                  <div style={{ fontSize:11, color:'var(--color-text-secondary)' }}>{d.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={s.card}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:14 }}>Fonctionnalités avancées</div>
          {[
            { key:'dividendsEnabled', label:'Dividendes activés',         desc:`${DEFAULT_ALGO.divBase.toFixed(2)} $/action après chaque victoire (×multiplicateur streak)`, def:true },
            { key:'limitOrdersEnabled',label:'Ordres limités',            desc:'Les joueurs placent des ordres qui s\'exécutent automatiquement à un prix cible', def:true },
            { key:'shortEnabled',      label:'Vente à découvert',         desc:'Parier contre une équipe — mode avancé', def:false },
            { key:'elimPenalty',       label:'Pénalité d\'élimination',   desc:'-20% instantané si une équipe est éliminée en séries', def:true },
          ].map(opt => (
            <label key={opt.key} style={s.checkRow}>
              <input type="checkbox" defaultChecked={opt.def} style={{ marginTop:2, flexShrink:0 }} onChange={e => update({ [opt.key]: e.target.checked })} />
              <div>
                <div style={{ fontWeight:500 }}>{opt.label}</div>
                <div style={{ fontSize:11, color:'var(--color-text-secondary)' }}>{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
      <div>
        <div style={s.card}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Aperçu du carnet d'ordres AMM</div>
          <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:8 }}>MTL @ 5.00 $ — avec tes paramètres</div>
          <div style={s.obAsk}><span>$ {(parseFloat(ask)+0.08).toFixed(2)} × 500</span><span style={s.badge('var(--color-background-secondary)','var(--color-text-secondary)')}>Joueur (Marc)</span></div>
          <div style={s.obMM}><span>$ {ask} × ∞</span><span style={s.badge('#eaf4fb','#1a6fa0')}>AMM</span></div>
          <div style={s.spreadLine}>Réf LNH: $5.00 · Spread: {config.spread.toFixed(1)}% · Écart: ${(parseFloat(ask)-parseFloat(bid)).toFixed(2)}</div>
          <div style={s.obMM}><span>$ {bid} × ∞</span><span style={s.badge('#eaf4fb','#1a6fa0')}>AMM</span></div>
          <div style={s.obBid}><span>$ {(parseFloat(bid)-0.12).toFixed(2)} × 800</span><span style={s.badge('var(--color-background-secondary)','var(--color-text-secondary)')}>Joueur (Sylvain)</span></div>
          <div style={s.infoBox('#eaf4fb','#1a6fa0')}>Le market maker garantit qu'il y a toujours un acheteur et un vendeur. Les joueurs peuvent sous-coter l'AMM pour capturer le spread.</div>
        </div>
        <div style={s.card}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:12 }}>Impact des règles sur la stratégie</div>
          {[
            { label: config.tradeLimit > 0 ? `Max ${config.tradeLimit} trades/sem.` : 'Trades illimités', impact: config.tradeLimit > 0 ? 'Stratégie long terme' : 'Day trading possible', bg:'#eaf4fb', color:'#1a6fa0' },
            { label: `Concentration max ${config.maxConc}%`, impact: 'Diversification forcée', bg:'#eaf4fb', color:'#1a6fa0' },
            { label: `Spread AMM ${config.spread.toFixed(1)}%`, impact: `Friction ±$${spread$.toFixed(2)}/action`, bg:'var(--color-background-secondary)', color:'var(--color-text-secondary)' },
            { label: config.delay !== 'none' ? `Délai ${config.delay} entre trades` : 'Aucun délai', impact: config.delay !== 'none' ? 'Pas de trading frénétique' : 'Réactivité maximale', bg: config.delay !== 'none' ? '#faeeda' : 'var(--color-background-secondary)', color: config.delay !== 'none' ? '#633806' : 'var(--color-text-secondary)' },
          ].map((r, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:12 }}>
              <span style={s.badge(r.bg, r.color)}>{r.label}</span>
              <span style={{ color:'var(--color-text-secondary)' }}>{r.impact}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ================================================================
// ÉTAPE 3 — Cagnotte
// ================================================================
export function Step3Prize({ config, update, derived }) {
  const { players, mise, prizeMode, cagnotteNette } = { ...config, cagnotteNette: derived.cagnotteNette };
  const nets = derived.cagnotteNette;

  const MODES = [
    { id:'winner', label:'Gagnant tout',   desc:'Le #1 empoche tout',              badge:['#faeeda','#633806','Tension max'], dist:[{r:1,pct:100,m:'🥇'}] },
    { id:'top3',   label:'Top 3',          desc:'60% / 25% / 15%',                 badge:['#eafaf1','#1e8449','Classique'],  dist:[{r:1,pct:60,m:'🥇'},{r:2,pct:25,m:'🥈'},{r:3,pct:15,m:'🥉'}] },
    { id:'top50',  label:'Top 50%',        desc:'La moitié gagne quelque chose',    badge:['#eaf4fb','#1a6fa0','Inclusif'],   dist: Array.from({length:Math.ceil(players/2)},(_,i)=>({r:i+1,pct:[50,25,15,10][i]||5,m:['🥇','🥈','🥉','4e','5e'][i]||(i+1)+'e'})) },
    { id:'custom', label:'Personnalisé',   desc:'Tes propres pourcentages',         badge:['var(--color-background-secondary)','var(--color-text-secondary)','Flexible'], dist:[] },
  ];
  const selected = MODES.find(m => m.id === prizeMode) || MODES[1];

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
      <div>
        <div style={s.card}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:14 }}>Répartition de la cagnotte</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
            {MODES.map(m => (
              <div key={m.id} style={s.opt(prizeMode === m.id)} onClick={() => update({ prizeMode: m.id })}>
                <div style={{ fontSize:13, fontWeight:500, marginBottom:3 }}>{m.label}</div>
                <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:5 }}>{m.desc}</div>
                <span style={s.badge(m.badge[0], m.badge[1])}>{m.badge[2]}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>Bonus supplémentaires</div>
          {[
            { key:'bonusWeekly', label:'Bonus meilleure semaine', desc:'5% de la cagnotte au meilleur portfolio chaque semaine' },
            { key:'bonusMid',    label:'Pot de mi-saison',        desc:'10% versé au leader à mi-chemin — garde l\'intérêt' },
            { key:'bonusLast',   label:'Consolation dernier',     desc:'Le dernier récupère sa mise (loser gets out free)' },
          ].map(b => (
            <label key={b.key} style={s.checkRow}>
              <input type="checkbox" checked={config[b.key]} style={{ marginTop:2, flexShrink:0 }} onChange={e => update({ [b.key]: e.target.checked })} />
              <div>
                <div style={{ fontWeight:500 }}>{b.label}</div>
                <div style={{ fontSize:11, color:'var(--color-text-secondary)' }}>{b.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
      <div>
        <div style={s.card}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:12 }}>Distribution simulée — cagnotte {nets} $</div>
          {selected.dist.map(d => (
            <div key={d.r} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:13 }}>
              <span style={{ fontSize:18 }}>{d.m}</span>
              <span style={{ minWidth:40, fontWeight:500 }}>#{d.r}</span>
              <div style={{ flex:1 }}>
                <div style={s.prizBar}><div style={{ height:'100%', width:`${d.pct}%`, background:'#c0392b', borderRadius:4 }} /></div>
              </div>
              <span style={{ color:'var(--color-text-secondary)', minWidth:36 }}>{d.pct}%</span>
              <span style={{ fontWeight:500, color:'#27ae60', minWidth:52, textAlign:'right' }}>${Math.round(nets * d.pct / 100)}</span>
            </div>
          ))}
          {prizeMode === 'custom' && <div style={{ ...s.infoBox('#faeeda','#633806'), marginTop:10 }}>Mode personnalisé — tu pourras définir tes % après avoir lancé la ligue.</div>}
        </div>
        <div style={s.card}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:12 }}>Résumé financier</div>
          {[
            [`${players} joueurs × ${mise}$`, `${derived.cagnotteBrute} $`],
            ['Frais plateforme (5%)', `-${derived.cagnotteFee} $`],
            ['Cagnotte nette', `${derived.cagnotteNette} $`],
            ['Capital virtuel / joueur', `${config.capital.toLocaleString('fr-CA')} $`],
            ['Actions max / équipe', `${derived.maxActionsPerTeam.toLocaleString('fr-CA')} actions`],
          ].map(([l, v], i) => (
            <div key={i} style={{ ...s.finRow, borderBottom: i === 4 ? 'none' : undefined }}>
              <span style={{ color:'var(--color-text-secondary)' }}>{l}</span>
              <strong style={{ color: i === 2 ? '#27ae60' : i === 1 ? '#c0392b' : undefined }}>{v}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ================================================================
// ÉTAPE 4 — Algorithme
// ================================================================
export function Step4Algo({ config, update, updateAlgo }) {
  const { algo } = config;
  const p = 5.00;

  const sliders = [
    { group:'match', items:[
      { key:'winReg',  label:'Victoire régulière',  min:1,  max:10, step:0.5, up:true  },
      { key:'winOT',   label:'Victoire OT / FP',    min:0.5,max:6,  step:0.5, up:true  },
      { key:'shutout', label:'Bonus blanchissage',   min:0.5,max:8,  step:0.5, up:true  },
      { key:'lossReg', label:'Défaite régulière',    min:0.5,max:8,  step:0.5, up:false },
      { key:'lossOT',  label:'Défaite OT / FP',      min:0.5,max:4,  step:0.5, up:false },
    ]},
    { group:'streak', items:[
      { key:'m3', label:'Streak 3+ victoires', min:1.1, max:3,  step:0.1, mult:true },
      { key:'m5', label:'Streak 5+ victoires', min:1.5, max:4,  step:0.1, mult:true },
      { key:'m7', label:'Streak 7+ victoires', min:2,   max:6,  step:0.1, mult:true },
    ]},
    { group:'class', items:[
      { key:'r1',     label:'Rang #1 division (hebdo)',  min:0.25, max:3,  step:0.25, up:true  },
      { key:'r23',    label:'Rang #2-3 division (hebdo)',min:0.1,  max:2,  step:0.1,  up:true  },
      { key:'r9',     label:'Rang 9+ division (hebdo)',  min:0.25, max:3,  step:0.25, up:false },
      { key:'divBase',label:'Dividende ($/action)',      min:0.01, max:0.5, step:0.01, dollar:true, up:true },
      { key:'clinch', label:'Qualification séries (%)',  min:5,    max:25,  step:1,   up:true  },
    ]},
  ];

  const events = [
    { lbl:'Victoire rég.', pct: algo.winReg/100, pos:true },
    { lbl:'V. + blanchissage', pct:(algo.winReg+algo.shutout)/100, pos:true },
    { lbl:'Streak ×3', pct:algo.winReg/100*algo.m3, pos:true },
    { lbl:'Streak ×7', pct:algo.winReg/100*algo.m7, pos:true },
    { lbl:'Défaite rég.', pct:-algo.lossReg/100, pos:false },
    { lbl:'Qualif. séries', pct:algo.clinch/100, pos:true },
  ];

  function fmtSlider(item, val) {
    if (item.mult) return `×${parseFloat(val).toFixed(1)}`;
    if (item.dollar) return `$${parseFloat(val).toFixed(2)}`;
    return `${item.up ? '+' : '-'}${parseFloat(val).toFixed(1)} %`;
  }

  return (
    <div>
      <div style={s.infoBox('#eaf4fb','#1a6fa0')}>
        Ces hypothèses viennent de la <strong>VERSION INITIALE</strong> de Hockey Capital. Modifie-les pour ta ligue — elles s'appliquent uniquement à tes participants.
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div>
          {sliders.map(({ group, items }) => (
            <div key={group} style={s.card}>
              <div style={{ fontSize:14, fontWeight:500, marginBottom:14 }}>
                {group === 'match' ? 'Impact des résultats de match' : group === 'streak' ? 'Multiplicateurs de streak' : 'Classement & dividendes'}
              </div>
              {items.map(item => (
                <div key={item.key} style={s.slRow}>
                  <span style={s.slLabel}>{item.label}</span>
                  <input type="range" min={item.min} max={item.max} step={item.step} value={algo[item.key]}
                    onChange={e => updateAlgo({ [item.key]: parseFloat(e.target.value) })} style={{ flex:1 }} />
                  <span style={s.slVal(item.up)}>{fmtSlider(item, algo[item.key])}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div>
          <div style={s.card}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:12 }}>Impact sur 5 $/action</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead><tr>
                {['Événement','%','$/action','× 1 000 actions'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'6px 8px', color:'var(--color-text-secondary)', fontWeight:400, borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:11 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {events.map((e, i) => {
                  const dollar = p * e.pct;
                  const k = dollar * 1000;
                  const c = e.pos ? '#27ae60' : '#c0392b';
                  return (
                    <tr key={i}>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>{e.lbl}</td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', color:c, fontWeight:500 }}>{e.pct >= 0 ? '+' : ''}{(e.pct*100).toFixed(2)}%</td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', color:c, fontWeight:500 }}>{e.pct >= 0 ? '+' : ''}${Math.abs(dollar).toFixed(2)}</td>
                      <td style={{ padding:'7px 8px', borderBottom:'0.5px solid var(--color-border-tertiary)', color:c, fontWeight:500 }}>{e.pct >= 0 ? '+' : ''}${Math.abs(k).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={s.card}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:12 }}>Résumé de tes hypothèses</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3px 12px', fontSize:11 }}>
              {[
                ['Prix / action','$5.00'],
                ['Actions / équipe','10 000'],
                ['V. rég.',`+${algo.winReg.toFixed(1)}%`],
                ['V. OT',`+${algo.winOT.toFixed(1)}%`],
                ['Blanchissage',`+${algo.shutout.toFixed(1)}%`],
                ['D. rég.',`-${algo.lossReg.toFixed(1)}%`],
                ['D. OT',`-${algo.lossOT.toFixed(1)}%`],
                ['Streak 3+',`×${algo.m3.toFixed(1)}`],
                ['Streak 7+',`×${algo.m7.toFixed(1)}`],
                ['Rang #1/sem',`+${algo.r1.toFixed(1)}%`],
                ['Dividende',`$${algo.divBase.toFixed(2)}/action`],
                ['Qualif.',`+${algo.clinch.toFixed(0)}%`],
                ['Spread AMM',`${config.spread.toFixed(1)}%`],
                ['Cap. virtuel',`$${config.capital.toLocaleString('fr-CA')}`],
              ].map(([l, v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                  <span style={{ color:'var(--color-text-secondary)' }}>{l}</span>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
            <button onClick={() => updateAlgo({ ...DEFAULT_ALGO })}
              style={{ marginTop:12, padding:'5px 12px', borderRadius:6, border:'0.5px solid var(--color-border-secondary)', background:'none', cursor:'pointer', fontSize:12, color:'var(--color-text-primary)' }}>
              Réinitialiser aux valeurs par défaut
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
