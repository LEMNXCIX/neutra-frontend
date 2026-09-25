// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const mocks = vi.hoisted(() => ({
    getAdminTenants: vi.fn(),
}));

vi.mock("@/services/loyalty.service", () => ({
    loyaltyService: {
        getAdminTenants: mocks.getAdminTenants,
    },
}));

import { SuperAdminLoyaltyClient } from "@/components/admin/loyalty/SuperAdminLoyaltyClient";

const campaign = {
    id: "campaign-1",
    tenantId: "tenant-enabled",
    name: "Campaña visible",
    description: "Detalle de campaña",
    source: "BOOKING" as const,
    metric: "COUNT" as const,
    targetValue: "5.00",
    status: "ACTIVE" as const,
    startsAt: "2030-01-01T00:00:00.000Z",
    endsAt: "2030-01-31T00:00:00.000Z",
    claimUntil: "2030-02-15T00:00:00.000Z",
    reward: {
        type: "PERCENT" as const,
        value: 10,
        description: null,
        minPurchaseAmount: null,
        maxDiscountAmount: null,
        applicableProducts: [],
        applicableCategories: [],
        applicableServices: [],
    },
    rewardValidDays: 30,
    maxClaims: 50,
    claimedCount: 12,
    createdAt: "2029-12-01T00:00:00.000Z",
    updatedAt: "2029-12-01T00:00:00.000Z",
};

const tenants = [
    {
        tenantId: "tenant-enabled",
        name: "Tenant enabled",
        slug: "enabled",
        type: "BOOKING",
        active: true,
        campaigns: [campaign],
        stats: {
            campaignCount: 1,
            activeCampaignCount: 1,
            endedCampaignCount: 0,
            archivedCampaignCount: 0,
            totalClaims: 12,
        },
    },
    {
        tenantId: "tenant-disabled",
        name: "Tenant with loyalty disabled",
        slug: "disabled",
        type: "STORE",
        active: false,
        campaigns: [],
        stats: {
            campaignCount: 0,
            activeCampaignCount: 0,
            endedCampaignCount: 0,
            archivedCampaignCount: 0,
            totalClaims: 0,
        },
    },
];

beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAdminTenants.mockResolvedValue(tenants);
});

describe("SuperAdminLoyaltyClient", () => {
    it("shows a read-only campaign overview for every tenant", async () => {
        render(<SuperAdminLoyaltyClient />);

        expect(
            await screen.findByRole("heading", { name: "Tenant enabled" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("heading", {
                name: "Tenant with loyalty disabled",
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: "Campaña visible" }),
        ).toBeInTheDocument();
        expect(screen.getByText(/5\.00 completados/)).toBeInTheDocument();
        expect(screen.getByText("12 reclamos")).toBeInTheDocument();
        expect(screen.getAllByText("Activa")).toHaveLength(2);
        expect(
            screen.getByText(
                "Esta organización no tiene campañas.",
            ),
        ).toBeInTheDocument();
    });

    it("does not expose tenant selection or campaign editing", async () => {
        render(<SuperAdminLoyaltyClient />);

        await screen.findByRole("heading", { name: "Tenant enabled" });
        expect(screen.queryByLabelText("Organización")).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: /guardar|activar|editar|eliminar/i }),
        ).not.toBeInTheDocument();
        expect(screen.queryByText(/configuración por organización/i)).not.toBeInTheDocument();
    });

    it("shows an error and retries the overview request", async () => {
        const user = userEvent.setup();
        mocks.getAdminTenants
            .mockRejectedValueOnce(new Error("network"))
            .mockResolvedValueOnce(tenants);

        render(<SuperAdminLoyaltyClient />);

        expect(
            await screen.findByText(
                "No pudimos cargar la información de fidelización.",
            ),
        ).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Reintentar" }));
        await waitFor(() =>
            expect(mocks.getAdminTenants).toHaveBeenCalledTimes(2),
        );
        expect(
            await screen.findByRole("heading", { name: "Tenant enabled" }),
        ).toBeInTheDocument();
    });
});
