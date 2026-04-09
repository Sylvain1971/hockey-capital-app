'use client';
/**
 * PlayoffBadge — badge de ronde + cadenas pour équipes figées
 * Usage: <PlayoffBadge team={t} />
 */

const ROUND_LABELS = { 1: 'R1', 2: 'R2', 3: 'CF', 4: 'SF' };
const ROUND_COLORS = { 1: '#1a5276', 2: '#6c3483', 3: '#7d6608', 4: '#922b21' };

export default function PlayoffBadge({ team, style = {} }) {
  if (!team) return null;

  const { playoff_status, playoff_round, playoff_locked } = team;
  const isActive      = playoff_status === 'active';
  const isEliminated  = playoff_status === 'eliminated';
  const isChampion    = playoff_status === 'champion';
  const isNotQual     = playoff_status === 'not_qualified';
  const isLocked      = playoff_locked || isEliminated || isChampion || isNotQual;

  if (!playoff_status || playoff_status === 'regular') return null;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, ...style }}>

      {/* Badge de ronde — équipes actives */}
      {isActive && playoff_round && (
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 6px',
          borderRadius: 4, background: ROUND_COLORS[playoff_round] || '#333',
          color: '#fff', letterSpacing: '0.05em',
        }}>
          {ROUND_LABELS[playoff_round] || `R${playoff_round}`}
        </span>
      )}

      {/* Badge champion */}
      {isChampion && (
        <span style={{ fontSize: 14 }} title="Champion Coupe Stanley">🏆</span>
      )}

      {/* Cadenas — équipes figées */}
      {isLocked && !isChampion && (
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 6px',
          borderRadius: 4,
          background: isEliminated ? '#922b21' : '#555',
          color: '#fff',
        }}>
          {isEliminated ? 'ÉLM' : 'N/Q'} 🔒
        </span>
      )}
    </div>
  );
}

/**
 * PlayoffStatusBar — barre de statut séries pour l'en-tête de ligue
 */
export function PlayoffStatusBar({ seasonConfig }) {
  if (!seasonConfig || seasonConfig.mode !== 'playoffs') return null;
  const round = seasonConfig.playoff_round;
  const ROUND_FULL = { 1: 'Ronde 1', 2: 'Ronde 2', 3: 'Finale de conférence', 4: '🏆 Finale Stanley' };

  return (
    <div style={{
      background: 'linear-gradient(90deg, #1a1a2e, #16213e)',
      color: '#fff', padding: '8px 20px',
      display: 'flex', alignItems: 'center', gap: 10,
      fontSize: 13, fontWeight: 600,
    }}>
      <span style={{ color: '#f1c40f' }}>⚡ SÉRIES EN COURS</span>
      <span style={{ opacity: 0.6 }}>·</span>
      <span>{ROUND_FULL[round] || `Ronde ${round}`}</span>
    </div>
  );
}
