'use client';
/**
 * Hockey Capital — Client API
 * Toutes les communications avec le backend Express + Supabase
 */

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const WS_URL = API.replace(/^http/, 'ws') + '/ws';

// ---- Auth token (localStorage) ----
export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hc_token');
}
export function setToken(token) { localStorage.setItem('hc_token', token); }
export function clearToken() { localStorage.removeItem('hc_token'); }

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ---- Auth ----
export const auth = {
  register: (email, password, username) =>
    apiFetch('/api/auth/register', { method: 'POST', body: { email, password, username } }),

  login: async (email, password) => {
    const data = await apiFetch('/api/auth/login', { method: 'POST', body: { email, password } });
    setToken(data.token);
    return data;
  },

  logout: () => { clearToken(); return apiFetch('/api/auth/logout', { method: 'POST' }); },
};

// ---- Marché ----
export const market = {
  getTeams:     () => apiFetch('/api/market/teams'),
  getHistory:   (teamId) => apiFetch(`/api/market/team/${teamId}/history`),
  getOrderBook: (teamId) => apiFetch(`/api/market/orderbook/${teamId}`),
  getImpactLog: () => apiFetch('/api/market/impact-log'),
  getLeaderboard: () => apiFetch('/api/market/leaderboard'),
};

// ---- Ordres ----
export const orders = {
  place:   (params) => apiFetch('/api/orders/place', { method: 'POST', body: params }),
  cancel:  (id)    => apiFetch(`/api/orders/${id}`, { method: 'DELETE' }),
  mine:    ()      => apiFetch('/api/orders/mine'),
  history: ()      => apiFetch('/api/orders/history'),
};

// ---- Portfolio ----
export const portfolio = {
  get:       () => apiFetch('/api/portfolio'),
  dividends: () => apiFetch('/api/portfolio/dividends'),
};

// ---- Admin ----
export const admin = {
  fetchScores:   () => apiFetch('/api/admin/fetch-scores', { method: 'POST' }),
  fetchStandings:() => apiFetch('/api/admin/fetch-standings', { method: 'POST' }),
  eliminate:     (teamId) => apiFetch(`/api/admin/eliminate/${teamId}`, { method: 'POST' }),
  payDividend:   (body)   => apiFetch('/api/admin/dividend', { method: 'POST', body }),
};

// ---- WebSocket singleton ----
let ws = null;
const listeners = new Set();

export function connectWebSocket() {
  if (ws && ws.readyState === WebSocket.OPEN) return ws;

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('[WS] Connecté à Hockey Capital');
    notify({ type: 'WS_CONNECTED' });
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      notify(msg);
    } catch {}
  };

  ws.onclose = () => {
    console.log('[WS] Déconnecté — reconnexion dans 3s');
    notify({ type: 'WS_DISCONNECTED' });
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = () => ws.close();

  return ws;
}

export function subscribeWS(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(msg) {
  listeners.forEach(fn => fn(msg));
}
