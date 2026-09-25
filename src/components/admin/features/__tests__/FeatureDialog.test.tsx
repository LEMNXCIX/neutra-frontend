// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/services/features.service", () => ({
    featuresService: {
        create: vi.fn(),
        update: vi.fn(),
    },
}));

import { FeatureDialog } from "@/components/admin/features/FeatureDialog";

const feature = {
    id: "feature-loyalty",
    key: "LOYALTY",
    name: "Loyalty Program",
    description: "Enable customer loyalty rewards",
    category: "MODULE",
    price: 3,
};

describe("FeatureDialog", () => {
    it("hydrates the form when the selected feature changes", () => {
        const onOpenChange = vi.fn();
        const onSuccess = vi.fn();
        const { rerender } = render(
            <FeatureDialog
                open={false}
                onOpenChange={onOpenChange}
                feature={null}
                onSuccess={onSuccess}
            />,
        );

        rerender(
            <FeatureDialog
                open
                onOpenChange={onOpenChange}
                feature={feature}
                onSuccess={onSuccess}
            />,
        );

        expect(screen.getByDisplayValue("Loyalty Program")).toBeInTheDocument();
        expect(screen.getByDisplayValue("LOYALTY")).toBeInTheDocument();
        expect(screen.getByDisplayValue("MODULE")).toBeInTheDocument();
        expect(screen.getByDisplayValue("3")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Enable customer loyalty rewards")).toBeInTheDocument();
    });
});
