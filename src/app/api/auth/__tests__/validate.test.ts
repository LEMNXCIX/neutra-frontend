import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/auth/validate/route';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/backend-api', () => ({
    backendGet: vi.fn(),
    ApiResponse: {} as any,
}));

vi.mock('@/lib/server-auth', () => ({
    extractTokenFromRequest: vi.fn(),
}));

vi.mock('@/lib/logger', () => {
    let idCounter = 0;
    return {
        logger: {
            createContext: () => ({ id: `ctx-${++idCounter}` }),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            withResponse: vi.fn(),
            withError: vi.fn(),
        },
    };
});

vi.mock('next/server', async () => {
    const actual = await vi.importActual<typeof import('next/server')>('next/server');
    return {
        ...actual,
        NextResponse: {
            json: vi.fn((body: any, init?: any) => ({
                status: init?.status || 200,
                body,
            })),
        },
    };
});

const mockBackendGet = (await import('@/lib/backend-api')).backendGet as any;
const mockExtractToken = (await import('@/lib/server-auth')).extractTokenFromRequest as any;

beforeEach(() => {
    vi.clearAllMocks();
});

function createMockRequest(headers: Record<string, string> = {}): NextRequest {
    return {
        headers: new Headers(headers),
        cookies: {},
    } as unknown as NextRequest;
}

describe('GET /api/auth/validate', () => {
    it('returns 401 when no token is found', async () => {
        mockExtractToken.mockReturnValueOnce(null);

        const req = createMockRequest();
        const response = await GET(req);

        expect(response.status).toBe(401);
        expect(NextResponse.json).toHaveBeenCalledWith(
            { success: false, message: 'No session token found' },
            { status: 401 }
        );
    });

    it('returns user data when validation succeeds', async () => {
        mockExtractToken.mockReturnValueOnce('valid-token');
        mockBackendGet.mockResolvedValueOnce({
            success: true,
            data: { user: { id: '1', name: 'Test User' } },
            statusCode: 200,
        });

        const req = createMockRequest({ authorization: 'Bearer valid-token' });
        const response = await GET(req);

        expect(response.status).toBe(200);
    });

    it('falls back to /auth/me when /auth/validate returns 404', async () => {
        mockExtractToken.mockReturnValueOnce('valid-token');
        mockBackendGet
            .mockResolvedValueOnce({
                success: false,
                statusCode: 404,
                data: null,
            })
            .mockResolvedValueOnce({
                success: true,
                data: { id: '1', name: 'User from /me' },
                statusCode: 200,
            });

        const req = createMockRequest({ authorization: 'Bearer valid-token' });
        const response = await GET(req);

        expect(response.status).toBe(200);
        expect(mockBackendGet).toHaveBeenCalledTimes(2);
        expect(mockBackendGet).toHaveBeenNthCalledWith(1, '/auth/validate', 'valid-token');
        expect(mockBackendGet).toHaveBeenNthCalledWith(2, '/auth/me', 'valid-token');
    });

    it('returns error when fallback /auth/me also fails', async () => {
        mockExtractToken.mockReturnValueOnce('valid-token');
        mockBackendGet
            .mockResolvedValueOnce({
                success: false,
                statusCode: 404,
                data: null,
            })
            .mockResolvedValueOnce({
                success: false,
                statusCode: 401,
                data: null,
                message: 'Invalid token',
            });

        const req = createMockRequest({ authorization: 'Bearer valid-token' });
        const response = await GET(req);

        expect(response.status).toBe(401);
    });

    it('returns error when backend throws an exception', async () => {
        mockExtractToken.mockReturnValueOnce('valid-token');
        mockBackendGet.mockRejectedValueOnce(new Error('Connection refused'));

        const req = createMockRequest({ authorization: 'Bearer valid-token' });
        const response = await GET(req);

        expect(response.status).toBe(500);
    });

    it('extracts token from request cookie header', async () => {
        mockExtractToken.mockReturnValueOnce('token-from-cookie');
        mockBackendGet.mockResolvedValueOnce({
            success: true,
            data: { user: { id: '1' } },
            statusCode: 200,
        });

        const req = createMockRequest({ cookie: 'token=token-from-cookie' });
        const response = await GET(req);

        expect(mockExtractToken).toHaveBeenCalledWith(req);
        expect(response.status).toBe(200);
    });
});