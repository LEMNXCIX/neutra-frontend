import { describe, it, expect, vi } from 'vitest';

const { createGetHandler, createPostHandler } = vi.hoisted(() => ({
    createGetHandler: vi.fn(() => async () => ({})),
    createPostHandler: vi.fn(),
}));

vi.mock('@/lib/api-route-handler', () => ({
    createGetHandler,
    createPostHandler,
}));

vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn(),
    },
}));

const { GET } = await import('@/app/api/products/route');

describe('products API route factory usage', () => {
    it('GET handler is created via createGetHandler with /products', () => {
        expect(createGetHandler).toHaveBeenCalledTimes(1);
        expect(createGetHandler).toHaveBeenCalledWith('/products');
    });

    it('GET is a callable function', () => {
        expect(typeof GET).toBe('function');
    });

    it('POST handler is created via createPostHandler with /products', () => {
        expect(createPostHandler).toHaveBeenCalledTimes(1);
        expect(createPostHandler).toHaveBeenCalledWith('/products');
    });
});