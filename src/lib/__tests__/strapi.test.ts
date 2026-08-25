import { describe, expect, it, vi, beforeEach } from 'vitest';

// strapi.ts is server-only; neutralize the guard in tests
vi.mock('server-only', () => ({}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// env is read at module load; stub before importing
vi.stubEnv('STRAPI_URL', 'http://strapi.test');
vi.stubEnv('STRAPI_TOKEN', 'strapi-token');



// next/headers is only used to read the tenant header
vi.mock('next/headers', () => ({
    headers: async () => ({
        get: (name: string) => (name === 'x-tenant-id' ? 'tenant-1' : null),
    }),
}));

// STRAPI_URL is read at module load — stub before importing
const { getHomeContent, getCmsPage, strapiFindOneByTenant } = await import(
    '@/lib/strapi'
);

beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: 'entry-1', title: 'Home' }] }),
    });
});

describe('strapiFindOneByTenant', () => {
    it('returns null without tenantId (no query at all)', async () => {
        const result = await strapiFindOneByTenant('home-contents', null);
        expect(result).toBeNull();
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('fetches the published entry filtered by tenant', async () => {
        const result = await getHomeContent();

        expect(result).toEqual({ id: 'entry-1', title: 'Home' });
        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('http://strapi.test/api/home-contents');
        expect(url).toContain('status=published');
        expect(url).toContain(encodeURIComponent('tenant-1'));
        expect((init as { headers: Record<string, string> }).headers.Authorization).toBe(
            'Bearer strapi-token',
        );
    });

    it('returns null when Strapi responds with an error', async () => {
        mockFetch.mockResolvedValue({ ok: false });
        const result = await getCmsPage('faq-page');
        expect(result).toBeNull();
    });

    it('returns null when the network fails', async () => {
        mockFetch.mockRejectedValue(new Error('strapi down'));
        const result = await getCmsPage('about-page');
        expect(result).toBeNull();
    });
});
