// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
/**
 * Navigation parity for the ported product grid. The mocked Link records the
 * typed `to`/`params` pair it receives, so this fails while the component still
 * imports next/link and passes an untyped `href`.
 */
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

const seen = vi.hoisted(() => [] as Array<{ to: string; params?: unknown }>);

vi.mock("@tanstack/react-router", () => ({
    Link: ({ to, params, children, ...rest }: any) => {
        seen.push({ to, params });
        const href = to.replace(
            /\$([A-Za-z0-9_]+)/g,
            (_m: string, key: string) => String(params?.[key] ?? ""),
        );
        return createElement(
            "a",
            { href, "data-tanstack-link": "true", ...rest },
            children,
        );
    },
    useNavigate: () => vi.fn(),
    useLocation: (opts?: any) => {
        const location = { pathname: "/", searchStr: "", search: {} };
        return opts?.select ? opts.select(location) : location;
    },
    useRouter: () => ({
        invalidate: vi.fn(),
        history: { back: vi.fn(), forward: vi.fn() },
    }),
}));

vi.mock("@/hooks/use-cart", () => ({
    useCart: () => ({ addItem: vi.fn() }),
}));

import ProductGrid from "@/components/product-grid";

describe("product navigation", () => {
    it("renders product links through TanStack Link with a typed dynamic route", () => {
        render(
            <ProductGrid
                products={[
                    {
                        id: "prod-42",
                        title: "Producto de prueba",
                        price: 10,
                        image: "/images/test.png",
                    },
                ]}
            />,
        );

        const anchors = screen.getAllByRole("link");
        expect(
            anchors.some(
                (anchor) =>
                    anchor.getAttribute("href") === "/products/prod-42" &&
                    anchor.getAttribute("data-tanstack-link") === "true",
            ),
        ).toBe(true);

        expect(
            seen.some(
                (link) =>
                    link.to === "/products/$id" &&
                    (link.params as { id?: string } | undefined)?.id ===
                        "prod-42",
            ),
        ).toBe(true);
    });
});
