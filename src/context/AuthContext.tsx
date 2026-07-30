import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AuthContextValue, UserProfile } from '../types';

const STORAGE_KEY = 'office-attendance:session';

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredSession(): { idToken: string; user: UserProfile } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = loadStoredSession();
  const [user, setUser] = useState<UserProfile | null>(stored?.user ?? null);
  const [idToken, setIdToken] = useState<string | null>(stored?.idToken ?? null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const login = (token: string, profile: UserProfile) => {
    setIdToken(token);
    setUser(profile);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ idToken: token, user: profile }));
    setIsAuthenticating(false);
  };

  const logout = () => {
    setIdToken(null);
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, idToken, isAuthenticating, login, logout }),
    [user, idToken, isAuthenticating]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
