// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const mocks = vi.hoisted(() => ({
    enabledFeatures: new Set(["LOYALTY", "COUPONS"]),
    getAdminSummary: vi.fn(),
    getAdminCampaigns: vi.fn(),
    createCampaign: vi.fn(),
    updateCampaign: vi.fn(),
    activateCampaign: vi.fn(),
    endCampaign: vi.fn(),
    archiveCampaign: vi.fn(),
    deleteCampaign: vi.fn(),
}));

vi.mock("@/hooks/useFeatures", () => ({
    useFeatures: () => ({
        isFeatureEnabled: (feature: string) =>
            mocks.enabledFeatures.has(feature),
    }),
}));

vi.mock("@/services/loyalty.service", () => ({
    loyaltyService: {
        getAdminSummary: mocks.getAdminSummary,
        getAdminCampaigns: mocks.getAdminCampaigns,
        createCampaign: mocks.createCampaign,
        updateCampaign: mocks.updateCampaign,
        activateCampaign: mocks.activateCampaign,
        endCampaign: mocks.endCampaign,
        archiveCampaign: mocks.archiveCampaign,
        deleteCampaign: mocks.deleteCampaign,
    },
}));

import { TenantLoyaltyClient } from "@/components/admin/loyalty/TenantLoyaltyClient";

const MAX_INT = 2_147_483_647;

const draftCampaign = {
    id: "draft-1",
    tenantId: "tenant-1",
    name: "Borrador de prueba",
    description: "Campaña editable",
    source: "BOOKING" as const,
    metric: "COUNT" as const,
    targetValue: "3.00",
    status: "DRAFT" as const,
    startsAt: "2030-01-01T00:00:00.000Z",
    endsAt: "2030-01-31T00:00:00.000Z",
    claimUntil: "2030-02-15T00:00:00.000Z",
    reward: {
        type: "PERCENT" as const,
        value: 10,
        description: "Diez por ciento",
        minPurchaseAmount: 20,
        maxDiscountAmount: 30,
        applicableProducts: ["product-1"],
        applicableCategories: ["category-1"],
        applicableServices: ["service-1"],
    },
    rewardValidDays: 30,
    maxClaims: 100,
    claimedCount: 0,
    createdAt: "2029-12-01T00:00:00.000Z",
    updatedAt: "2029-12-01T00:00:00.000Z",
};

const activeCampaign = {
    ...draftCampaign,
    id: "active-1",
    name: "Campaña activa",
    status: "ACTIVE" as const,
    claimedCount: 4,
};

const endedCampaign = {
    ...draftCampaign,
    id: "ended-1",
    name: "Campaña finalizada",
    status: "ENDED" as const,
    claimedCount: 8,
};

const archivedCampaign = {
    ...draftCampaign,
    id: "archived-1",
    name: "Campaña archivada",
    status: "ARCHIVED" as const,
    claimedCount: 12,
};

const campaigns = [
    draftCampaign,
    activeCampaign,
    endedCampaign,
    archivedCampaign,
];

const summary = {
    tenantId: "tenant-1",
    name: "Booking Demo",
    slug: "booking-demo",
    type: "BOOKING",
    active: true,
    campaigns,
    stats: {
        campaignCount: 4,
        activeCampaignCount: 1,
        endedCampaignCount: 1,
        archivedCampaignCount: 1,
        totalClaims: 24,
    },
};

beforeEach(() => {
    vi.clearAllMocks();
    mocks.enabledFeatures = new Set(["LOYALTY", "COUPONS"]);
    mocks.getAdminSummary.mockResolvedValue(summary);
    mocks.getAdminCampaigns.mockResolvedValue(campaigns);
    mocks.createCampaign.mockResolvedValue(draftCampaign);
    mocks.updateCampaign.mockResolvedValue({
        ...draftCampaign,
        name: "Borrador actualizado",
    });
    mocks.activateCampaign.mockResolvedValue(activeCampaign);
    mocks.endCampaign.mockResolvedValue(endedCampaign);
    mocks.archiveCampaign.mockResolvedValue(archivedCampaign);
    mocks.deleteCampaign.mockResolvedValue(null);
});

describe("TenantLoyaltyClient", () => {
    it("does not request admin campaigns when required features are disabled", () => {
        mocks.enabledFeatures = new Set();

        render(<TenantLoyaltyClient />);

        expect(
            screen.queryByRole("heading", { name: "Fidelización" }),
        ).not.toBeInTheDocument();
        expect(mocks.getAdminSummary).not.toHaveBeenCalled();
        expect(mocks.getAdminCampaigns).not.toHaveBeenCalled();
    });

    it("shows campaign statuses and lifecycle actions without coupon configuration", async () => {
        render(<TenantLoyaltyClient />);

        expect(screen.getByRole("status")).toHaveTextContent(
            "Cargando las campañas…",
        );
        expect(
            await screen.findByRole("heading", { name: "Borrador de prueba" }),
        ).toBeInTheDocument();
        expect(screen.getByText("Campaña activa")).toBeInTheDocument();
        expect(screen.getByText("Campaña finalizada")).toBeInTheDocument();
        expect(screen.getByText("Campaña archivada")).toBeInTheDocument();
        expect(screen.getByText("24")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Activar/ })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Editar borrador/ })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Eliminar/ })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Finalizar/ })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Archivar/ })).toBeInTheDocument();
        expect(screen.getByText(/Fechas en UTC/)).toBeInTheDocument();
        expect(
            screen.queryByLabelText(/cupón de recompensa/i),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByText(/ID del cupón de recompensa/i),
        ).not.toBeInTheDocument();
    });

    it("creates a draft with its integrated reward definition", async () => {
        const user = userEvent.setup();
        render(<TenantLoyaltyClient />);
        await screen.findByRole("heading", { name: "Borrador de prueba" });

        fireEvent.change(screen.getByLabelText("Nombre"), {
            target: { value: "Campaña de gasto" },
        });
        fireEvent.change(screen.getByLabelText("Descripción de la campaña"), {
            target: { value: "Campaña de integración" },
        });
        fireEvent.change(screen.getByLabelText("Origen"), {
            target: { value: "BOOKING" },
        });
        fireEvent.change(screen.getByLabelText("Métrica"), {
            target: { value: "SPEND" },
        });
        fireEvent.change(screen.getByLabelText("Objetivo"), {
            target: { value: "150.50" },
        });
        await user.type(screen.getByLabelText("Inicio"), "2030-01-01");
        await user.type(screen.getByLabelText("Fin"), "2030-01-31");
        await user.type(
            screen.getByLabelText("Reclamable hasta"),
            "2030-02-15",
        );
        fireEvent.change(screen.getByLabelText("Validez de la recompensa (días)"), {
            target: { value: "45" },
        });
        fireEvent.change(screen.getByLabelText("Límite de reclamos"), {
            target: { value: "100" },
        });
        fireEvent.change(screen.getByLabelText("Tipo"), {
            target: { value: "FIXED" },
        });
        fireEvent.change(screen.getByLabelText("Valor"), {
            target: { value: "25" },
        });
        fireEvent.change(
            screen.getByLabelText("Descripción de la recompensa"),
            { target: { value: "Twenty five off" } },
        );
        fireEvent.change(screen.getByLabelText("Compra mínima"), {
            target: { value: "50" },
        });
        fireEvent.change(screen.getByLabelText("Descuento máximo"), {
            target: { value: "60" },
        });
        fireEvent.change(screen.getByLabelText("IDs de productos"), {
            target: { value: "product-1, product-2" },
        });
        fireEvent.change(screen.getByLabelText("IDs de categorías"), {
            target: { value: "category-1 category-2" },
        });
        fireEvent.change(screen.getByLabelText("IDs de servicios"), {
            target: { value: "service-1" },
        });

        const createButton = screen.getByRole("button", {
            name: "Crear borrador",
        });
        expect(createButton).toBeEnabled();
        fireEvent.submit(createButton.closest("form")!);

        expect(mocks.createCampaign).toHaveBeenCalledWith({
            name: "Campaña de gasto",
            description: "Campaña de integración",
            source: "BOOKING",
            metric: "SPEND",
            targetValue: "150.50",
            startsAt: "2030-01-01T00:00:00.000Z",
            endsAt: "2030-01-31T00:00:00.000Z",
            claimUntil: "2030-02-15T00:00:00.000Z",
            reward: {
                type: "FIXED",
                value: 25,
                description: "Twenty five off",
                minPurchaseAmount: 50,
                maxDiscountAmount: 60,
                applicableProducts: ["product-1", "product-2"],
                applicableCategories: ["category-1", "category-2"],
                applicableServices: ["service-1"],
            },
            rewardValidDays: 45,
            maxClaims: 100,
        });
        expect(
            await screen.findByText("Campaña creada como borrador."),
        ).toBeInTheDocument();
    });

    it("updates an existing DRAFT campaign", async () => {
        const user = userEvent.setup();
        render(<TenantLoyaltyClient />);
        await screen.findByRole("heading", { name: "Borrador de prueba" });

        await user.click(screen.getByRole("button", { name: /Editar borrador/ }));
        fireEvent.change(screen.getByLabelText("Nombre"), {
            target: { value: "Borrador actualizado" },
        });
        const saveButton = screen.getByRole("button", {
            name: "Guardar borrador",
        });
        expect(saveButton).toBeEnabled();
        fireEvent.submit(saveButton.closest("form")!);

        expect(mocks.updateCampaign).toHaveBeenCalledWith(
            "draft-1",
            expect.objectContaining({
                name: "Borrador actualizado",
                reward: expect.objectContaining({
                    type: "PERCENT",
                    value: 10,
                    applicableProducts: ["product-1"],
                }),
            }),
        );
        expect(
            await screen.findByText("Borrador actualizado correctamente."),
        ).toBeInTheDocument();
    });

    it("matches backend target precision and integer limits", async () => {
        const user = userEvent.setup();
        render(<TenantLoyaltyClient />);
        await screen.findByRole("heading", { name: "Borrador de prueba" });
        await user.click(screen.getByRole("button", { name: /Editar borrador/ }));

        const target = screen.getByLabelText("Objetivo");
        const metric = screen.getByLabelText("Métrica");
        const rewardValidDays = screen.getByLabelText(
            "Validez de la recompensa (días)",
        );
        const maxClaims = screen.getByLabelText("Límite de reclamos");
        const saveButton = () =>
            screen.getByRole("button", { name: "Guardar borrador" });

        expect(rewardValidDays).toHaveAttribute("max", String(MAX_INT));
        expect(maxClaims).toHaveAttribute("max", String(MAX_INT));

        fireEvent.change(metric, { target: { value: "COUNT" } });
        fireEvent.change(target, { target: { value: "01.00" } });
        expect(saveButton()).toBeDisabled();

        fireEvent.change(metric, { target: { value: "SPEND" } });
        fireEvent.change(target, { target: { value: "0.01" } });
        expect(saveButton()).toBeEnabled();

        fireEvent.change(target, {
            target: { value: "9999999999999999.99" },
        });
        expect(saveButton()).toBeEnabled();
        fireEvent.change(target, {
            target: { value: "10000000000000000.00" },
        });
        expect(saveButton()).toBeDisabled();
        fireEvent.change(target, { target: { value: "0.01" } });
        expect(saveButton()).toBeEnabled();

        fireEvent.change(rewardValidDays, {
            target: { value: String(MAX_INT + 1) },
        });
        expect(saveButton()).toBeDisabled();
        fireEvent.change(rewardValidDays, {
            target: { value: String(MAX_INT) },
        });
        expect(saveButton()).toBeEnabled();

        fireEvent.change(maxClaims, {
            target: { value: String(MAX_INT + 1) },
        });
        expect(saveButton()).toBeDisabled();
        fireEvent.change(maxClaims, {
            target: { value: String(MAX_INT) },
        });
        expect(saveButton()).toBeEnabled();
    });

    it("runs activate, end, archive, and delete lifecycle actions", async () => {
        const user = userEvent.setup();
        render(<TenantLoyaltyClient />);
        await screen.findByRole("heading", { name: "Borrador de prueba" });

        await user.click(screen.getByRole("button", { name: /Activar/ }));
        await waitFor(() =>
            expect(mocks.activateCampaign).toHaveBeenCalledWith("draft-1"),
        );
        await user.click(screen.getByRole("button", { name: /Finalizar/ }));
        await waitFor(() =>
            expect(mocks.endCampaign).toHaveBeenCalledWith("active-1"),
        );
        await user.click(screen.getByRole("button", { name: /Archivar/ }));
        await waitFor(() =>
            expect(mocks.archiveCampaign).toHaveBeenCalledWith("ended-1"),
        );
        await user.click(screen.getByRole("button", { name: /Eliminar/ }));
        await waitFor(() =>
            expect(mocks.deleteCampaign).toHaveBeenCalledWith("draft-1"),
        );
    });

    it("shows a load error and retries summary and campaign requests", async () => {
        const user = userEvent.setup();
        mocks.getAdminSummary.mockRejectedValueOnce(new Error("network"));
        mocks.getAdminCampaigns.mockRejectedValueOnce(new Error("network"));

        render(<TenantLoyaltyClient />);

        expect(
            await screen.findByText(
                "No pudimos cargar las campañas de fidelización.",
            ),
        ).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Reintentar" }));
        await waitFor(() => expect(mocks.getAdminSummary).toHaveBeenCalledTimes(2));
        expect(
            await screen.findByRole("heading", { name: "Borrador de prueba" }),
        ).toBeInTheDocument();
    });
});
