import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { request, SESSION_EXPIRED_EVENT } from '../api/client.js';

const STORAGE_KEY = 'jonglock.management.session';
const AuthContext = createContext(null);

function readStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistSession(nextSession, rememberMe) {
  const serialized = JSON.stringify(nextSession);
  if (rememberMe) {
    localStorage.setItem(STORAGE_KEY, serialized);
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, serialized);
  localStorage.removeItem(STORAGE_KEY);
}

function removeStoredSession() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);

  useEffect(() => {
    function clearSession() {
      setSession(null);
    }

    function syncStorage(event) {
      if (event.key === STORAGE_KEY && !event.newValue) clearSession();
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, clearSession);
    window.addEventListener('storage', syncStorage);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, clearSession);
      window.removeEventListener('storage', syncStorage);
    };
  }, []);

  async function login(organizationCode, username, password, rememberMe = false) {
    const payload = await request('/auth/login', {
      method: 'POST',
      body: { organizationCode, username, password },
    });
    const nextSession = payload.data;
    persistSession(nextSession, rememberMe);
    setSession(nextSession);
    return nextSession;
  }

  function logout() {
    removeStoredSession();
    setSession(null);
  }

  const value = useMemo(
    () => ({
      token: session?.token || '',
      user: session?.user || null,
      isAuthenticated: Boolean(session?.token),
      login,
      logout,
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
