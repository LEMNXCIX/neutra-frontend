/**
 * Regression test for the Node adapter's static-file layer. The Start fetch
 * handler does not serve dist/client from disk, so without this layer every
 * JS/CSS/icon request returns 404 and the app never hydrates.
 */
import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
    CLIENT_DIR,
    contentType,
    resolveStaticFile,
} from "../scripts/serve-start-static.mjs";

describe("serve-start static files", () => {
    it("resolves built assets and public files from dist/client", async () => {
        const icon = await resolveStaticFile("/icon.svg");
        expect(icon).not.toBeNull();
        expect(icon).toBe(join(CLIENT_DIR, "icon.svg"));
        expect(existsSync(icon!)).toBe(true);

        const sw = await resolveStaticFile("/sw.js");
        expect(sw).not.toBeNull();
        expect(basename(sw!)).toBe("sw.js");
    });

    it("leaves server routes and SPA fallbacks to Start", async () => {
        expect(await resolveStaticFile("/manifest.webmanifest")).toBeNull();
        expect(await resolveStaticFile("/api/products")).toBeNull();
        expect(await resolveStaticFile("/products")).toBeNull();
    });

    it("refuses path traversal and malformed encodings", async () => {
        expect(await resolveStaticFile("/../package.json")).toBeNull();
        expect(await resolveStaticFile("/%2e%2e/package.json")).toBeNull();
        expect(await resolveStaticFile("/%E0%A4%A")).toBeNull();
    });

    it("maps content types for hashed assets", () => {
        expect(contentType("/assets/index-abc.js")).toBe(
            "text/javascript; charset=utf-8",
        );
        expect(contentType("/assets/index-abc.css")).toBe(
            "text/css; charset=utf-8",
        );
        expect(contentType("/icon.svg")).toBe("image/svg+xml");
    });
});
