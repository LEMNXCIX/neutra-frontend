import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '@/services/auth.service';
import * as apiClientModule from '@/lib/api-client';

vi.mock('@/lib/api-client', () => {
    const mockPost = vi.fn();
    const mockGet = vi.fn();

    return {
        api: {
            post: mockPost,
            get: mockGet,
            put: vi.fn(),
            delete: vi.fn(),
            patch: vi.fn(),
        },
        apiClient: vi.fn(),
        ApiError: class extends Error {
            statusCode: number;
            errors?: unknown[];
            traceId?: string;
            constructor(message: string, statusCode: number, errors?: unknown[], traceId?: string) {
                super(message);
                this.statusCode = statusCode;
                this.errors = errors;
                this.traceId = traceId;
            }
        },
        apiFetch: vi.fn(),
    };
});

const mockApi = apiClientModule.api;

beforeEach(() => {
    vi.clearAllMocks();
});

describe('authService.login', () => {
    it('calls api.post with correct endpoint and credentials', async () => {
        const credentials = { email: 'user@test.com', password: 'password123' };
        const mockUser = { id: '1', name: 'Test User', email: 'user@test.com', roleId: 'r1' };

        (mockApi.post as any).mockResolvedValueOnce(mockUser);

        const result = await authService.login(credentials);

        expect(mockApi.post).toHaveBeenCalledWith('/auth/login', credentials);
        expect(result).toEqual(mockUser);
    });

    it('throws when login fails', async () => {
        const credentials = { email: 'bad@test.com', password: 'wrong' };

        (mockApi.post as any).mockRejectedValueOnce(new Error('Invalid credentials'));

        await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
    });
});

describe('authService.signup', () => {
    it('calls api.post with user data', async () => {
        const userData = { name: 'New User', email: 'new@test.com', password: 'pass' };
        const mockUser = { id: '2', name: 'New User', email: 'new@test.com', roleId: 'r1' };

        (mockApi.post as any).mockResolvedValueOnce(mockUser);

        const result = await authService.signup(userData);

        expect(mockApi.post).toHaveBeenCalledWith('/auth/register', userData);
        expect(result).toEqual(mockUser);
    });
});

describe('authService.logout', () => {
    it('calls api.post with empty body to /auth/logout', async () => {
        (mockApi.post as any).mockResolvedValueOnce(undefined);

        await authService.logout();

        expect(mockApi.post).toHaveBeenCalledWith('/auth/logout', {});
    });
});

describe('authService.validate', () => {
    it('calls api.get with suppress-unauthorized header', async () => {
        const mockResponse = { user: { id: '1', name: 'User', email: 'u@t.com', roleId: 'r1' } };

        (mockApi.get as any).mockResolvedValueOnce(mockResponse);

        const result = await authService.validate();

        expect(mockApi.get).toHaveBeenCalledWith('/auth/validate', {
            headers: { 'x-suppress-unauthorized': 'true' },
        });
        expect(result).toEqual(mockResponse);
    });

    it('throws when session is invalid', async () => {
        (mockApi.get as any).mockRejectedValueOnce(new Error('Unauthorized'));

        await expect(authService.validate()).rejects.toThrow('Unauthorized');
    });
});

describe('authService.getCurrentUser', () => {
    it('returns user when validate succeeds', async () => {
        const mockUser = { id: '1', name: 'User', email: 'u@t.com', roleId: 'r1' };
        (mockApi.get as any).mockResolvedValueOnce({ user: mockUser });

        const result = await authService.getCurrentUser();

        expect(result).toEqual(mockUser);
    });

    it('returns null when validate fails', async () => {
        (mockApi.get as any).mockRejectedValueOnce(new Error('Unauthorized'));

        const result = await authService.getCurrentUser();

        expect(result).toBeNull();
    });
});

describe('authService.forgotPassword', () => {
    it('calls api.post with email', async () => {
        (mockApi.post as any).mockResolvedValueOnce({ success: true });

        const result = await authService.forgotPassword('user@test.com');

        expect(mockApi.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'user@test.com' });
        expect(result).toEqual({ success: true });
    });
});

describe('authService.resetPassword', () => {
    it('calls api.post with reset data', async () => {
        const resetData = { token: 'reset-123', newPassword: 'newpass' };
        (mockApi.post as any).mockResolvedValueOnce({ success: true });

        const result = await authService.resetPassword(resetData);

        expect(mockApi.post).toHaveBeenCalledWith('/auth/reset-password', resetData);
        expect(result).toEqual({ success: true });
    });
});

describe('authService.googleLogin', () => {
    it('redirects to Google OAuth URL', () => {
        const mockAssign = vi.fn();
        vi.stubGlobal('window', { location: { href: '', assign: mockAssign } });
        vi.stubEnv('NEXT_PUBLIC_BASE_URL', '');

        Object.defineProperty(window.location, 'href', {
            writable: true,
            value: '',
        });

        authService.googleLogin();

        expect(window.location.href).toBe('http://localhost:4001/api/auth/google');
    });
});