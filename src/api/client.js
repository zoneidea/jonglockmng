const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jonglockapi.zonedevnode.com/management';
const SESSION_STORAGE_KEY = 'jonglock.management.session';
const SESSION_EXPIRED_EVENT = 'jonglock.session.expired';

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

function expireSession() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {}
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  if (window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
}

async function request(path, options = {}) {
  const token = options.token;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    Accept: 'application/json',
    ...(options.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? (isFormData ? options.body : JSON.stringify(options.body)) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401) expireSession();
    throw new ApiError(payload?.message || response.statusText || 'API request failed', response.status, payload);
  }

  return payload;
}

export { API_BASE_URL, ApiError, SESSION_EXPIRED_EVENT, expireSession, request };
