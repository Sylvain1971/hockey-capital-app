'use client';
import { DURATION_OPTIONS, DRAFT_MODES } from '../../lib/leagueApi';

const TEAM_COLORS = { MTL:'#AF1E2D',BOS:'#B8922A',TOR:'#00205B',TBL:'#002868',FLA:'#041E42',OTT:'#C52032',NYR:'#0038A8',CAR:'#CC0000',WSH:'#041E42',PIT:'#444',COL:'#6F263D',DAL:'#006847',WPG:'#041E42',MIN:'#154734',VGK:'#B4975A',EDM:'#FF4C00',VAN:'#00843D',LAK:'#333' };

const s = {
  card: { background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 },
  label: { fontSize:12, color:'var(--color-text-secondary)', display:'block', marginBottom:5, fontWeight:500 },
  input: { width:'100%', padding:'8px 10px', border:'0.5px solid var(--color-border-secondary)', borderRadius:8, background:'var(--color-background-primary)', color:'var(--color-text-primary)', fontSize:13, fontFamily:'var(--font-sans)' },
  slRow: { display:'flex', alignItems:'center', gap:10, marginBottom:10 },
  slLabel: { fontSize:12, color:'var(--color-text-secondary)', minWidth:180 },
  slVal: { fontSize:13, fontWeight:500, minWidth:80, textAlign:'right' },
  optGrid: { display:'grid', gap:8, marginBottom:14 },
  opt: (sel) => ({ border: sel ? '2px solid #c0392b' : '0.5px solid var(--color-border-tertiary)', borderRadius:10, padding:'10px 14px', cursor:'pointer', background: sel ? 'var(--color-background-secondary)' : 'var(--color-background-primary)' }),
  optTitle: { fontSize:13, fontWeight:500, marginBottom:3 },
  optDesc: { fontSize:11, color:'var(--color-text-secondary)', lineHeight:1.5 },
  badge: (color) => ({ display:'inline-block', padding:'2px 7px', borderRadius:5, fontSize:10, fontWeight:500, marginTop:6, background: color[0], color: color[1] }),
  finRow: { display:'flex', justifyContent:'space-between', fontSize:13, padding:'5px 0', borderBottom:'0.5px solid var(--color-border-tertiary)' },
  checkRow: { display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', fontSize:13, marginBottom:10 },
};

const BADGES = {
  weekend:  [['#f1eef8','#6c3483'],'Court'],
  week:     [['#eafaf1','#1e8449'],'Populaire'],
  month:    [['var(--color-background-secondary)','var(--color-text-secondary)'],'Moyen'],
  playoffs: [['#faeeda','#633806'],'Intense'],
  season:   [['#eeedfe','#3c3489'],'Ultime'],
  custom:   [['var(--color-background-secondary)','var(--color-text-secondary)'],'Flexible'],
  libre:    [['#eafaf1','#1e8449'],'Recommandé'],
  snake:    [['#eeedfe','#3c3489'],'Classique'],
  aveugle:  [['#faeeda','#633806'],'Surprise'],
};

export default function Step1League({ config, update, derived }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
      <div>
        <div style={s.card}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:14 }}>Informations de base</div>
          <div style={{ marginBottom:14 }}>
            <label style={s.label}>Nom de ta ligue</label>
            <input style={s.input} placeholder="ex: Pool du bureau 2025, Ligue des boys..." value={config.name} onChange={e => update({ name: e.target.value })} />
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={s.label}>Nombre de participants <span style={{ fontWeight:400 }}>(toi inclus)</span></label>
            <div style={s.slRow}>
              <input type="range" min={2} max={20} step={1} value={config.players} onChange={e => update({ players: parseInt(e.target.value) })} style={{ flex:1 }} />
              <span style={s.slVal}>{config.players} joueurs</span>
            </div>
          </div>
          <div>
            <label style={s.label}>Durée de la session</label>
            <div style={{ ...s.optGrid, gridTemplateColumns:'1fr 1fr' }}>
              {DURATION_OPTIONS.map(d => (
                <div key={d.id} style={s.opt(config.duration === d.id)} onClick={() => update({ duration: d.id })}>
                  <div style={s.optTitle}>{d.label}</div>
                  <div style={s.optDesc}>{d.desc}</div>
                  <span style={s.badge(BADGES[d.id][0])}>{BADGES[d.id][1]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={s.card}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:14 }}>Type de draft initial</div>
          <div style={{ ...s.optGrid, gridTemplateColumns:'repeat(3,1fr)', marginBottom:0 }}>
            {DRAFT_MODES.map(d => (
              <div key={d.id} style={s.opt(config.draft === d.id)} onClick={() => update({ draft: d.id })}>
                <div style={s.optTitle}>{d.label}</div>
                <div style={s.optDesc}>{d.desc}</div>
                <span style={s.badge(BADGES[d.id][0])}>{BADGES[d.id][1]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div style={s.card}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:14 }}>Capital &amp; mise</div>
          <div style={{ marginBottom:14 }}>
            <label style={s.label}>Mise réelle par joueur <span style={{ fontWeight:400 }}>(constitue la cagnotte)</span></label>
            <div style={s.slRow}>
              <input type="range" min={5} max={200} step={5} value={config.mise} onChange={e => update({ mise: parseInt(e.target.value) })} style={{ flex:1 }} />
              <span style={s.slVal}>{config.mise} $</span>
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={s.label}>Capital virtuel de départ <span style={{ fontWeight:400 }}>(même pour tous)</span></label>
            <div style={s.slRow}>
              <input type="range" min={10000} max={200000} step={5000} value={config.capital} onChange={e => update({ capital: parseInt(e.target.value) })} style={{ flex:1 }} />
              <span style={s.slVal}>{config.capital.toLocaleString('fr-CA')} $</span>
            </div>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:4 }}>
              Montant fictif pour acheter des actions à 5 $/action. La mise réelle constitue uniquement la cagnotte.
            </div>
          </div>
          <div style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:12 }}>
            <div style={s.finRow}><span style={{ color:'var(--color-text-secondary)' }}>{config.players} joueurs × {config.mise}$</span><strong>{derived.cagnotteBrute} $</strong></div>
            <div style={s.finRow}><span style={{ color:'var(--color-text-secondary)' }}>Frais plateforme (5%)</span><span style={{ color:'#c0392b' }}>-{derived.cagnotteFee} $</span></div>
            <div style={{ ...s.finRow, borderBottom:'none', paddingTop:8 }}><span style={{ fontWeight:500 }}>Cagnotte nette</span><strong style={{ color:'#27ae60' }}>{derived.cagnotteNette} $</strong></div>
            <div style={{ ...s.finRow, borderBottom:'none', paddingTop:6 }}><span style={{ color:'var(--color-text-secondary)' }}>Actions max / équipe / joueur</span><strong>{derived.maxActionsPerTeam.toLocaleString('fr-CA')} actions</strong></div>
          </div>
        </div>

        <div style={s.card}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:14 }}>Options sociales</div>
          {[
            { key:'chatEnabled',    label:'Chat de ligue',          desc:'Messagerie intégrée entre participants', def:true },
            { key:'pubPortfolio',   label:'Portefeuilles publics',  desc:'Tout le monde voit le portefeuille de tous', def:true },
            { key:'notifications',  label:'Notifications push',     desc:'Alerte à chaque résultat qui touche ton portefeuille', def:true },
            { key:'privateLeague',  label:'Ligue privée',           desc:'Invitation par code seulement', def:true },
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
    </div>
  );
}
