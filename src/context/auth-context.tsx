"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from '@/lib/api-fetch';

type User = { id: string; name: string; email?: string } | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // hydrate from server cookie only
    let mounted = true;
    (async () => {
      try {
        const resp = await apiFetch('/api/auth/me');
        if (!mounted) return;
        const data = await resp.json().catch(() => ({ user: null }));
        if (data?.user) setUser({ id: data.user.id, name: data.user.name, email: data.user.email });
      } catch {
        // ignore - no user
      }
    })();

    // auto logout handler on 401
    const onUnauth = () => {
      // clear client state
      setUser(null);
    };
    if (typeof window !== 'undefined') window.addEventListener('unauthorized', onUnauth as EventListener);
    return () => { mounted = false; if (typeof window !== 'undefined') window.removeEventListener('unauthorized', onUnauth as EventListener); };
  }, []);

  // no localStorage syncing — server session is authoritative

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.error || 'Login failed');
      }
      const data = await resp.json();
      // server sets httpOnly cookie; we keep a lightweight client copy for UI
      setUser({ id: data.user.id, name: data.user.name, email: data.user.email });
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const u = { id: String(Date.now()), name, email };
    setUser(u);
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
