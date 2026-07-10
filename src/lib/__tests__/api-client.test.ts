import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiError, api } from '@/lib/api-client';

const mockFetch = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.stubGlobal('fetch', mockFetch);
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:4001/api');
});

describe('apiClient', () => {
    it('makes a successful request and unwraps StandardResponse', async () => {
        const responseData = { id: '1', name: 'Test' };

        mockFetch.mockResolvedValueOnce({
            status: 200,
            json: () => Promise.resolve({
                success: true,
                statusCode: 200,
                message: 'OK',
                data: responseData,
                meta: { traceId: 'trace-1', timestamp: '2024-01-01' },
            }),
        });

        const result = await apiClient('/products/1');

        expect(result).toEqual(responseData);
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('includes credentials and JSON content type', async () => {
        mockFetch.mockResolvedValueOnce({
            status: 200,
            json: () => Promise.resolve({
                success: true,
                statusCode: 200,
                message: 'OK',
                data: {},
                meta: { traceId: 't', timestamp: '' },
            }),
        });

        await apiClient('/test');

        const [, config] = mockFetch.mock.calls[0];
        expect(config.credentials).toBe('include');
        expect(config.headers['Content-Type']).toBe('application/json');
    });

    it('returns null for 204 No Content', async () => {
        mockFetch.mockResolvedValueOnce({ status: 204 });

        const result = await apiClient<unknown>('/test');

        expect(result).toBeNull();
    });

    it('throws ApiError on unsuccessful response', async () => {
        mockFetch.mockResolvedValueOnce({
            status: 400,
            json: () => Promise.resolve({
                success: false,
                statusCode: 400,
                message: 'Validation error',
                errors: [{ code: 'INVALID', message: 'Invalid input' }],
                meta: { traceId: 'trace-2', timestamp: '' },
            }),
        });

        try {
            await apiClient('/test');
            throw new Error('Expected ApiError to be thrown');
        } catch (error) {
            expect(error).toBeInstanceOf(ApiError);
            const apiErr = error as ApiError;
            expect(apiErr.statusCode).toBe(400);
            expect(apiErr.message).toBe('Validation error');
        }
    });

    it('throws ApiError with statusCode and errors from backend', async () => {
        mockFetch.mockResolvedValueOnce({
            status: 500,
            json: () => Promise.resolve({
                success: false,
                statusCode: 500,
                message: 'Internal server error',
                errors: [{ code: 'ERR', message: 'DB error' }],
                meta: { traceId: 'abc', timestamp: '' },
            }),
        });

        try {
            await apiClient('/test');
            expect.fail('Should have thrown');
        } catch (error) {
            expect(error).toBeInstanceOf(ApiError);
            const apiError = error as ApiError;
            expect(apiError.statusCode).toBe(500);
            expect(apiError.message).toBe('Internal server error');
            expect(apiError.errors).toEqual([{ code: 'ERR', message: 'DB error' }]);
            expect(apiError.traceId).toBe('abc');
        }
    });

    it('handles 401 and dispatches unauthorized event on client-side', async () => {
        vi.stubEnv('NEXT_PUBLIC_API_URL', ''); // client-side uses /api
        vi.stubGlobal('window', {
            dispatchEvent: vi.fn(),
            location: { href: '' },
        });

        mockFetch.mockResolvedValueOnce({
            status: 401,
            json: () => Promise.resolve({
                success: false,
                statusCode: 401,
                message: 'Unauthorized',
                meta: { traceId: 't', timestamp: '' },
            }),
        });

        await expect(apiClient('/test')).rejects.toThrow(ApiError);

        expect((window as any).dispatchEvent).toHaveBeenCalled();
        const event = (window as any).dispatchEvent.mock.calls[0][0];
        expect(event.type).toBe('unauthorized');
    });

    it('suppresses unauthorized event when x-suppress-unauthorized header is set', async () => {
        vi.stubGlobal('window', {
            dispatchEvent: vi.fn(),
        });

        mockFetch.mockResolvedValueOnce({
            status: 401,
            json: () => Promise.resolve({
                success: false,
                statusCode: 401,
                message: 'Unauthorized',
                meta: { traceId: 't', timestamp: '' },
            }),
        });

        await expect(
            apiClient('/test', {
                headers: { 'x-suppress-unauthorized': 'true' },
            })
        ).rejects.toThrow(ApiError);

        expect((window as any).dispatchEvent).not.toHaveBeenCalled();
    });

    it('throws ApiError for network errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network failure'));

        try {
            await apiClient('/test');
            throw new Error('Expected ApiError to be thrown');
        } catch (error) {
            expect(error).toBeInstanceOf(ApiError);
            const apiErr = error as ApiError;
            expect(apiErr.statusCode).toBe(500);
            expect(apiErr.message).toBe('Network failure');
        }
    });

    it('passes custom headers to fetch', async () => {
        mockFetch.mockResolvedValueOnce({
            status: 200,
            json: () => Promise.resolve({
                success: true,
                statusCode: 200,
                message: 'OK',
                data: {},
                meta: { traceId: 't', timestamp: '' },
            }),
        });

        await apiClient('/test', {
            headers: { 'x-custom': 'custom-value' },
        });

        const [, config] = mockFetch.mock.calls[0];
        expect(config.headers['x-custom']).toBe('custom-value');
    });

    it('uses server-side base URL when not in browser', async () => {
        mockFetch.mockResolvedValueOnce({
            status: 200,
            json: () => Promise.resolve({
                success: true,
                statusCode: 200,
                message: 'OK',
                data: {},
                meta: { traceId: 't', timestamp: '' },
            }),
        });

        await apiClient('/test');

        const [url] = mockFetch.mock.calls[0];
        expect(url).toBe('http://localhost:4001/api/test');
    });
});

describe('api helper', () => {
    it('api.get sends GET request', async () => {
        mockFetch.mockResolvedValueOnce({
            status: 200,
            json: () => Promise.resolve({
                success: true, statusCode: 200, message: 'OK',
                data: [], meta: { traceId: 't', timestamp: '' },
            }),
        });

        await api.get('/test');

        const [, config] = mockFetch.mock.calls[0];
        expect(config.method).toBe('GET');
    });

    it('api.post sends POST with JSON body', async () => {
        mockFetch.mockResolvedValueOnce({
            status: 201,
            json: () => Promise.resolve({
                success: true, statusCode: 201, message: 'Created',
                data: {}, meta: { traceId: 't', timestamp: '' },
            }),
        });

        await api.post('/test', { key: 'value' });

        const [, config] = mockFetch.mock.calls[0];
        expect(config.method).toBe('POST');
        expect(config.body).toBe(JSON.stringify({ key: 'value' }));
    });

    it('api.put sends PUT request', async () => {
        mockFetch.mockResolvedValueOnce({
            status: 200,
            json: () => Promise.resolve({
                success: true, statusCode: 200, message: 'OK',
                data: {}, meta: { traceId: 't', timestamp: '' },
            }),
        });

        await api.put('/test', { key: 'updated' });

        const [, config] = mockFetch.mock.calls[0];
        expect(config.method).toBe('PUT');
    });

    it('api.delete sends DELETE request', async () => {
        mockFetch.mockResolvedValueOnce({
            status: 200,
            json: () => Promise.resolve({
                success: true, statusCode: 200, message: 'Deleted',
                data: {}, meta: { traceId: 't', timestamp: '' },
            }),
        });

        await api.delete('/test');

        const [, config] = mockFetch.mock.calls[0];
        expect(config.method).toBe('DELETE');
    });

    it('api.patch sends PATCH request', async () => {
        mockFetch.mockResolvedValueOnce({
            status: 200,
            json: () => Promise.resolve({
                success: true, statusCode: 200, message: 'Patched',
                data: {}, meta: { traceId: 't', timestamp: '' },
            }),
        });

        await api.patch('/test', { partial: true });

        const [, config] = mockFetch.mock.calls[0];
        expect(config.method).toBe('PATCH');
    });
});

describe('ApiError class', () => {
    it('creates with status code and message', () => {
        const error = new ApiError('Not Found', 404);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ApiError);
        expect(error.message).toBe('Not Found');
        expect(error.statusCode).toBe(404);
        expect(error.name).toBe('ApiError');
    });

    it('includes optional context fields', () => {
        const error = new ApiError('Bad Request', 400, ['err1'], 'trace-xyz', '/test', 'POST');

        expect(error.errors).toEqual(['err1']);
        expect(error.traceId).toBe('trace-xyz');
        expect(error.endpoint).toBe('/test');
        expect(error.method).toBe('POST');
    });

    it('toDetailedString formats full error info', () => {
        const error = new ApiError('Bad Request', 400, undefined, 'trace-abc', '/test', 'POST');

        const str = error.toDetailedString();
        expect(str).toContain('[400] Bad Request');
        expect(str).toContain('Endpoint: /test');
        expect(str).toContain('Method: POST');
        expect(str).toContain('TraceId: trace-abc');
    });

    it('toDetailedString works with minimal info', () => {
        const error = new ApiError('Server Error', 500);

        const str = error.toDetailedString();
        expect(str).toBe('[500] Server Error');
    });
});