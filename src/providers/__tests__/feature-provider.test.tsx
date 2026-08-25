// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach } from 'vitest';

// FeatureProvider uses `use(FeatureContext)` — test the hook through the
// provider with a minimal harness instead of a separate context mock.
const { useFeatures } = await import('@/hooks/useFeatures');

const mockGet = vi.fn();
vi.mock('@/services/tenant.service', () => ({
    tenantService: { getFeatures: (...args: unknown[]) => mockGet(...args) },
}));

const mockSyncFromCookies = vi.fn();
const tenantState = { tenantId: null as string | null, syncFromCookies: mockSyncFromCookies };
vi.mock('@/store/tenant-store', () => ({
    useTenantStore: Object.assign(
        (selector?: (s: typeof tenantState) => unknown) =>
            selector ? selector(tenantState) : tenantState,
        { getState: () => tenantState },
    ),
}));

import { FeatureProvider } from '@/providers/feature-provider';
import { render, screen, waitFor } from '@testing-library/react';

function Harness() {
    const { isFeatureEnabled, isLoading, error, refreshFeatures } = useFeatures();
    return (
        <div>
            <span data-testid="coupons">{String(isFeatureEnabled('COUPONS'))}</span>
            <span data-testid="banners">{String(isFeatureEnabled('BANNERS'))}</span>
            <span data-testid="unknown">{String(isFeatureEnabled('NOPE'))}</span>
            <span data-testid="loading">{String(isLoading)}</span>
            <span data-testid="error">{error ?? ''}</span>
            <button onClick={() => void refreshFeatures()}>refresh</button>
        </div>
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    tenantState.tenantId = null;
});

describe('FeatureProvider / useFeatures', () => {
    it('syncs tenant cookies on mount', async () => {
        render(
            <FeatureProvider>
                <Harness />
            </FeatureProvider>,
        );
        await waitFor(() => expect(mockSyncFromCookies).toHaveBeenCalled());
    });

    it('disables everything when there is no tenant context', async () => {
        render(
            <FeatureProvider>
                <Harness />
            </FeatureProvider>,
        );
        await waitFor(() =>
            expect(screen.getByTestId('loading').textContent).toBe('false'),
        );
        expect(screen.getByTestId('coupons').textContent).toBe('false');
        expect(mockGet).not.toHaveBeenCalled();
    });

    it('fetches and exposes enabled features for the tenant', async () => {
        tenantState.tenantId = 't1';
        mockGet.mockResolvedValue({ COUPONS: true });

        render(
            <FeatureProvider>
                <Harness />
            </FeatureProvider>,
        );

        await waitFor(() =>
            expect(screen.getByTestId('coupons').textContent).toBe('true'),
        );
        expect(mockGet).toHaveBeenCalledWith('t1');
        expect(screen.getByTestId('banners').textContent).toBe('false');
        expect(screen.getByTestId('unknown').textContent).toBe('false');
    });

    it('exposes the error message when the fetch fails', async () => {
        tenantState.tenantId = 't1';
        mockGet.mockRejectedValue(new Error('network down'));

        render(
            <FeatureProvider>
                <Harness />
            </FeatureProvider>,
        );

        await waitFor(() =>
            expect(screen.getByTestId('error').textContent).toBe(
                'network down',
            ),
        );
        expect(screen.getByTestId('coupons').textContent).toBe('false');
    });
});
