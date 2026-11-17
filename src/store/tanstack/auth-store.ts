import { createStore, type Store } from "@tanstack/store";
import { ApiError } from "@/lib/api-client";
import { reportError } from "@/lib/error-reporting";
import { authService } from "@/services/auth.service";
import type { User as APIUser } from "@/types/frontend-api";

type User = {
    id: string;
    name: string;
    email?: string;
    isAdmin: boolean;
    roleName?: string;
    avatar?: string;
    roleId?: string;
} | null;

type AuthData = {
    user: User;
    loading: boolean;
    error: string | null;
};

type AuthActions = {
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
    updateUser: (
        userData: Partial<{
            name: string;
            email: string;
            avatar: string;
            isAdmin: boolean;
        }>,
    ) => void;
    clearError: () => void;
};

export type AuthState = AuthData & AuthActions;
export type AuthStore = Store<AuthData, AuthActions>;
export type { AuthActions, AuthData, User };

/** Same key zustand's `persist({ name })` used — existing browsers keep working. */
export const AUTH_STORAGE_KEY = "auth-storage";

/** zustand's persist middleware envelope, kept verbatim for read compatibility. */
type PersistedAuth = { state: { error: string | null }; version: number };

function getStorage(): Storage | null {
    try {
        return typeof localStorage === "undefined" ? null : localStorage;
    } catch {
        return null;
    }
}

function readPersistedError(): string | null {
    const storage = getStorage();
    if (!storage) return null;
    try {
        const raw = storage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<PersistedAuth>;
        const error = parsed?.state?.error;
        return typeof error === "string" ? error : null;
    } catch {
        return null;
    }
}

function persistError(error: string | null): void {
    const storage = getStorage();
    if (!storage) return;
    try {
        const payload: PersistedAuth = { state: { error }, version: 0 };
        storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
    } catch {
        // Storage can be unavailable (private mode / quota); persistence is best-effort.
    }
}

/** Convert backend User to store User */
function mapAPIUserToStoreUser(apiUser: APIUser): User {
    return {
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        isAdmin:
            apiUser.role?.name === "SUPER_ADMIN" ||
            apiUser.role?.name === "ADMIN" ||
            false,
        roleName: apiUser.role?.name,
        avatar: apiUser.profilePic || undefined,
        roleId: apiUser.roleId,
    };
}

/**
 * Factory so tests can exercise rehydration with a stubbed localStorage.
 * The singleton below is what the app consumes.
 */
export function createAuthStore(): AuthStore {
    const store = createStore<AuthData, AuthActions>(
        {
            user: null,
            loading: false,
            error: readPersistedError(),
        },
        ({ setState }) => {
            const set = (
                partial:
                    | Partial<AuthData>
                    | ((prev: AuthData) => Partial<AuthData>),
            ) =>
                setState((prev) => ({
                    ...prev,
                    ...(typeof partial === "function"
                        ? partial(prev)
                        : partial),
                }));

            return {
                login: async (email, password) => {
                    set({ loading: true, error: null });
                    try {
                        const apiUser = await authService.login({
                            email,
                            password,
                        });

                        const user = mapAPIUserToStoreUser(apiUser);

                        set({ user, loading: false });
                    } catch (err) {
                        set({
                            loading: false,
                            error: reportError(
                                err,
                                "No pudimos iniciar sesión. Intentá de nuevo.",
                            ),
                        });
                        throw err;
                    }
                },

                register: async (name, email, password) => {
                    set({ loading: true, error: null });
                    try {
                        const apiUser = await authService.signup({
                            name,
                            email,
                            password,
                        });
                        const user = mapAPIUserToStoreUser(apiUser);
                        set({ user, loading: false });
                    } catch (err) {
                        set({
                            loading: false,
                            error: reportError(
                                err,
                                "No pudimos crear tu cuenta. Intentá de nuevo.",
                            ),
                        });
                        throw err;
                    }
                },

                logout: async () => {
                    set({ loading: true, error: null });
                    try {
                        await authService.logout();
                    } catch (err) {
                        // Log but don't block logout on client
                        console.error("Logout API call failed:", err);
                    } finally {
                        set({ user: null, loading: false });
                    }
                },

                checkSession: async () => {
                    // Verify session with backend. authService.validate() sends
                    // x-suppress-unauthorized, so a 401 here does not dispatch the
                    // global `unauthorized` event that AuthInitializer listens for.
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
                            },
                        };
                    });
                },

                clearError: () => {
                    set({ error: null });
                },
            };
        },
    );

    // zustand's persist middleware wrote the partialized state on every set.
    // Only `error` is written: session data is spoofable and goes stale, so it
    // is restored from the HttpOnly cookie via checkSession() on boot.
    store.subscribe((state) => persistError(state.error));
    return store;
}

export const authStore = createAuthStore();
