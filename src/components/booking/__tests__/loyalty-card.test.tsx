// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const mocks = vi.hoisted(() => ({
    featureEnabled: true,
    checkedFeature: "",
    getMySummary: vi.fn(),
    claimReward: vi.fn(),
    writeText: vi.fn(),
}));

vi.mock("@/hooks/useFeatures", () => ({
    useFeatures: () => ({
        isFeatureEnabled: (feature: string) => {
            mocks.checkedFeature = feature;
            return feature === "LOYALTY" && mocks.featureEnabled;
        },
    }),
}));

vi.mock("@/services/loyalty.service", () => ({
    loyaltyService: {
        getMySummary: mocks.getMySummary,
        claimReward: mocks.claimReward,
    },
}));

import { LoyaltyCard } from "@/components/booking/loyalty-card";

const inProgress = {
    points: 75,
    targetPoints: 150,
    remaining: 75,
    status: "IN_PROGRESS" as const,
};

beforeEach(() => {
    vi.clearAllMocks();
    mocks.featureEnabled = true;
    mocks.getMySummary.mockResolvedValue(inProgress);
});

describe("LoyaltyCard", () => {
    it("does not render or request loyalty data when LOYALTY is disabled", () => {
        mocks.featureEnabled = false;

        render(<LoyaltyCard />);

        expect(mocks.checkedFeature).toBe("LOYALTY");
        expect(
            screen.queryByRole("heading", { name: "Programa de fidelización" }),
        ).not.toBeInTheDocument();
        expect(mocks.getMySummary).not.toHaveBeenCalled();
    });

    it("does not render when the reward is not configured", async () => {
        mocks.getMySummary.mockResolvedValue({
            points: 0,
            targetPoints: 10,
            remaining: 0,
            status: "NOT_CONFIGURED" as const,
        });

        render(<LoyaltyCard />);

        await waitFor(() => expect(mocks.getMySummary).toHaveBeenCalled());
        expect(
            screen.queryByRole("heading", { name: "Programa de fidelización" }),
        ).not.toBeInTheDocument();
    });

    it("shows points and progress for an in-progress customer", async () => {
        render(<LoyaltyCard />);

        expect(
            await screen.findByRole("heading", { name: "Programa de fidelización" }),
        ).toBeInTheDocument();
        expect(screen.getByText("75")).toBeInTheDocument();
        expect(screen.getByText("de 150 puntos")).toBeInTheDocument();
        expect(screen.getByRole("progressbar")).toHaveAttribute(
            "aria-valuenow",
            "50",
        );
        expect(
            screen.queryByRole("button", { name: "Reclamar recompensa" }),
        ).not.toBeInTheDocument();
    });

    it("claims once, refreshes, and exposes the personal coupon code", async () => {
        const user = userEvent.setup();
        const ready = {
            points: 100,
            targetPoints: 100,
            remaining: 0,
            status: "READY" as const,
        };
        const claim = {
            id: "claim-1",
            milestone: 1,
            couponId: "coupon-1",
            status: "CLAIMED" as const,
            createdAt: "2030-01-01T00:00:00.000Z",
            updatedAt: "2030-01-01T00:00:00.000Z",
            coupon: { code: "REWARD-2026" },
        };
        const claimed = { ...ready, status: "CLAIMED" as const };
        let resolveClaim: ((value: typeof claim) => void) | undefined;
        mocks.getMySummary
            .mockResolvedValueOnce(ready)
            .mockResolvedValueOnce(claimed);
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

        resolveClaim?.(claim);
        expect(await screen.findByText("REWARD-2026")).toBeInTheDocument();
        await waitFor(() => expect(mocks.getMySummary).toHaveBeenCalledTimes(2));

        await user.click(screen.getByRole("button", { name: "Copiar código" }));
        expect(mocks.writeText).toHaveBeenCalledWith("REWARD-2026");
        expect(
            await screen.findByText("Código copiado al portapapeles."),
        ).toBeInTheDocument();
    });

    it("shows an error and retries the summary request", async () => {
        const user = userEvent.setup();
        mocks.getMySummary
            .mockRejectedValueOnce(new Error("network"))
            .mockResolvedValueOnce(inProgress);

        render(<LoyaltyCard />);

        expect(
            await screen.findByText("No pudimos cargar tu programa de fidelización."),
        ).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Reintentar" }));
        expect(await screen.findByText("75")).toBeInTheDocument();
        expect(mocks.getMySummary).toHaveBeenCalledTimes(2);
    });
});
