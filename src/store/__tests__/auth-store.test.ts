import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/services/auth.service', () => ({
    authService: {
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
        validate: vi.fn(),
    },
}));

import { useAuthStore } from '@/store/auth-store';
import { authService } from '@/services/auth.service';
import { ApiError } from '@/lib/api-client';

const mockAuth = authService as unknown as {
    login: ReturnType<typeof vi.fn>;
    signup: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    validate: ReturnType<typeof vi.fn>;
};

const apiUser = {
    id: 'u1',
    name: 'Leonardo',
    email: 'a@b.com',
    roleId: 'r1',
    role: { id: 'r1', name: 'ADMIN' },
    profilePic: 'data:image/png;base64,x',
};

beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, loading: false, error: null });
});

describe('auth-store.login', () => {
    it('maps role to isAdmin', async () => {
        mockAuth.login.mockResolvedValue(apiUser);
        await useAuthStore.getState().login('a@b.com', 'secret');
        const user = useAuthStore.getState().user;
        expect(user?.isAdmin).toBe(true);
        expect(user?.roleName).toBe('ADMIN');
        expect(useAuthStore.getState().loading).toBe(false);
    });

    it('regular roles are not admin', async () => {
        mockAuth.login.mockResolvedValue({ ...apiUser, role: { id: 'r9', name: 'USER' } });
        await useAuthStore.getState().login('a@b.com', 'secret');
        expect(useAuthStore.getState().user?.isAdmin).toBe(false);
    });

    it('sets error and rethrows on ApiError', async () => {
        mockAuth.login.mockRejectedValue(new ApiError('Bad credentials', 401));
        await expect(useAuthStore.getState().login('a@b.com', 'x')).rejects.toThrow();
        expect(useAuthStore.getState().error).toBe('Bad credentials');
    });
});

describe('auth-store.checkSession', () => {
    it('restores the user from a valid session', async () => {
        mockAuth.validate.mockResolvedValue({ user: apiUser });
        await useAuthStore.getState().checkSession();
        expect(useAuthStore.getState().user?.id).toBe('u1');
    });

    it('clears the user on 401', async () => {
        useAuthStore.setState({ user: { id: 'u1', name: 'A', isAdmin: true } });
        mockAuth.validate.mockRejectedValue(new ApiError('Expired', 401));
        await useAuthStore.getState().checkSession();
        expect(useAuthStore.getState().user).toBeNull();
    });

    it('keeps the user on network errors', async () => {
        useAuthStore.setState({ user: { id: 'u1', name: 'A', isAdmin: true } });
        mockAuth.validate.mockRejectedValue(new Error('network down'));
        await useAuthStore.getState().checkSession();
        expect(useAuthStore.getState().user?.id).toBe('u1');
    });
});

describe('auth-store.logout', () => {
    it('clears the user even if the API call fails', async () => {
        useAuthStore.setState({ user: { id: 'u1', name: 'A', isAdmin: true } });
        mockAuth.logout.mockRejectedValue(new Error('offline'));
        await useAuthStore.getState().logout();
        expect(useAuthStore.getState().user).toBeNull();
    });
});

describe('auth-store.updateUser', () => {
    it('merges partial data', () => {
        useAuthStore.setState({ user: { id: 'u1', name: 'A', isAdmin: false } });
        useAuthStore.getState().updateUser({ name: 'B' });
        expect(useAuthStore.getState().user?.name).toBe('B');
        expect(useAuthStore.getState().user?.id).toBe('u1');
    });
});
