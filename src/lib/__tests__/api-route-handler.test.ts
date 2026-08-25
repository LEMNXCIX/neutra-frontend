import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const { mockBackendFetch, mockExtractToken } = vi.hoisted(() => ({
    mockBackendFetch: vi.fn(),
    mockExtractToken: vi.fn(),
}));

vi.mock('../backend-api', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../backend-api')>()),
    backendFetch: (...args: unknown[]) => mockBackendFetch(...args),
}));
vi.mock('../server-auth', () => ({
    extractTokenFromRequest: (req: unknown) => mockExtractToken(req),
}));

import {
    createGetHandler,
    createPostHandler,
    createPutHandler,
    createRouteHandler,
} from '@/lib/api-route-handler';

const OK = (data: unknown = { id: '1' }) => ({
    success: true,
    statusCode: 200,
    message: 'OK',
    data,
});

function makeReq(url: string, init?: RequestInit) {
    return new NextRequest(new Request(url, init) as never);
}

// NextResponse.json works in the node environment; unwrap for asserts
async function json(res: NextResponse) {
    return res.json();
}

beforeEach(() => {
    vi.clearAllMocks();
    mockBackendFetch.mockResolvedValue(OK());
    mockExtractToken.mockReturnValue('tok-123');
});

describe('createRouteHandler', () => {
    it('GET: forwards token and passes backend envelope through with 200', async () => {
        const handler = createGetHandler('/products');
        const res = await handler(
            makeReq('http://localhost/api/products?page=2'),
        );

        expect(mockBackendFetch).toHaveBeenCalledWith(
            expect.stringContaining('/products'),
            expect.objectContaining({ method: 'GET', token: 'tok-123' }),
        );
        expect(res.status).toBe(200);
        expect(await json(res)).toMatchObject({ success: true });
    });

    it('GET: appends query params to the endpoint by default', async () => {
        const handler = createGetHandler('/products');
        await handler(makeReq('http://localhost/api/products?page=2&limit=5'));

        expect(mockBackendFetch).toHaveBeenCalledWith(
            expect.stringContaining('/products?page=2&limit=5'),
            expect.anything(),
        );
    });

    it('GET: function resolvers receive request params', async () => {
        const handler = createGetHandler((_req, params) => `/items/${params?.id}`);
        await handler(makeReq('http://localhost/api/items/7'), {
            params: { id: '7' },
        } as never);

        expect(mockBackendFetch).toHaveBeenCalledWith(
            '/items/7',
            expect.anything(),
        );
    });

    it('POST: parses the body and returns 201 by default', async () => {
        const handler = createPostHandler('/products');
        const res = await handler(
            makeReq('http://localhost/api/products', {
                method: 'POST',
                body: JSON.stringify({ name: 'X' }),
            }),
        );

        expect(mockBackendFetch).toHaveBeenCalledWith(
            '/products',
            expect.objectContaining({
                method: 'POST',
                body: { name: 'X' },
            }),
        );
        expect(res.status).toBe(201);
    });

    it('PUT: propagates backend statusCode on failure', async () => {
        mockBackendFetch.mockResolvedValue({
            success: false,
            statusCode: 422,
            message: 'Invalid data',
        });
        const handler = createPutHandler('/products/1');
        const res = await handler(
            makeReq('http://localhost/api/products/1', {
                method: 'PUT',
                body: JSON.stringify({ price: -1 }),
            }),
        );

        expect(res.status).toBe(422);
        expect(await json(res)).toMatchObject({ success: false, message: 'Invalid data' });
    });

    it('returns 500 with traceId when the backend call throws', async () => {
        mockBackendFetch.mockRejectedValue(new Error('backend down'));
        const handler = createGetHandler('/products');
        const res = await handler(makeReq('http://localhost/api/products'));

        expect(res.status).toBe(500);
        const body = await json(res);
        expect(body.success).toBe(false);
        expect(body.message).toBe('backend down');
        expect(body.meta?.traceId ?? body.traceId).toBeDefined();
    });

    it('successStatus can be overridden via config', async () => {
        const handler = createRouteHandler({
            method: 'POST',
            endpoint: '/custom',
            successStatus: 204,
        });
        const res = await handler(
            makeReq('http://localhost/api/custom', {
                method: 'POST',
                body: '{}',
            }),
        );
        expect(res.status).toBe(204);
    });
});
