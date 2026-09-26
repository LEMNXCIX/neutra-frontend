// @vitest-environment happy-dom
/**
 * The tenant store reads cookies that the proxy sets in the response, so they
 * are never available on the server. The server snapshot must therefore stay
 * empty regardless of what the browser has, otherwise every component that
 * branches on tenantId during render mismatches: the server paints the
 * "no tenant" state and the client paints the loaded one.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

// vi.mock is hoisted above the const below, so the cookie bag has to be
// hoisted with it or the factory reads it before initialization.
const { cookieValues } = vi.hoisted(() => ({
    cookieValues: {} as Record<string, string | undefined>,
}));

vi.mock('js-cookie', () => ({
    default: {
        get: (name: string) => cookieValues[name],
    },
}));

const mockSyncExternalStore = vi.fn();
vi.mock('react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react')>();
    return { ...actual, useSyncExternalStore: (...args: unknown[]) => mockSyncExternalStore(...args) };
});

import { useTenantStore, tenantStoreApi } from '@/store/tenant-store';

const serverSnapshot = () => {
    const call = mockSyncExternalStore.mock.calls.at(-1);
    return (call?.[2] as () => Record<string, unknown>)();
};

beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(cookieValues).forEach((k) => delete cookieValues[k]);
});

afterEach(() => {
    tenantStoreApi.reset();
});

describe('tenant store server snapshot', () => {
    it('returns an empty tenant even when cookies exist', () => {
        cookieValues['tenant-id'] = 'tenant-uuid-1';
        cookieValues['tenant-slug'] = 'default';
        cookieValues['module-type'] = 'store';

        // Fresh import so the module initializer runs with the cookies present.
        void import('@/store/tenant-store');
        renderHook(() => useTenantStore());

        expect(serverSnapshot()).toEqual({
            tenantId: null,
            tenantSlug: null,
            moduleType: null,
        });
    });

    it('exposes the real client snapshot once hydrated', () => {
        cookieValues['tenant-id'] = 'tenant-uuid-1';
        cookieValues['tenant-slug'] = 'default';
        cookieValues['module-type'] = 'store';

        tenantStoreApi.syncFromCookies();

        expect(tenantStoreApi.get()).toEqual({
            tenantId: 'tenant-uuid-1',
            tenantSlug: 'default',
            moduleType: 'store',
        });
    });
});

describe('tenant store hydration-safety contract', () => {
    it('never returns a tenant from the server snapshot', () => {
        cookieValues['tenant-id'] = 'tenant-uuid-1';
        void import('@/store/tenant-store');
        renderHook(() => useTenantStore());

        // The whole point: a non-null tenantId here is what caused the
        // AppearanceClient mismatch between the Palette icon and the spinner.
        expect(serverSnapshot().tenantId).toBeNull();
    });
});
