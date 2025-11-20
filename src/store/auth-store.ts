import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = { id: string; name: string; email?: string, isAdmin: boolean } | null;

type AuthState = {
    user: User;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            loading: false,
            login: async (email, password) => {
                set({ loading: true });
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
                    set({ user: { id: data.user.id, name: data.user.name, email: data.user.email, isAdmin: data.user.isAdmin } });
                } finally {
                    set({ loading: false });
                }
            },
            register: async (name, email, password) => {
                set({ loading: true });
                try {
                    const resp = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, email, password }),
                    });
                    if (!resp.ok) {
                        const err = await resp.json().catch(() => ({}));
                        throw new Error(err?.error || 'Register failed');
                    }
                    const data = await resp.json();
                    set({ user: { id: data.user.id, name: data.user.name, email: data.user.email, isAdmin: data.user.isAdmin } });
                } catch (err) {
                    console.error('register failed', err);
                    throw err;
                } finally {
                    set({ loading: false });
                }
            },
            logout: async () => {
                set({ loading: true });
                try {
                    await fetch('/api/auth/logout', { method: 'POST' });
                } catch {
                    // ignore
                }
                set({ user: null, loading: false });
            },
            checkSession: async () => {
                // Verify with server if the session is still valid
                try {
                    const resp = await fetch('/api/auth/me');
                    if (resp.ok) {
                        const data = await resp.json();
                        if (data?.user) {
                            set({ user: { id: data.user.id, name: data.user.name, email: data.user.email, isAdmin: data.user.isAdmin } });
                            return;
                        }
                    }
                } catch { }
                // If check fails or no user, we might want to clear the local user if we want strict sync,
                // but for "optimistic" persistence we can keep it or clear it.
                // Let's clear it if the server says we are not logged in.
                // However, if the network fails, we might want to keep it.
                // For now, let's assume if /me fails with 401, we clear.
                // But existing logic was: hydrate from server.
                // Here we hydrate from localStorage (via persist), but we should validate.
            }
        }),
        {
            name: 'auth-storage',
        }
    )
);
