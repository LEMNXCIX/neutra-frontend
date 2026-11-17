// @vitest-environment happy-dom

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { RootDocument } from "../__root";

// HeadContent/Scripts read the router context, which a standalone document
// render does not provide. Stub only those; keep createRootRoute/Outlet real.
vi.mock("@tanstack/react-router", async (importOriginal) => {
    const actual =
        await importOriginal<typeof import("@tanstack/react-router")>();
    return {
        ...actual,
        HeadContent: () => <meta data-testid="head-content" />,
        Scripts: () => <script data-testid="scripts" />,
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
});
