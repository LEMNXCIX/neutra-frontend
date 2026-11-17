// @vitest-environment happy-dom

import { type ComponentType, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { NotFound } from "@/components/not-found";
import { RootDocument, Route } from "../__root";
import { Route as StoreRoute } from "../_store";

// HeadContent/Scripts read the router context, which a standalone document
// render does not provide. Stub only those; keep createRootRoute/Outlet real.
vi.mock("@tanstack/react-router", async (importOriginal) => {
    const actual =
        await importOriginal<typeof import("@tanstack/react-router")>();
    return {
        ...actual,
        HeadContent: () => <meta data-testid="head-content" />,
        Scripts: () => <script data-testid="scripts" />,
        Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
            <a href={to}>{children}</a>
        ),
    };
});

describe("RootDocument", () => {
    it("renders an html document with a head, body and the supplied child", () => {
        const markup = renderToStaticMarkup(
            <RootDocument>
                <p>root-document-child</p>
            </RootDocument>,
        );
        const document = new DOMParser().parseFromString(markup, "text/html");

        const html = document.querySelector("html");
        expect(html).not.toBeNull();
        expect(html?.querySelector("head")).not.toBeNull();
        expect(html?.querySelector("body")).not.toBeNull();
        expect(document.body.textContent).toContain("root-document-child");
    });

    it("links the canonical PWA manifest", async () => {
        const head = await Route.options.head!({} as never);

        expect(head.links).toContainEqual({
            rel: "manifest",
            href: "/manifest.webmanifest",
        });
    });

    it("provides a localized not-found component with a home link", () => {
        expect(StoreRoute.options.notFoundComponent).toBeTypeOf("function");

        const markup = renderToStaticMarkup(
            createElement(NotFound as ComponentType),
        );
        const document = new DOMParser().parseFromString(markup, "text/html");

        expect(document.body.textContent).toContain("Página no encontrada");
        expect(document.querySelector("a")?.getAttribute("href")).toBe("/");
    });
});
