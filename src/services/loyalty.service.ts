import { api } from "@/lib/api-client";
import type { Coupon } from "@/types/coupon.types";

export type LoyaltyStatus =
    | "IN_PROGRESS"
    | "READY"
    | "CLAIMED"
    | "NOT_CONFIGURED";

export interface LoyaltyConfig {
    targetPoints: number;
    rewardCouponId: string | null;
}

export interface LoyaltySummary {
    points: number;
    targetPoints: number;
    remaining: number;
    status: LoyaltyStatus;
    coupon?: Coupon | null;
}

export interface LoyaltyClaim {
    id: string;
    milestone: number;
    couponId: string;
    status: LoyaltyStatus;
    createdAt: string;
    updatedAt: string;
    coupon?: Coupon | null;
}

export interface LoyaltyStats {
    totalPoints: number;
    totalClaims: number;
    activeCustomers: number;
}

export interface LoyaltyAdminSummary {
    tenantId: string;
    name: string;
    slug: string;
    type: string;
    active: boolean;
    config: LoyaltyConfig;
    stats: LoyaltyStats;
    recentLedger: unknown[];
    recentClaims: unknown[];
}

export type LoyaltyTenantOverview = LoyaltyAdminSummary;

function tenantConfigEndpoint(tenantId: string): string {
    return `/loyalty/admin/tenants/${encodeURIComponent(tenantId)}/config`;
}

export const loyaltyService = {
    getMySummary(): Promise<LoyaltySummary> {
        return api.get<LoyaltySummary>("/loyalty/me");
    },

    claimReward(): Promise<LoyaltyClaim> {
        return api.post<LoyaltyClaim>("/loyalty/me/claim");
    },

    getAdminSummary(): Promise<LoyaltyAdminSummary> {
        return api.get<LoyaltyAdminSummary>("/loyalty/admin/summary");
    },

    getAdminConfig(): Promise<LoyaltyConfig> {
        return api.get<LoyaltyConfig>("/loyalty/admin/config");
    },

    updateAdminConfig(config: LoyaltyConfig): Promise<LoyaltyConfig> {
        return api.put<LoyaltyConfig>("/loyalty/admin/config", config);
    },

    getAdminTenants(): Promise<LoyaltyTenantOverview[]> {
        return api.get<LoyaltyTenantOverview[]>("/loyalty/admin/tenants");
    },

    getTenantConfig(tenantId: string): Promise<LoyaltyConfig> {
        return api.get<LoyaltyConfig>(tenantConfigEndpoint(tenantId));
    },

    updateTenantConfig(
        tenantId: string,
        config: LoyaltyConfig,
    ): Promise<LoyaltyConfig> {
        return api.put<LoyaltyConfig>(tenantConfigEndpoint(tenantId), config);
    },
};
