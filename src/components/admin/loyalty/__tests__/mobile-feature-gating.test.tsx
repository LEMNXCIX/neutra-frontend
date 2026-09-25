// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const mocks = vi.hoisted(() => ({
    isFeatureEnabled: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    usePathname: () => "/admin",
}));

vi.mock("@/hooks/useFeatures", () => ({
    useFeatures: () => ({ isFeatureEnabled: mocks.isFeatureEnabled }),
}));

vi.mock("@/store/auth-store", () => ({
    useAuthStore: () => ({ user: { isAdmin: true } }),
}));

import AdminMobileNav from "@/components/admin/AdminMobileNav";
import AdminSidebar from "@/components/admin/AdminSidebar";

const items = [
    { href: "/admin", label: "Panel", icon: "LayoutDashboard", exact: true },
    {
        href: "/admin/loyalty",
        label: "Fidelización",
        icon: "Gift",
        requiredFeatures: ["LOYALTY", "COUPONS"],
    },
    {
        href: "/admin/coupons",
        label: "Cupones",
        icon: "Ticket",
        requiredFeature: "COUPONS",
    },
];

const loyaltyItems = items.filter((item) => item.href !== "/admin/coupons");
const singleFeatureItems = items.filter((item) =>
    ["/admin", "/admin/coupons"].includes(item.href),
);

beforeEach(() => {
    vi.clearAllMocks();
    mocks.isFeatureEnabled.mockReturnValue(false);
});

describe("tenant navigation feature filtering", () => {
    it("requires every feature for loyalty while preserving single-feature gating", () => {
        mocks.isFeatureEnabled.mockImplementation(
            (feature: string) => feature === "LOYALTY",
        );

        render(<AdminMobileNav items={loyaltyItems} />);

        expect(mocks.isFeatureEnabled).toHaveBeenCalledWith("LOYALTY");
        expect(mocks.isFeatureEnabled).toHaveBeenCalledWith("COUPONS");
        expect(screen.getByText("Panel")).toBeInTheDocument();
        expect(screen.queryByText("Fidelización")).not.toBeInTheDocument();
    });

    it("preserves single-feature gating for existing items", () => {
        mocks.isFeatureEnabled.mockImplementation(
            (feature: string) => feature === "COUPONS",
        );

        render(<AdminMobileNav items={singleFeatureItems} />);

        expect(screen.getByText("Cupones")).toBeInTheDocument();
    });

    it("shows loyalty only when both required features are enabled", () => {
        mocks.isFeatureEnabled.mockReturnValue(true);

        render(<AdminMobileNav items={items} />);

        expect(screen.getByText("Fidelización")).toBeInTheDocument();
    });

    it("applies the same multi-feature gate to the desktop sidebar", () => {
        mocks.isFeatureEnabled.mockImplementation(
            (feature: string) => feature === "COUPONS",
        );

        render(<AdminSidebar items={items} />);

        expect(screen.getByText("Panel")).toBeInTheDocument();
        expect(screen.getByText("Cupones")).toBeInTheDocument();
        expect(screen.queryByText("Fidelización")).not.toBeInTheDocument();
    });
});
