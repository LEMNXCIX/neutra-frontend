// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const mocks = vi.hoisted(() => ({
    getAdminTenants: vi.fn(),
    getTenantConfig: vi.fn(),
    updateTenantConfig: vi.fn(),
}));

vi.mock("@/services/loyalty.service", () => ({
    loyaltyService: {
        getAdminTenants: mocks.getAdminTenants,
        getTenantConfig: mocks.getTenantConfig,
        updateTenantConfig: mocks.updateTenantConfig,
    },
}));

import { SuperAdminLoyaltyClient } from "@/components/admin/loyalty/SuperAdminLoyaltyClient";

const tenants = [
    {
        tenantId: "tenant-enabled",
        name: "Tenant enabled",
        slug: "enabled",
        type: "BOOKING",
        active: true,
        config: { targetPoints: 100, rewardCouponId: "coupon-1" },
        stats: { totalPoints: 300, totalClaims: 3, activeCustomers: 2 },
        recentLedger: [],
        recentClaims: [],
    },
    {
        tenantId: "tenant-disabled",
        name: "Tenant with loyalty disabled",
        slug: "disabled",
        type: "BOOKING",
        active: true,
        features: { LOYALTY: false },
        config: { targetPoints: 0, rewardCouponId: "" },
        stats: { totalPoints: 0, totalClaims: 0, activeCustomers: 0 },
        recentLedger: [],
        recentClaims: [],
    },
];

beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAdminTenants.mockResolvedValue(tenants);
    mocks.getTenantConfig.mockResolvedValue({
        targetPoints: 100,
        rewardCouponId: "coupon-1",
    });
    mocks.updateTenantConfig.mockResolvedValue({
        targetPoints: 250,
        rewardCouponId: "coupon-2",
    });
});

describe("SuperAdminLoyaltyClient", () => {
    it("lists tenants with LOYALTY disabled and saves an explicitly selected tenant", async () => {
        const user = userEvent.setup();
        render(<SuperAdminLoyaltyClient />);

        expect(
            await screen.findByRole("heading", { name: "Tenant enabled" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: "Tenant with loyalty disabled" }),
        ).toBeInTheDocument();
        expect(mocks.getTenantConfig).not.toHaveBeenCalled();

        await user.selectOptions(
            screen.getByLabelText("Organización"),
            "tenant-enabled",
        );
        expect(await screen.findByDisplayValue("100")).toBeInTheDocument();
        expect(mocks.getTenantConfig).toHaveBeenCalledWith("tenant-enabled");

        const targetInput = screen.getByLabelText("Puntos objetivo");
        const couponInput = screen.getByLabelText("ID del cupón de recompensa");
        await user.clear(targetInput);
        await user.type(targetInput, "250");
        await user.clear(couponInput);
        await user.type(couponInput, "coupon-2");
        await user.click(
            screen.getByRole("button", { name: "Guardar configuración" }),
        );

        expect(mocks.updateTenantConfig).toHaveBeenCalledWith("tenant-enabled", {
            targetPoints: 250,
            rewardCouponId: "coupon-2",
        });
        expect(
            await screen.findByText("Configuración guardada correctamente."),
        ).toBeInTheDocument();
    });

    it("renders an unconfigured reward coupon as empty", async () => {
        const user = userEvent.setup();
        mocks.getTenantConfig.mockResolvedValueOnce({
            targetPoints: 10,
            rewardCouponId: null,
        });

        render(<SuperAdminLoyaltyClient />);
        expect(
            await screen.findByRole("heading", { name: "Tenant enabled" }),
        ).toBeInTheDocument();
        await user.selectOptions(
            screen.getByLabelText("Organización"),
            "tenant-enabled",
        );

        expect(
            await screen.findByLabelText("ID del cupón de recompensa"),
        ).toHaveValue("");
        expect(
            screen.getByRole("button", { name: "Guardar configuración" }),
        ).toBeDisabled();
    });
});
