// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const mocks = vi.hoisted(() => ({
    featureEnabled: true,
    getAdminSummary: vi.fn(),
    getAdminConfig: vi.fn(),
    getCoupons: vi.fn(),
    updateAdminConfig: vi.fn(),
}));

vi.mock("@/hooks/useFeatures", () => ({
    useFeatures: () => ({
        isFeatureEnabled: (feature: string) =>
            feature === "LOYALTY" && mocks.featureEnabled,
    }),
}));

vi.mock("@/services/loyalty.service", () => ({
    loyaltyService: {
        getAdminSummary: mocks.getAdminSummary,
        getAdminConfig: mocks.getAdminConfig,
        updateAdminConfig: mocks.updateAdminConfig,
    },
}));

vi.mock("@/services/coupons.service", () => ({
    couponsService: {
        getAll: mocks.getCoupons,
    },
}));

import { TenantLoyaltyClient } from "@/components/admin/loyalty/TenantLoyaltyClient";

const couponOptions = [
    {
        id: "coupon-1",
        code: "REWARD-1",
        type: "PERCENT" as const,
        value: 10,
        usageCount: 0,
        active: true,
        expiresAt: "2099-01-01T00:00:00.000Z",
        applicableProducts: [],
        applicableCategories: [],
        applicableServices: [],
    },
    {
        id: "coupon-2",
        code: "REWARD-2",
        type: "FIXED" as const,
        value: 5,
        usageCount: 0,
        active: true,
        expiresAt: "2099-01-01T00:00:00.000Z",
        applicableProducts: [],
        applicableCategories: [],
        applicableServices: [],
    },
    {
        id: "expired-coupon",
        code: "EXPIRED",
        type: "FIXED" as const,
        value: 5,
        usageCount: 0,
        active: true,
        expiresAt: "2000-01-01T00:00:00.000Z",
        applicableProducts: [],
        applicableCategories: [],
        applicableServices: [],
    },
    {
        id: "personal-reward",
        code: "PERSONAL",
        type: "FIXED" as const,
        value: 5,
        usageCount: 0,
        active: true,
        expiresAt: "2099-01-01T00:00:00.000Z",
        ownerId: "user-1",
        isReward: true,
        applicableProducts: [],
        applicableCategories: [],
        applicableServices: [],
    },
];

const summary = {
    tenantId: "tenant-1",
    name: "Booking Demo",
    slug: "booking-demo",
    type: "BOOKING",
    active: true,
    config: { targetPoints: 100, rewardCouponId: "coupon-1" },
    stats: {
        totalPoints: 450,
        totalClaims: 4,
        activeCustomers: 3,
    },
    recentLedger: [],
    recentClaims: [],
};

beforeEach(() => {
    vi.clearAllMocks();
    mocks.featureEnabled = true;
    mocks.getAdminSummary.mockResolvedValue(summary);
    mocks.getAdminConfig.mockResolvedValue(summary.config);
    mocks.getCoupons.mockResolvedValue(couponOptions);
    mocks.updateAdminConfig.mockResolvedValue({
        targetPoints: 200,
        rewardCouponId: "coupon-2",
    });
});

describe("TenantLoyaltyClient", () => {
    it("does not request admin data when LOYALTY is disabled", () => {
        mocks.featureEnabled = false;

        render(<TenantLoyaltyClient />);

        expect(screen.queryByRole("heading", { name: "Fidelización" })).not.toBeInTheDocument();
        expect(mocks.getAdminSummary).not.toHaveBeenCalled();
        expect(mocks.getAdminConfig).not.toHaveBeenCalled();
    });

    it("loads summary/config and saves the reward settings", async () => {
        const user = userEvent.setup();
        render(<TenantLoyaltyClient />);

        expect(screen.getByRole("status")).toHaveTextContent(
            "Cargando la información de fidelización…",
        );
        expect(
            await screen.findByRole("heading", { name: "Fidelización" }),
        ).toBeInTheDocument();
        expect(screen.getByText("450")).toBeInTheDocument();
        expect(screen.getByText("4")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();

        const targetInput = screen.getByLabelText("Puntos objetivo");
        const couponSelect = screen.getByLabelText("ID del cupón de recompensa");
        expect(couponSelect).toHaveValue("coupon-1");
        expect(screen.getByRole("option", { name: /REWARD-2/ })).toBeInTheDocument();
        expect(screen.queryByRole("option", { name: /EXPIRED/ })).not.toBeInTheDocument();
        expect(screen.queryByRole("option", { name: /PERSONAL/ })).not.toBeInTheDocument();
        await user.clear(targetInput);
        await user.type(targetInput, "200");
        await user.selectOptions(couponSelect, "coupon-2");
        await user.click(
            screen.getByRole("button", { name: "Guardar configuración" }),
        );

        expect(mocks.updateAdminConfig).toHaveBeenCalledWith({
            targetPoints: 200,
            rewardCouponId: "coupon-2",
        });
        expect(
            await screen.findByText("Configuración guardada correctamente."),
        ).toBeInTheDocument();
    });

    it("shows a load error and retries", async () => {
        const user = userEvent.setup();
        mocks.getAdminSummary.mockRejectedValueOnce(new Error("network"));

        render(<TenantLoyaltyClient />);

        expect(
            await screen.findByText("No pudimos cargar la información de fidelización."),
        ).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Reintentar" }));
        await waitFor(() => expect(mocks.getAdminSummary).toHaveBeenCalledTimes(2));
        expect(
            await screen.findByRole("heading", { name: "Fidelización" }),
        ).toBeInTheDocument();
    });
});
