// Minimal API helper for frontend
window.API_BASE = window.API_BASE || 'http://localhost:3001/v1/api';

function getToken() { return localStorage.getItem('ternapay_token') }
function setToken(t) { localStorage.setItem('ternapay_token', t) }
function getUser() { try { return JSON.parse(localStorage.getItem('ternapay_user')||'null') } catch(e){return null} }

async function apiFetch(path, opts = {}){
  const url = (path.startsWith('/')? window.API_BASE + path : path);
  const headers = opts.headers || {};
  headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const fetchOpts = Object.assign({}, opts, { headers });
  // Debug: log outgoing requests to help frontend troubleshooting (without sensitive headers)
  try {
    // eslint-disable-next-line no-console
    const safeOpts = { ...fetchOpts, headers: { 'Content-Type': fetchOpts.headers['Content-Type'] } };
    console.debug('[apiFetch] ', { url, method: fetchOpts.method || 'GET' });
  } catch (e) {}
  return fetch(url, fetchOpts);
}

// simple jwt decoder to access payload (no verification)
function decodeToken(token){
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];y
    const json = atob(payload.replace(/-/g,'+').replace(/_/g,'/'));
    return JSON.parse(json);
  } catch (e) { return null }
}

window.getToken = getToken;
window.setToken = setToken;
window.getUser = getUser;
window.apiFetch = apiFetch;
window.decodeToken = decodeToken;

