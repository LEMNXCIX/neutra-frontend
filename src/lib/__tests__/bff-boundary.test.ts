/**
 * Boundary guards for the BFF.
 *
 * These fail the build when a route or the proxy reintroduces a backend address
 * of its own. The regression they guard is concrete: 29 route handlers used to
 * read NEXT_PUBLIC_API_URL with a hardcoded localhost fallback, so a deployment
 * that set only BACKEND_API_URL silently talked to the wrong host.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const SRC = resolve(__dirname, "../..");
const API_DIR = join(SRC, "app/api");

const collectRouteFiles = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) return collectRouteFiles(full);
        return entry === "route.ts" ? [full] : [];
    });

const FORBIDDEN: Array<[RegExp, string]> = [
    [/NEXT_PUBLIC_API_URL/, "NEXT_PUBLIC_API_URL"],
    [/localhost:4001/, "a hardcoded localhost:4001 backend address"],
    [/127\.0\.0\.1:4001/, "a hardcoded 127.0.0.1:4001 backend address"],
];

describe("BFF backend address boundary", () => {
    const routeFiles = collectRouteFiles(API_DIR);

    it("finds the route handlers it is meant to guard", () => {
        expect(routeFiles.length).toBeGreaterThan(50);
    });

    it.each(routeFiles)(
        "%s resolves the backend through getBackendUrl",
        (file) => {
            const source = readFileSync(file, "utf8");
            for (const [pattern, label] of FORBIDDEN) {
                expect(
                    pattern.test(source),
                    `${relative(SRC, file)} references ${label}. Use getBackendUrl() from @/lib/backend-url instead.`,
                ).toBe(false);
            }
        },
    );

    it("src/proxy.ts resolves the backend through getBackendUrl", () => {
        const source = readFileSync(join(SRC, "proxy.ts"), "utf8");
        for (const [pattern, label] of FORBIDDEN) {
            expect(
                pattern.test(source),
                `src/proxy.ts references ${label}. Use getBackendUrl() from @/lib/backend-url instead.`,
            ).toBe(false);
        }
    });

    it("server-side modules no longer read a browser-facing backend URL", () => {
        const serverModules = [
            "lib/backend-api.ts",
            "lib/server-auth.ts",
            "lib/api-client.ts",
            "services/tenant.service.ts",
            "services/auth.service.ts",
        ];

        for (const modulePath of serverModules) {
            const source = readFileSync(join(SRC, modulePath), "utf8");
            expect(
                /process\.env\.NEXT_PUBLIC_API_URL/.test(source),
                `${modulePath} still reads NEXT_PUBLIC_API_URL on the server.`,
            ).toBe(false);
        }
    });
});
