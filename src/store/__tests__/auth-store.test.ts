import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/auth.service", () => ({
    authService: {
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
        validate: vi.fn(),
    },
}));

import { ApiError } from "@/lib/api-client";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth-store";
import {
    AUTH_STORAGE_KEY,
    authStore,
    createAuthStore,
} from "@/store/tanstack/auth-store";

const mockAuth = authService as unknown as {
    login: ReturnType<typeof vi.fn>;
    signup: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    validate: ReturnType<typeof vi.fn>;
};

const apiUser = {
    id: "u1",
    name: "Leonardo",
    email: "a@b.com",
    roleId: "r1",
    role: { id: "r1", name: "ADMIN" },
    profilePic: "data:image/png;base64,x",
};

beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, loading: false, error: null });
});

describe("auth-store.login", () => {
    it("maps role to isAdmin", async () => {
        mockAuth.login.mockResolvedValue(apiUser);
        await useAuthStore.getState().login("a@b.com", "secret");
        const user = useAuthStore.getState().user;
        expect(user?.isAdmin).toBe(true);
        expect(user?.roleName).toBe("ADMIN");
        expect(useAuthStore.getState().loading).toBe(false);
    });

    it("regular roles are not admin", async () => {
        mockAuth.login.mockResolvedValue({
            ...apiUser,
            role: { id: "r9", name: "USER" },
        });
        await useAuthStore.getState().login("a@b.com", "secret");
        expect(useAuthStore.getState().user?.isAdmin).toBe(false);
    });

    it("sets error and rethrows on ApiError", async () => {
        mockAuth.login.mockRejectedValue(new ApiError("Bad credentials", 401));
        await expect(
            useAuthStore.getState().login("a@b.com", "x"),
        ).rejects.toThrow();
        expect(useAuthStore.getState().error).toBe(
            "No pudimos iniciar sesión. Intentá de nuevo.",
        );
    });
});

describe("auth-store.checkSession", () => {
    it("restores the user from a valid session", async () => {
        mockAuth.validate.mockResolvedValue({ user: apiUser });
        await useAuthStore.getState().checkSession();
        expect(useAuthStore.getState().user?.id).toBe("u1");
    });

    it("clears the user on 401", async () => {
        useAuthStore.setState({ user: { id: "u1", name: "A", isAdmin: true } });
        mockAuth.validate.mockRejectedValue(new ApiError("Expired", 401));
        await useAuthStore.getState().checkSession();
        expect(useAuthStore.getState().user).toBeNull();
    });

    it("keeps the user on network errors", async () => {
        useAuthStore.setState({ user: { id: "u1", name: "A", isAdmin: true } });
        mockAuth.validate.mockRejectedValue(new Error("network down"));
        await useAuthStore.getState().checkSession();
        expect(useAuthStore.getState().user?.id).toBe("u1");
    });
});

describe("auth-store.logout", () => {
    it("clears the user even if the API call fails", async () => {
        useAuthStore.setState({ user: { id: "u1", name: "A", isAdmin: true } });
        mockAuth.logout.mockRejectedValue(new Error("offline"));
        await useAuthStore.getState().logout();
        expect(useAuthStore.getState().user).toBeNull();
    });
});

describe("auth-store.updateUser", () => {
    it("merges partial data", () => {
        useAuthStore.setState({
            user: { id: "u1", name: "A", isAdmin: false },
        });
        useAuthStore.getState().updateUser({ name: "B" });
        expect(useAuthStore.getState().user?.name).toBe("B");
        expect(useAuthStore.getState().user?.id).toBe("u1");
    });
});

/**
 * The zustand store persisted through `persist({ name: "auth-storage",
 * partialize: s => ({ error: s.error }) })`. The TanStack rewrite must keep the
 * same key, the same on-disk shape (zustand's `{ state, version }` envelope)
 * and, critically, must never write the spoofable user/session to storage.
 */
describe("auth-store TanStack persistence", () => {
    const makeStorage = (initial: string | null = null) => ({
        getItem: vi.fn((_key: string) => initial),
        setItem: vi.fn((_key: string, _value: string) => undefined),
        removeItem: vi.fn((_key: string) => undefined),
        clear: vi.fn(() => undefined),
        key: vi.fn((_index: number) => null),
        length: 0,
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("persists only the error field under the auth-storage key", () => {
        const storage = makeStorage();
        vi.stubGlobal("localStorage", storage);

        const store = createAuthStore();
        store.setState((prev) => ({
            ...prev,
            user: { id: "u1", name: "A", isAdmin: true },
            error: "boom",
        }));

        expect(storage.setItem).toHaveBeenCalled();
        const [key, value] = storage.setItem.mock.calls.at(-1) as [
            string,
            string,
        ];
        expect(key).toBe(AUTH_STORAGE_KEY);
        expect(JSON.parse(value)).toEqual({
            state: { error: "boom" },
            version: 0,
        });
        expect(value).not.toContain("u1");
    });

    it("rehydrates error on creation but never restores a persisted user", () => {
        const storage = makeStorage(
            JSON.stringify({
                state: { error: "persisted", user: { id: "spoofed" } },
                version: 0,
            }),
        );
        vi.stubGlobal("localStorage", storage);

        const store = createAuthStore();
        expect(store.get().error).toBe("persisted");
        expect(store.get().user).toBeNull();
    });

    it("exposes actions through the TanStack store API", () => {
        expect(typeof authStore.actions.login).toBe("function");
        expect(typeof authStore.actions.checkSession).toBe("function");
        expect(typeof authStore.actions.logout).toBe("function");
        expect(authStore.get().user).toBeNull();
    });
});
