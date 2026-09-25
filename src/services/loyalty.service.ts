import { api } from "@/lib/api-client";
import type { Coupon, CouponType } from "@/types/coupon.types";

export type LoyaltyCampaignStatus =
    | "DRAFT"
    | "ACTIVE"
    | "ENDED"
    | "ARCHIVED";

export type LoyaltyCampaignSource = "BOOKING" | "STORE" | "ALL";
export type LoyaltyCampaignMetric = "COUNT" | "SPEND";
export type LoyaltyCustomerStatus =
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "READY"
    | "CLAIMED"
    | "EXPIRED";
export type LoyaltyCampaignLifecycleAction = "activate" | "end" | "archive";

export interface LoyaltyCampaignRewardDefinition {
    type: CouponType;
    value: number;
    description?: string | null;
    minPurchaseAmount?: number | null;
    maxDiscountAmount?: number | null;
    applicableProducts: string[];
    applicableCategories: string[];
    applicableServices: string[];
}

export interface CreateLoyaltyCampaignInput {
    name: string;
    description?: string | null;
    source: LoyaltyCampaignSource;
    metric: LoyaltyCampaignMetric;
    targetValue: string;
    startsAt: string;
    endsAt: string;
    claimUntil: string;
    reward: LoyaltyCampaignRewardDefinition;
    rewardValidDays: number;
    maxClaims?: number | null;
}

export type UpdateLoyaltyCampaignInput = Partial<CreateLoyaltyCampaignInput>;

export interface LoyaltyCampaign {
    id: string;
    tenantId: string;
    name: string;
    description?: string | null;
    source: LoyaltyCampaignSource;
    metric: LoyaltyCampaignMetric;
    targetValue: string;
    status: LoyaltyCampaignStatus;
    startsAt: string;
    endsAt: string;
    claimUntil: string;
    reward?: LoyaltyCampaignRewardDefinition;
    rewardValidDays?: number;
    maxClaims?: number | null;
    claimedCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface LoyaltyCampaignClaimMetadata {
    id: string;
    campaignId: string;
    couponId: string;
    status: "CLAIMED";
    createdAt: string;
    updatedAt: string;
}

export interface LoyaltyCampaignClaim extends LoyaltyCampaignClaimMetadata {
    coupon: Coupon;
}

export interface LoyaltyCustomerCampaignSummary {
    campaignId: string;
    name: string;
    source: LoyaltyCampaignSource;
    startsAt: string;
    endsAt: string;
    claimUntil: string;
    metric: LoyaltyCampaignMetric;
    progressValue: string;
    targetValue: string;
    remainingValue: string;
    lifecycleStatus: LoyaltyCampaignStatus;
    customerStatus: LoyaltyCustomerStatus;
    claim?: LoyaltyCampaignClaimMetadata;
    coupon?: Coupon;
}

export interface LoyaltyCampaignStats {
    campaignCount: number;
    activeCampaignCount: number;
    endedCampaignCount: number;
    archivedCampaignCount: number;
    totalClaims: number;
}

export interface LoyaltyTenantSummary {
    tenantId: string;
    name: string;
    slug: string;
    type: string;
    active: boolean;
    campaigns: LoyaltyCampaign[];
    stats: LoyaltyCampaignStats;
}

export type LoyaltyTenantOverview = LoyaltyTenantSummary;

function campaignEndpoint(
    campaignId: string,
    action?: LoyaltyCampaignLifecycleAction,
): string {
    const suffix = action ? `/${action}` : "";
    return `/loyalty/admin/campaigns/${encodeURIComponent(campaignId)}${suffix}`;
}

export const loyaltyService = {
    getMyCampaigns(): Promise<LoyaltyCustomerCampaignSummary[]> {
        return api.get<LoyaltyCustomerCampaignSummary[]>("/loyalty/me");
    },

    getMyCampaignSummary(
        campaignId: string,
    ): Promise<LoyaltyCustomerCampaignSummary> {
        return api.get<LoyaltyCustomerCampaignSummary>(
            `/loyalty/me/campaigns/${encodeURIComponent(campaignId)}`,
        );
    },

    claimReward(campaignId: string): Promise<LoyaltyCampaignClaim> {
        return api.post<LoyaltyCampaignClaim>(
            `/loyalty/me/campaigns/${encodeURIComponent(campaignId)}/claim`,
        );
    },

    getAdminSummary(): Promise<LoyaltyTenantSummary> {
        return api.get<LoyaltyTenantSummary>("/loyalty/admin/summary");
    },

    getAdminCampaigns(): Promise<LoyaltyCampaign[]> {
        return api.get<LoyaltyCampaign[]>("/loyalty/admin/campaigns");
    },

    getAdminCampaign(campaignId: string): Promise<LoyaltyCampaign> {
        return api.get<LoyaltyCampaign>(campaignEndpoint(campaignId));
    },

    createCampaign(campaign: CreateLoyaltyCampaignInput): Promise<LoyaltyCampaign> {
        return api.post<LoyaltyCampaign>("/loyalty/admin/campaigns", campaign);
    },

    updateCampaign(
        campaignId: string,
        campaign: UpdateLoyaltyCampaignInput,
    ): Promise<LoyaltyCampaign> {
        return api.patch<LoyaltyCampaign>(
            campaignEndpoint(campaignId),
            campaign,
        );
    },

    deleteCampaign(campaignId: string): Promise<null> {
        return api.delete<null>(campaignEndpoint(campaignId));
    },

    activateCampaign(campaignId: string): Promise<LoyaltyCampaign> {
        return api.post<LoyaltyCampaign>(
            campaignEndpoint(campaignId, "activate"),
        );
    },

    endCampaign(campaignId: string): Promise<LoyaltyCampaign> {
        return api.post<LoyaltyCampaign>(campaignEndpoint(campaignId, "end"));
    },

    archiveCampaign(campaignId: string): Promise<LoyaltyCampaign> {
        return api.post<LoyaltyCampaign>(
            campaignEndpoint(campaignId, "archive"),
        );
    },

    getAdminTenants(): Promise<LoyaltyTenantOverview[]> {
        return api.get<LoyaltyTenantOverview[]>("/loyalty/admin/tenants");
    },
};
