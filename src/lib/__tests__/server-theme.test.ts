/**
 * The tenant theme has to reach every route, including the root not-found,
 * which renders inside the root layout only. That only works if the provider is
 * mounted once at the root and if applyTenantTheme stays a no-op when there is
 * no tenant palette.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetBySlug = vi.fn();
vi.mock('@/services/tenant.service', () => ({
    tenantService: { getBySlug: (...args: unknown[]) => mockGetBySlug(...args) },
}));

const mockHeaders = vi.fn();
vi.mock('next/headers', () => ({
    headers: () => mockHeaders(),
}));

import { getTenantBrandingFromHeaders, getTenantNameFromHeaders } from '@/lib/server-theme';

const header = (slug: string | null) => new Headers(slug ? { 'x-tenant-slug': slug } : {});

beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(header('default'));
    mockGetBySlug.mockResolvedValue({ name: 'Default Store', config: { branding: { primaryColor: '#7c3aed' } } });
});

describe('getTenantBrandingFromHeaders', () => {
    it('returns the branding of the tenant from the proxy header', async () => {
        await expect(getTenantBrandingFromHeaders()).resolves.toEqual({ primaryColor: '#7c3aed' });
        expect(mockGetBySlug).toHaveBeenCalledWith('default');
    });

    it('returns null when there is no tenant, e.g. superadmin', async () => {
        mockHeaders.mockResolvedValue(header(null));
        await expect(getTenantBrandingFromHeaders()).resolves.toBeNull();
        expect(mockGetBySlug).not.toHaveBeenCalled();
    });

    it('returns null when the tenant has no branding configured', async () => {
        mockGetBySlug.mockResolvedValue({ name: 'Sin marca', config: {} });
        await expect(getTenantBrandingFromHeaders()).resolves.toBeNull();
    });

    it('returns null instead of throwing when the backend fails', async () => {
        mockGetBySlug.mockRejectedValue(new Error('ECONNREFUSED'));
        await expect(getTenantBrandingFromHeaders()).resolves.toBeNull();
    });

    it('returns null instead of throwing when headers() fails', async () => {
        mockHeaders.mockRejectedValue(new Error('no request scope'));
        await expect(getTenantBrandingFromHeaders()).resolves.toBeNull();
    });
});

describe('getTenantNameFromHeaders', () => {
    it('returns the tenant display name', async () => {
        await expect(getTenantNameFromHeaders()).resolves.toBe('Default Store');
    });

    it('returns null when there is no tenant', async () => {
        mockHeaders.mockResolvedValue(header(null));
        await expect(getTenantNameFromHeaders()).resolves.toBeNull();
    });
});
