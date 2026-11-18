import { readFileSync } from "node:fs";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import http from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
    captureRoutes,
    requestRoute,
    tenantHeaders,
} from "../../scripts/capture-parity.mjs";

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

async function unusedPort(): Promise<number> {
    const server = http.createServer();
    await new Promise<void>((resolve) =>
        server.listen(0, "127.0.0.1", resolve),
    );
    const { port } = server.address() as { port: number };
    await new Promise<void>((resolve) => server.close(() => resolve()));
    return port;
}

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

    it("derives the Host header from the tenant entry and keeps the tenant headers", () => {
        for (const tenant of ["store", "booking"]) {
            const headers = tenantHeaders(tenant, "http://localhost:3001");
            expect(headers.host).toBe(`${tenant}.localhost:3001`);
            expect(headers["x-tenant-slug"]).toBe(tenant);
            expect(headers["x-tenant-id"]).toBe(tenant);
        }
    });

    it("allows overriding the tenant domain via the environment", () => {
        const original = process.env.PARITY_TENANT_DOMAIN;
        process.env.PARITY_TENANT_DOMAIN = "example.test";
        try {
            expect(tenantHeaders("store", "http://localhost:3001").host).toBe(
                "store.example.test:3001",
            );
        } finally {
            if (original === undefined) delete process.env.PARITY_TENANT_DOMAIN;
            else process.env.PARITY_TENANT_DOMAIN = original;
        }
    });

    it("sends the derived Host header to the server", async () => {
        const server = http.createServer((request, response) => {
            response.writeHead(200, { "content-type": "application/json" });
            response.end(
                JSON.stringify({
                    host: request.headers.host,
                    slug: request.headers["x-tenant-slug"],
                    id: request.headers["x-tenant-id"],
                }),
            );
        });
        await new Promise<void>((resolve) =>
            server.listen(0, "127.0.0.1", resolve),
        );
        const { port } = server.address() as { port: number };
        try {
            const result = await requestRoute(`http://127.0.0.1:${port}`, {
                path: "/booking/home",
                tenant: "booking",
            });
            expect(JSON.parse(result.body)).toEqual({
                host: `booking.localhost:${port}`,
                slug: "booking",
                id: "booking",
            });
        } finally {
            await new Promise<void>((resolve) => server.close(() => resolve()));
        }
    });

    it("fails fast without writing a fixture when the server is unreachable", async () => {
        const port = await unusedPort();
        const fixturesDir = await mkdtemp(path.join(tmpdir(), "parity-fail-"));
        try {
            await expect(
                captureRoutes({
                    baseUrl: `http://127.0.0.1:${port}`,
                    fixturesDir,
                }),
            ).rejects.toThrow(/Failed to capture store \/store/);
            expect(await readdir(fixturesDir)).toEqual([]);
        } finally {
            await rm(fixturesDir, { recursive: true, force: true });
        }
    });
});
