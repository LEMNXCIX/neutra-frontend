import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services';
import { ApiError } from '@/lib/api-client';
import { User as APIUser } from '@/types/frontend-api';

type User = {
    id: string;
    name: string;
    email?: string;
    isAdmin: boolean;
    avatar?: string;
    roleId?: string;
} | null;

type AuthState = {
    user: User;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
    updateUser: (userData: Partial<{ name: string; email: string; avatar: string; isAdmin: boolean }>) => void;
    clearError: () => void;
};

/**
 * Convert backend User to store User
 */
function mapAPIUserToStoreUser(apiUser: APIUser): User {
    return {
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        isAdmin: apiUser.role?.name === 'SUPER_ADMIN' || apiUser.role?.name === 'ADMIN' || false, // Check role name
        avatar: apiUser.profilePic || undefined,
        roleId: apiUser.roleId,
    };
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            loading: false,
            error: null,

            login: async (email, password) => {
                set({ loading: true, error: null });
                try {
                    const apiUser = await authService.login({ email, password });
                    console.log(apiUser);
                    const user = mapAPIUserToStoreUser(apiUser);
                    console.log(user);
                    set({ user, loading: false });
                } catch (err) {
                    const errorMessage = err instanceof ApiError
                        ? err.message
                        : 'Login failed. Please try again.';
                    set({ loading: false, error: errorMessage });
                    throw err;
                }
            },

            register: async (name, email, password) => {
                set({ loading: true, error: null });
                try {
                    const apiUser = await authService.signup({ name, email, password });
                    const user = mapAPIUserToStoreUser(apiUser);
                    set({ user, loading: false });
                } catch (err) {
                    const errorMessage = err instanceof ApiError
                        ? err.message
                        : 'Registration failed. Please try again.';
                    set({ loading: false, error: errorMessage });
                    throw err;
                }
            },

            logout: async () => {
                set({ loading: true, error: null });
                try {
                    await authService.logout();
                } catch (err) {
                    // Log but don't block logout on client
                    console.error('Logout API call failed:', err);
                } finally {
                    set({ user: null, loading: false });
                }
            },

            checkSession: async () => {
                // Verify session with backend
                try {
                    const response = await authService.validate();
                    if (response?.user) {
                        const user = mapAPIUserToStoreUser(response.user);
                        set({ user });
                        return;
                    }
                } catch (err) {
                    // If validation fails, clear the user
                    if (err instanceof ApiError && err.statusCode === 401) {
                        set({ user: null });
                    }
                    // For other errors, keep current state (could be network issue)
                }
            },

            updateUser: (userData) => {
                set((state) => {
                    if (!state.user) return state;
                    return {
                        user: {
                            ...state.user,
                            ...userData,
                        }
                    };
                });
            },

            clearError: () => {
                set({ error: null });
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);
