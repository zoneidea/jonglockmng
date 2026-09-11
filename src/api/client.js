import { isMutation, mutationFeedback } from '../utils/mutationFeedback.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jonglockapi.zonedevnode.com/management';
const MARKET_DEEP_LINK_BASE_URL = import.meta.env.VITE_MARKET_DEEP_LINK_BASE_URL || 'https://jonglock.zonedevnode.com/market';
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
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {}
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  if (window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
}

async function performRequest(path, options = {}) {
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

async function request(path, options = {}) {
  const notify = isMutation(path, options);
  let payload;
  try {
    payload = await performRequest(path, options);
  } catch (error) {
    if (notify && error.status !== 401) {
      const { showAlert } = await import('../utils/alerts.js');
      await showAlert({ icon: 'error', title: 'ทำรายการไม่สำเร็จ', text: error.message || 'กรุณาลองใหม่' });
    }
    throw error;
  }
  if (notify) {
    const feedback = mutationFeedback(options, payload);
    if (feedback) {
      const { showAlert } = await import('../utils/alerts.js');
      await showAlert(feedback);
    }
  }
  return payload;
}

export { API_BASE_URL, ApiError, MARKET_DEEP_LINK_BASE_URL, SESSION_EXPIRED_EVENT, expireSession, request };
