// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const mocks = vi.hoisted(() => ({
    enabledFeatures: new Set(["LOYALTY", "COUPONS"]),
    checkedFeatures: [] as string[],
    getMyCampaigns: vi.fn(),
    claimReward: vi.fn(),
    writeText: vi.fn(),
}));

vi.mock("@/hooks/useFeatures", () => ({
    useFeatures: () => ({
        isFeatureEnabled: (feature: string) => {
            mocks.checkedFeatures.push(feature);
            return mocks.enabledFeatures.has(feature);
        },
    }),
}));

vi.mock("@/services/loyalty.service", () => ({
    loyaltyService: {
        getMyCampaigns: mocks.getMyCampaigns,
        claimReward: mocks.claimReward,
    },
}));

import { LoyaltyCard } from "@/components/booking/loyalty-card";

const inProgress = {
    campaignId: "campaign-count",
    name: "Campaña de prueba",
    source: "BOOKING" as const,
    startsAt: "2030-01-01T00:00:00.000Z",
    endsAt: "2030-01-31T00:00:00.000Z",
    claimUntil: "2030-02-15T00:00:00.000Z",
    metric: "COUNT" as const,
    progressValue: "75.00",
    targetValue: "150.00",
    remainingValue: "75.00",
    lifecycleStatus: "ACTIVE" as const,
    customerStatus: "IN_PROGRESS" as const,
};

const draft = {
    ...inProgress,
    campaignId: "draft-campaign",
    name: "Campaña en borrador",
    lifecycleStatus: "DRAFT" as const,
    customerStatus: "NOT_STARTED" as const,
};

beforeEach(() => {
    vi.clearAllMocks();
    mocks.enabledFeatures = new Set(["LOYALTY", "COUPONS"]);
    mocks.checkedFeatures = [];
    mocks.getMyCampaigns.mockResolvedValue([inProgress]);
});

describe("LoyaltyCard", () => {
    it("does not render or request campaigns when required features are disabled", () => {
        mocks.enabledFeatures = new Set(["LOYALTY"]);

        render(<LoyaltyCard />);

        expect(mocks.checkedFeatures).toContain("LOYALTY");
        expect(mocks.checkedFeatures).toContain("COUPONS");
        expect(
            screen.queryByRole("heading", { name: "Programa de fidelización" }),
        ).not.toBeInTheDocument();
        expect(mocks.getMyCampaigns).not.toHaveBeenCalled();
    });

    it("shows a loading state and an empty state when no campaigns exist", async () => {
        let resolveCampaigns: ((value: typeof inProgress[]) => void) | undefined;
        mocks.getMyCampaigns.mockImplementationOnce(
            () =>
                new Promise<typeof inProgress[]>((resolve) => {
                    resolveCampaigns = resolve;
                }),
        );
        render(<LoyaltyCard />);

        expect(screen.getByRole("status")).toHaveTextContent(
            "Cargando tus campañas…",
        );
        resolveCampaigns?.([]);
        expect(
            await screen.findByText(
                "No hay campañas de fidelización disponibles en este momento.",
            ),
        ).toBeInTheDocument();
    });

    it("renders COUNT progress and never exposes DRAFT campaigns", async () => {
        mocks.getMyCampaigns.mockResolvedValue([draft, inProgress]);

        render(<LoyaltyCard />);

        expect(
            await screen.findByRole("heading", {
                name: "Programa de fidelización",
            }),
        ).toBeInTheDocument();
        expect(screen.getByText("Campaña de prueba")).toBeInTheDocument();
        expect(screen.getByText(/Reservas · Del/)).toBeInTheDocument();
        expect(screen.getByText("75")).toBeInTheDocument();
        expect(screen.getByText("de 150 completados")).toBeInTheDocument();
        expect(screen.getByText("Te faltan 75 completados")).toBeInTheDocument();
        expect(screen.getByRole("progressbar")).toHaveAttribute(
            "aria-valuenow",
            "50",
        );
        expect(screen.queryByText(/draft-campaign/)).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Reclamar recompensa" }),
        ).not.toBeInTheDocument();
    });

    it("renders decimal SPEND progress without losing cents", async () => {
        mocks.getMyCampaigns.mockResolvedValue([
            {
                campaignId: "campaign-spend",
                name: "Campaña de gasto",
                source: "STORE",
                startsAt: "2030-01-01T00:00:00.000Z",
                endsAt: "2030-01-31T00:00:00.000Z",
                claimUntil: "2030-02-15T00:00:00.000Z",
                metric: "SPEND",
                progressValue: "125.50",
                targetValue: "250.00",
                remainingValue: "124.50",
                lifecycleStatus: "ACTIVE",
                customerStatus: "IN_PROGRESS",
            },
        ]);

        render(<LoyaltyCard />);

        expect(await screen.findByText("125,50")).toBeInTheDocument();
        expect(screen.getByText("de 250,00 de gasto neto")).toBeInTheDocument();
        expect(
            screen.getByText("Te faltan 124,50 de gasto neto"),
        ).toBeInTheDocument();
        expect(screen.getByRole("progressbar")).toHaveAttribute(
            "aria-valuenow",
            "50",
        );
    });

    it("selects active, claimable, and claimed campaigns", async () => {
        const user = userEvent.setup();
        mocks.getMyCampaigns.mockResolvedValue([
            inProgress,
            {
                campaignId: "ready-campaign",
                name: "Campaña lista",
                source: "BOOKING",
                startsAt: "2030-01-01T00:00:00.000Z",
                endsAt: "2030-01-31T00:00:00.000Z",
                claimUntil: "2030-02-15T00:00:00.000Z",
                metric: "COUNT",
                progressValue: "10.00",
                targetValue: "10.00",
                remainingValue: "0.00",
                lifecycleStatus: "ACTIVE",
                customerStatus: "READY",
            },
            {
                campaignId: "claimed-campaign",
                name: "Campaña reclamada",
                source: "STORE",
                startsAt: "2029-12-01T00:00:00.000Z",
                endsAt: "2029-12-31T00:00:00.000Z",
                claimUntil: "2030-01-15T00:00:00.000Z",
                metric: "COUNT",
                progressValue: "5.00",
                targetValue: "5.00",
                remainingValue: "0.00",
                lifecycleStatus: "ENDED",
                customerStatus: "CLAIMED",
                claim: {
                    id: "claim-existing",
                    campaignId: "claimed-campaign",
                    couponId: "coupon-existing",
                    status: "CLAIMED",
                    createdAt: "2030-01-01T00:00:00.000Z",
                    updatedAt: "2030-01-01T00:00:00.000Z",
                },
            },
        ]);

        render(<LoyaltyCard />);
        const selector = await screen.findByLabelText("Campaña");
        expect(selector).toHaveValue("campaign-count");
        expect(screen.getAllByRole("option")).toHaveLength(3);
        expect(
            screen.getByRole("option", { name: "Campaña de prueba" }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("option", { name: /campaign-count/ }),
        ).not.toBeInTheDocument();

        await user.selectOptions(selector, "claimed-campaign");
        expect(screen.getByText(/Tienda · Del/)).toBeInTheDocument();
        expect(screen.getByText("Has reclamado tu recompensa.")).toBeInTheDocument();
        expect(screen.getByText("Reclamo: claim-existing")).toBeInTheDocument();
        expect(screen.getByText("Cupón: coupon-existing")).toBeInTheDocument();
    });

    it("claims only READY with campaignId, refreshes, and exposes the coupon", async () => {
        const user = userEvent.setup();
        const ready = {
            campaignId: "campaign/ready",
            name: "Campaña para reclamar",
            source: "BOOKING" as const,
            startsAt: "2030-01-01T00:00:00.000Z",
            endsAt: "2030-01-31T00:00:00.000Z",
            claimUntil: "2030-02-15T00:00:00.000Z",
            metric: "COUNT" as const,
            progressValue: "10.00",
            targetValue: "10.00",
            remainingValue: "0.00",
            lifecycleStatus: "ACTIVE" as const,
            customerStatus: "READY" as const,
        };
        const claim = {
            id: "claim-1",
            campaignId: "campaign/ready",
            couponId: "coupon-1",
            status: "CLAIMED" as const,
            createdAt: "2030-01-01T00:00:00.000Z",
            updatedAt: "2030-01-01T00:00:00.000Z",
            coupon: { code: "REWARD-2026" },
        };
        const claimed = { ...ready, customerStatus: "CLAIMED" as const };
        let resolveClaim: ((value: typeof claim) => void) | undefined;
        mocks.getMyCampaigns
            .mockResolvedValueOnce([ready])
            .mockResolvedValueOnce([claimed]);
        mocks.claimReward.mockImplementation(
            () =>
                new Promise<typeof claim>((resolve) => {
                    resolveClaim = resolve;
                }),
        );
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText: mocks.writeText },
        });
        mocks.writeText.mockResolvedValue(undefined);

        render(<LoyaltyCard />);
        const claimButton = await screen.findByRole("button", {
            name: "Reclamar recompensa",
        });

        await user.dblClick(claimButton);
        expect(mocks.claimReward).toHaveBeenCalledTimes(1);
        expect(mocks.claimReward).toHaveBeenCalledWith("campaign/ready");

        resolveClaim?.(claim);
        expect(await screen.findByText("REWARD-2026")).toBeInTheDocument();
        expect(screen.getByText("Reclamo: claim-1")).toBeInTheDocument();
        expect(screen.getByText("Cupón: coupon-1")).toBeInTheDocument();
        await waitFor(() => expect(mocks.getMyCampaigns).toHaveBeenCalledTimes(2));

        await user.click(screen.getByRole("button", { name: "Copiar código" }));
        expect(mocks.writeText).toHaveBeenCalledWith("REWARD-2026");
        expect(
            await screen.findByText("Código copiado al portapapeles."),
        ).toBeInTheDocument();
    });

    it("shows expired campaigns without a claim action", async () => {
        mocks.getMyCampaigns.mockResolvedValue([
            {
                campaignId: "expired-campaign",
                name: "Campaña expirada",
                source: "BOOKING",
                startsAt: "2029-12-01T00:00:00.000Z",
                endsAt: "2029-12-31T00:00:00.000Z",
                claimUntil: "2030-01-15T00:00:00.000Z",
                metric: "COUNT",
                progressValue: "10.00",
                targetValue: "10.00",
                remainingValue: "0.00",
                lifecycleStatus: "ENDED",
                customerStatus: "EXPIRED",
            },
        ]);

        render(<LoyaltyCard />);

        expect(
            await screen.findByText(
                "La recompensa expiró y ya no se puede reclamar.",
            ),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Reclamar recompensa" }),
        ).not.toBeInTheDocument();
    });

    it("shows a load error and retries the campaign request", async () => {
        const user = userEvent.setup();
        mocks.getMyCampaigns
            .mockRejectedValueOnce(new Error("network"))
            .mockResolvedValueOnce([inProgress]);

        render(<LoyaltyCard />);

        expect(
            await screen.findByText(
                "No pudimos cargar tus campañas de fidelización.",
            ),
        ).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Reintentar" }));
        expect(await screen.findByText("75")).toBeInTheDocument();
        expect(mocks.getMyCampaigns).toHaveBeenCalledTimes(2);
    });
});
