"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

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
    // hydrate from localStorage
    try {
      const raw = localStorage.getItem("_neutra_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      if (user) localStorage.setItem("_neutra_user", JSON.stringify(user));
      else localStorage.removeItem("_neutra_user");
    } catch {
      // ignore
    }
  }, [user]);

  const login = async (email: string) => {
    setLoading(true);
    // demo: accept any email/password, create fake user
    await new Promise((r) => setTimeout(r, 400));
    const u = { id: String(Date.now()), name: email.split('@')[0], email };
    setUser(u);
    setLoading(false);
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
    await new Promise((r) => setTimeout(r, 150));
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
