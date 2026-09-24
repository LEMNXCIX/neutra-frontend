import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGet, mockPost, mockPut } = vi.hoisted(() => ({
    mockGet: vi.fn(),
    mockPost: vi.fn(),
    mockPut: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
    api: {
        get: mockGet,
        post: mockPost,
        put: mockPut,
    },
}));

import { loyaltyService } from "@/services/loyalty.service";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("loyaltyService endpoint mappings", () => {
    it("uses the customer endpoints", async () => {
        await loyaltyService.getMySummary();
        await loyaltyService.claimReward();

        expect(mockGet).toHaveBeenCalledWith("/loyalty/me");
        expect(mockPost).toHaveBeenCalledWith("/loyalty/me/claim");
    });

    it("uses the current-tenant admin endpoints", async () => {
        const config = { targetPoints: 100, rewardCouponId: "coupon-1" };

        await loyaltyService.getAdminSummary();
        await loyaltyService.getAdminConfig();
        await loyaltyService.updateAdminConfig(config);

        expect(mockGet).toHaveBeenNthCalledWith(1, "/loyalty/admin/summary");
        expect(mockGet).toHaveBeenNthCalledWith(2, "/loyalty/admin/config");
        expect(mockPut).toHaveBeenCalledWith("/loyalty/admin/config", config);
    });

    it("uses encoded tenant-specific config endpoints", async () => {
        const config = { targetPoints: 200, rewardCouponId: "coupon-2" };

        await loyaltyService.getAdminTenants();
        await loyaltyService.getTenantConfig("tenant/a");
        await loyaltyService.updateTenantConfig("tenant/a", config);

        expect(mockGet).toHaveBeenNthCalledWith(1, "/loyalty/admin/tenants");
        expect(mockGet).toHaveBeenNthCalledWith(
            2,
            "/loyalty/admin/tenants/tenant%2Fa/config",
        );
        expect(mockPut).toHaveBeenCalledWith(
            "/loyalty/admin/tenants/tenant%2Fa/config",
            config,
        );
    });
});
