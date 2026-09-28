// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

// FeatureProvider uses `use(FeatureContext)` — test the hook through the
// provider with a minimal harness instead of a separate context mock.
const { useFeatures } = await import("@/hooks/useFeatures");

const mockGet = vi.fn();
vi.mock("@/services/tenant.service", () => ({
    tenantService: { getFeatures: (...args: unknown[]) => mockGet(...args) },
}));

const { cookieValues, cookieValue } = vi.hoisted(() => {
    const bag: Record<string, string | undefined> = {};
    return { cookieValues: bag, cookieValue: (name: string) => bag[name] };
});
vi.mock("js-cookie", () => ({
    default: { get: (name: string) => cookieValues[name] },
}));

import { render, renderHook, screen, waitFor } from "@testing-library/react";

import { FeatureProvider } from "@/providers/feature-provider";
// The real store is used on purpose. An earlier mock here hand-built a state
// object containing syncFromCookies, which the real store never returned, so
// every test passed while the real provider threw on mount. The mock hid the
// very regression it should have caught.
import { tenantStoreApi, useTenantStore } from "@/store/tenant-store";

const withTenantCookies = () => {
    cookieValues["tenant-id"] = "t1";
    cookieValues["tenant-slug"] = "default";
    cookieValues["module-type"] = "store";
};

function Harness() {
    const { isFeatureEnabled, isLoading, error, refreshFeatures } =
        useFeatures();
    return (
        <div>
            <span data-testid="coupons">
                {String(isFeatureEnabled("COUPONS"))}
            </span>
            <span data-testid="banners">
                {String(isFeatureEnabled("BANNERS"))}
            </span>
            <span data-testid="unknown">
                {String(isFeatureEnabled("NOPE"))}
            </span>
            <span data-testid="loading">{String(isLoading)}</span>
            <span data-testid="error">{error ?? ""}</span>
            <button type="button" onClick={() => void refreshFeatures()}>
                refresh
            </button>
        </div>
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    tenantStoreApi.reset();
    for (const key of Object.keys(cookieValues)) delete cookieValues[key];
});

describe("FeatureProvider / useFeatures", () => {
    it("syncs tenant cookies on mount", async () => {
        withTenantCookies();
        render(
            <FeatureProvider>
                <Harness />
            </FeatureProvider>,
        );
        // The real store starts empty, and the provider's mount effect must
        // repopulate it from the cookies the proxy set.
        await waitFor(() =>
            expect(tenantStoreApi.get().tenantId).toBe(
                cookieValue("tenant-id"),
            ),
        );
    });

    it("exposes syncFromCookies from the no-argument hook form", () => {
        // Regression: the hook used to return a bare snapshot, so every
        // `const { syncFromCookies } = useTenantStore()` call site got
        // undefined and threw on mount.
        const { result } = renderHook(() => useTenantStore());
        expect(typeof result.current.syncFromCookies).toBe("function");
    });

    it("disables everything when there is no tenant context", async () => {
        render(
            <FeatureProvider>
                <Harness />
            </FeatureProvider>,
        );
        await waitFor(() =>
            expect(screen.getByTestId("loading").textContent).toBe("false"),
        );
        expect(screen.getByTestId("coupons").textContent).toBe("false");
        expect(mockGet).not.toHaveBeenCalled();
    });

    it("fetches and exposes enabled features for the tenant", async () => {
        tenantStoreApi.set({ tenantId: "t1" });
        mockGet.mockResolvedValue({ COUPONS: true });

        render(
            <FeatureProvider>
                <Harness />
            </FeatureProvider>,
        );

        await waitFor(() =>
            expect(screen.getByTestId("coupons").textContent).toBe("true"),
        );
        expect(mockGet).toHaveBeenCalledWith("t1");
        expect(screen.getByTestId("banners").textContent).toBe("false");
        expect(screen.getByTestId("unknown").textContent).toBe("false");
    });

    it("exposes the error message when the fetch fails", async () => {
        tenantStoreApi.set({ tenantId: "t1" });
        mockGet.mockRejectedValue(new Error("network down"));

        render(
            <FeatureProvider>
                <Harness />
            </FeatureProvider>,
        );

        await waitFor(() =>
            expect(screen.getByTestId("error").textContent).toBe(
                "No pudimos cargar las funcionalidades.",
            ),
        );
        expect(screen.getByTestId("coupons").textContent).toBe("false");
    });
});
