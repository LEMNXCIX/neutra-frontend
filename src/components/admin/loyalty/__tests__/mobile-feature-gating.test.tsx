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

const items = [
    { href: "/admin", label: "Panel", icon: "LayoutDashboard", exact: true },
    {
        href: "/admin/loyalty",
        label: "Fidelización",
        icon: "Gift",
        requiredFeature: "LOYALTY",
    },
];

beforeEach(() => {
    vi.clearAllMocks();
    mocks.isFeatureEnabled.mockReturnValue(false);
});

describe("AdminMobileNav feature filtering", () => {
    it("uses requiredFeature and hides disabled loyalty navigation", () => {
        render(<AdminMobileNav items={items} />);

        expect(mocks.isFeatureEnabled).toHaveBeenCalledWith("LOYALTY");
        expect(screen.getByText("Panel")).toBeInTheDocument();
        expect(screen.queryByText("Fidelización")).not.toBeInTheDocument();
    });

    it("shows the item when its required feature is enabled", () => {
        mocks.isFeatureEnabled.mockImplementation(
            (feature: string) => feature === "LOYALTY",
        );

        render(<AdminMobileNav items={items} />);

        expect(screen.getByText("Fidelización")).toBeInTheDocument();
    });
});
