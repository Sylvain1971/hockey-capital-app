'use client';
/**
 * Hockey Capital — API Ligues
 * Toutes les opérations sur les ligues et le wizard
 */

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hc_token');
}

async function apiFetch(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ---- Ligues ----
export const leagues = {
  create:  (cfg) => apiFetch('/api/leagues', { method: 'POST', body: cfg }),
  join:    (code) => apiFetch(`/api/leagues/join/${code}`, { method: 'POST' }),
  mine:    () => apiFetch('/api/leagues/mine'),
  get:     (id) => apiFetch(`/api/leagues/${id}`),
  start:   (id) => apiFetch(`/api/leagues/${id}/start`, { method: 'POST' }),
  leaderboard: (id) => apiFetch(`/api/leagues/${id}/leaderboard`),
};

// ---- Marché de ligue ----
export const leagueMarket = {
  prices:    (leagueId) => apiFetch(`/api/leagues/${leagueId}/market/prices`),
  orderbook: (leagueId, teamId) => apiFetch(`/api/leagues/${leagueId}/market/orderbook/${teamId}`),
  buy:       (leagueId, teamId, qty, orderType, limitPrice) =>
    apiFetch(`/api/leagues/${leagueId}/market/buy`, { method: 'POST', body: { teamId, qty, orderType, limitPrice } }),
  sell:      (leagueId, teamId, qty, orderType, limitPrice) =>
    apiFetch(`/api/leagues/${leagueId}/market/sell`, { method: 'POST', body: { teamId, qty, orderType, limitPrice } }),
  portfolio: (leagueId) => apiFetch(`/api/leagues/${leagueId}/portfolio`),
  trades:    (leagueId) => apiFetch(`/api/leagues/${leagueId}/trades`),
  dividends: (leagueId) => apiFetch(`/api/leagues/${leagueId}/dividends`),
  impactLog: (leagueId) => apiFetch(`/api/leagues/${leagueId}/impact-log`),
};

// ---- Valeurs par défaut de l'algorithme VERSION INITIALE ----
export const DEFAULT_ALGO = {
  winReg:   4.0,
  winOT:    2.0,
  shutout:  3.0,
  lossReg:  3.0,
  lossOT:   1.0,
  m3:       1.5,
  m5:       2.0,
  m7:       3.0,
  r1:       1.5,
  r23:      0.5,
  r9:       1.0,
  divBase:  0.08,
  clinch:   12.0,
  spread:   2.0,
  priceFloor: 0.50,
  emissionPrice: 5.00,
  sharesPerTeam: 10000,
  ammReservePct: 70,
};

// ---- Constantes ----
export const DURATION_OPTIONS = [
  { id: 'weekend',  label: 'Weekend',        desc: 'Ven. → Dim. — 3 jours',   days: 3  },
  { id: 'week',     label: 'Semaine LNH',    desc: 'Lun. → Dim. — 7 jours',   days: 7  },
  { id: 'month',    label: 'Un mois',        desc: 'Ex: janvier complet',       days: 30 },
  { id: 'playoffs', label: 'Playoffs LNH',   desc: 'Avr. → juin — ~2 mois',   days: 65 },
  { id: 'season',   label: 'Saison complète',desc: 'Oct. → juin — 8 mois',    days: 240},
];

export const PRIZE_MODES = [
  { id: 'winner', label: 'Gagnant tout',  desc: 'Le #1 empoche tout',              dist: [{ rank: 1, pct: 100 }] },
  { id: 'top3',   label: 'Top 3',         desc: '60% / 25% / 15%',                dist: [{ rank: 1, pct: 60 }, { rank: 2, pct: 25 }, { rank: 3, pct: 15 }] },
  { id: 'top50',  label: 'Top 50%',       desc: 'La moitié gagne quelque chose',   dist: null },
  { id: 'custom', label: 'Personnalisé',  desc: 'Tes propres pourcentages',        dist: null },
];

export const DRAFT_MODES = [
  { id: 'libre',   label: 'Marché libre',  desc: 'Chacun achète ce qu\'il veut dès l\'ouverture' },
  { id: 'snake',   label: 'Draft snake',   desc: 'Tour à tour — 3 équipes chacun' },
  { id: 'aveugle', label: 'À l\'aveugle',  desc: '3 équipes aléatoires au départ' },
];

export const DELAY_OPTIONS = [
  { id: 'none', label: 'Aucun',      desc: 'Trading libre en tout temps' },
  { id: '24h',  label: '24 heures',  desc: 'Un trade par action par jour' },
  { id: '48h',  label: '48 heures',  desc: 'Stratégie long terme forcée' },
];
