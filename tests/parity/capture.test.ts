import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type RouteEntry = {
    path: string;
    tenant: string;
};

function loadRoutes(): RouteEntry[] {
    return JSON.parse(
        readFileSync(new URL("./routes.json", import.meta.url), "utf8"),
    ) as RouteEntry[];
}

const routes = loadRoutes();

describe("parity route fixtures", () => {
    it("lists at least eight critical paths", () => {
        expect(Array.isArray(routes)).toBe(true);
        expect(routes.length).toBeGreaterThanOrEqual(8);
    });

    it("gives every entry a path and a tenant", () => {
        for (const entry of routes) {
            expect(entry).toHaveProperty("path");
            expect(entry).toHaveProperty("tenant");
            expect(typeof entry.path).toBe("string");
            expect(typeof entry.tenant).toBe("string");
        }
    });

    it("covers every path the rewrite must preserve", () => {
        const paths = new Set(routes.map((entry) => entry.path));
        for (const path of [
            "/store",
            "/products",
            "/cart",
            "/login",
            "/admin/orders",
            "/booking/home",
            "/api/products",
            "/api/webhooks/health",
        ]) {
            expect(paths.has(path)).toBe(true);
        }
    });

    it("covers both the store and booking tenants", () => {
        const tenants = new Set(routes.map((entry) => entry.tenant));
        expect(tenants.has("store")).toBe(true);
        expect(tenants.has("booking")).toBe(true);
    });
});
