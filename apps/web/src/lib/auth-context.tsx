'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type UserRole = 'ADMIN' | 'HOSPITAL' | 'DONOR' | 'VOLUNTEER';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: string;
  hospitalApproved?: boolean;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  registerDonor: (data: unknown) => Promise<AuthUser>;
  registerHospital: (data: unknown) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const AUTH_STORAGE_KEY = 'auth';

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    return Array.isArray(body.message) ? body.message.join(', ') : body.message || fallback;
  } catch {
    return fallback;
  }
}

export function dashboardPathFor(user: AuthUser): string {
  if (user.role === 'ADMIN') return '/admin/dashboard';
  if (user.role === 'HOSPITAL') return '/hospital/dashboard';
  if (user.role === 'DONOR') return '/donor/dashboard';
  return '/';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const saveAuth = useCallback((auth: AuthResponse) => {
    setAccessToken(auth.accessToken);
    setRefreshToken(auth.refreshToken);
    setUser(auth.user);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  }, []);

  useEffect(() => {
    async function restoreSession() {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) {
        setIsLoading(false);
        return;
      }

      try {
        const auth = JSON.parse(stored) as AuthResponse;
        setAccessToken(auth.accessToken);
        setRefreshToken(auth.refreshToken);

        const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${auth.accessToken}` }
        });

        if (meResponse.ok) {
          const currentUser = (await meResponse.json()) as AuthUser;
          saveAuth({ ...auth, user: currentUser });
          return;
        }

        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${auth.refreshToken}` }
        });

        if (!refreshResponse.ok) {
          clearAuth();
          return;
        }

        saveAuth((await refreshResponse.json()) as AuthResponse);
      } catch {
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    }

    void restoreSession();
  }, [clearAuth, saveAuth]);

  const authenticate = useCallback(
    async (path: string, body: unknown): Promise<AuthUser> => {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Authentication failed'));
      }

      const auth = (await response.json()) as AuthResponse;
      saveAuth(auth);
      return auth.user;
    },
    [saveAuth]
  );

  const login = useCallback(
    (email: string, password: string) => authenticate('/auth/login', { email, password }),
    [authenticate]
  );

  const registerDonor = useCallback(
    (data: unknown) => authenticate('/auth/register/donor', data),
    [authenticate]
  );

  const registerHospital = useCallback(
    (data: unknown) => authenticate('/auth/register/hospital', data),
    [authenticate]
  );

  const logout = useCallback(async () => {
    if (accessToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      } catch {
        // Local logout must still complete if the API is unavailable.
      }
    }
    clearAuth();
  }, [accessToken, clearAuth]);

  const refresh = useCallback(async () => {
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken}` }
    });

    if (!response.ok) {
      clearAuth();
      throw new Error('Token refresh failed');
    }

    saveAuth((await response.json()) as AuthResponse);
  }, [clearAuth, refreshToken, saveAuth]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated: Boolean(user && accessToken),
      login,
      registerDonor,
      registerHospital,
      logout,
      refresh
    }),
    [accessToken, isLoading, login, logout, refresh, registerDonor, registerHospital, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
