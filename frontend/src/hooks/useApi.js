const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: getHeaders(),
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export function apiGet(path) {
  return api(path);
}

export function apiPost(path, body) {
  return api(path, { method: 'POST', body: JSON.stringify(body) });
}

export function apiPut(path, body) {
  return api(path, { method: 'PUT', body: JSON.stringify(body) });
}

export function apiDelete(path) {
  return api(path, { method: 'DELETE' });
}
