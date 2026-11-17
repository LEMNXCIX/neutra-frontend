// @vitest-environment happy-dom

/**
 * Absolute / cross-tenant URLs must be plain anchors. If SmartLink ever routes
 * one through TanStack Link, the mocked Link below throws (buildLocation would
 * reject an absolute URL in a real router).
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
    Link: () => {
        throw new Error("TanStack Link must not be used for external URLs");
    },
}));

import { SmartLink } from "@/components/ui/smart-link";

describe("SmartLink external targets", () => {
    it("renders a cross-tenant absolute URL as a plain anchor", () => {
        const href = "http://clinica.192.168.68.100.nip.io:3001/home";
        render(<SmartLink href={href}>Mi tenant</SmartLink>);

        const anchor = screen.getByRole("link", { name: "Mi tenant" });
        expect(anchor.tagName).toBe("A");
        expect(anchor).toHaveAttribute("href", href);
    });

    it("renders protocol-relative and mailto URLs as plain anchors", () => {
        render(
            <>
                <SmartLink href="//cdn.example.com/banner">Banner</SmartLink>
                <SmartLink href="mailto:support@xcix.com">Correo</SmartLink>
            </>,
        );

        expect(screen.getByRole("link", { name: "Banner" })).toHaveAttribute(
            "href",
            "//cdn.example.com/banner",
        );
        expect(screen.getByRole("link", { name: "Correo" })).toHaveAttribute(
            "href",
            "mailto:support@xcix.com",
        );
    });
});
