import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGet, mockPost, mockPatch, mockDelete } = vi.hoisted(() => ({
    mockGet: vi.fn(),
    mockPost: vi.fn(),
    mockPatch: vi.fn(),
    mockDelete: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
    api: {
        get: mockGet,
        post: mockPost,
        patch: mockPatch,
        delete: mockDelete,
    },
}));

import {
    loyaltyService,
    type CreateLoyaltyCampaignInput,
} from "@/services/loyalty.service";
import { CouponType } from "@/types/coupon.types";

const campaign: CreateLoyaltyCampaignInput = {
    name: "Campaña de prueba",
    description: "Recompensa integrada",
    source: "BOOKING",
    metric: "COUNT",
    targetValue: "3.00",
    startsAt: "2030-01-01T00:00:00.000Z",
    endsAt: "2030-01-31T00:00:00.000Z",
    claimUntil: "2030-02-15T00:00:00.000Z",
    reward: {
        type: CouponType.PERCENT,
        value: 10,
        description: "10% de descuento",
        minPurchaseAmount: 20,
        maxDiscountAmount: 30,
        applicableProducts: [],
        applicableCategories: [],
        applicableServices: ["service-1"],
    },
    rewardValidDays: 30,
    maxClaims: 100,
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe("loyaltyService campaign mappings", () => {
    it("uses campaignId in customer list, summary, and claim requests", async () => {
        await loyaltyService.getMyCampaigns();
        await loyaltyService.getMyCampaignSummary("campaign/a");
        await loyaltyService.claimReward("campaign/a");

        expect(mockGet).toHaveBeenNthCalledWith(1, "/loyalty/me");
        expect(mockGet).toHaveBeenNthCalledWith(
            2,
            "/loyalty/me/campaigns/campaign%2Fa",
        );
        expect(mockPost).toHaveBeenCalledWith(
            "/loyalty/me/campaigns/campaign%2Fa/claim",
        );
    });

    it("uses current-tenant campaign CRUD and summary endpoints", async () => {
        await loyaltyService.getAdminSummary();
        await loyaltyService.getAdminCampaigns();
        await loyaltyService.getAdminCampaign("campaign/a");
        await loyaltyService.createCampaign(campaign);
        await loyaltyService.updateCampaign("campaign/a", campaign);
        await loyaltyService.deleteCampaign("campaign/a");

        expect(mockGet).toHaveBeenNthCalledWith(1, "/loyalty/admin/summary");
        expect(mockGet).toHaveBeenNthCalledWith(
            2,
            "/loyalty/admin/campaigns",
        );
        expect(mockGet).toHaveBeenNthCalledWith(
            3,
            "/loyalty/admin/campaigns/campaign%2Fa",
        );
        expect(mockPost).toHaveBeenCalledWith(
            "/loyalty/admin/campaigns",
            campaign,
        );
        expect(mockPatch).toHaveBeenCalledWith(
            "/loyalty/admin/campaigns/campaign%2Fa",
            campaign,
        );
        expect(mockDelete).toHaveBeenCalledWith(
            "/loyalty/admin/campaigns/campaign%2Fa",
        );
    });

    it("uses encoded lifecycle endpoints and the super-admin overview", async () => {
        await loyaltyService.activateCampaign("campaign/a");
        await loyaltyService.endCampaign("campaign/a");
        await loyaltyService.archiveCampaign("campaign/a");
        await loyaltyService.getAdminTenants();

        expect(mockPost).toHaveBeenNthCalledWith(
            1,
            "/loyalty/admin/campaigns/campaign%2Fa/activate",
        );
        expect(mockPost).toHaveBeenNthCalledWith(
            2,
            "/loyalty/admin/campaigns/campaign%2Fa/end",
        );
        expect(mockPost).toHaveBeenNthCalledWith(
            3,
            "/loyalty/admin/campaigns/campaign%2Fa/archive",
        );
        expect(mockGet).toHaveBeenCalledWith("/loyalty/admin/tenants");
    });

    it("does not map legacy loyalty config endpoints", async () => {
        await loyaltyService.getMyCampaigns();
        await loyaltyService.getAdminSummary();
        await loyaltyService.getAdminTenants();

        const endpoints = [
            ...mockGet.mock.calls,
            ...mockPost.mock.calls,
            ...mockPatch.mock.calls,
            ...mockDelete.mock.calls,
        ].map(([endpoint]) => endpoint);

        expect(endpoints).not.toContain("/loyalty/admin/config");
        expect(endpoints.some((endpoint: string) => endpoint.includes("/config"))).toBe(
            false,
        );
    });
});
