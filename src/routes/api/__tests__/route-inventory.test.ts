import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../../../..");
const MANIFEST_PATH = join(ROOT, "scripts/api-routes.json");
const GENERATED_API_DIR = join(ROOT, "src/routes/api");
const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;

type RouteEntry = { path: string; methods: string[] };

/** A path+method tuple is the unit of parity the inventory guards. Dynamic
 *  segments are normalised to TanStack's `$param` form on both sides. */
type RouteKey = string;

const key = (method: string, path: string): RouteKey => `${method} ${path}`;

function walk(dir: string): string[] {
    if (!existsSync(dir)) return [];
    return readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry);
        return statSync(full).isDirectory() ? walk(full) : [full];
    });
}

function readManifest(): RouteEntry[] {
    if (!existsSync(MANIFEST_PATH)) return [];
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as RouteEntry[];
}

function manifestKeys(): Set<RouteKey> {
    const keys = new Set<RouteKey>();
    for (const entry of readManifest()) {
        for (const method of entry.methods) keys.add(key(method, entry.path));
    }
    return keys;
}

/** Read the generated route files the same way a reviewer would: parse the
 *  `createFileRoute('/api/...')` path and the method names under server.handlers. */
function generatedFiles(): string[] {
    return walk(GENERATED_API_DIR).filter(
        (file) => file.endsWith("route.ts") && !file.includes("__tests__"),
    );
}

function generatedKeys(): Set<RouteKey> {
    const keys = new Set<RouteKey>();
    for (const file of generatedFiles()) {
        const source = readFileSync(file, "utf8");
        const match = source.match(
            /createFileRoute\(\s*["']([^"']+)["']\s*,?\s*\)/,
        );
        if (!match) continue;
        const path = match[1];
        for (const method of METHODS) {
            const handler = new RegExp(`(?:^|\\n)\\s*${method}\\s*:`, "m");
            if (handler.test(source)) keys.add(key(method, path));
        }
    }
    return keys;
}

describe("generated API route inventory", () => {
    it("generates exactly 75 route files", () => {
        expect(generatedFiles()).toHaveLength(75);
    });

    it("records exactly 75 original routes in the manifest", () => {
        expect(readManifest()).toHaveLength(75);
    });

    it("matches the original path+method set exactly", () => {
        const expected = manifestKeys();
        const actual = generatedKeys();
        expect(expected.size).toBeGreaterThan(75);
        expect([...actual].sort()).toEqual([...expected].sort());
    });

    it("uses TanStack $param files, never Next [param] folders", () => {
        const offenders = generatedFiles().filter((file) => file.includes("["));
        expect(offenders).toEqual([]);
    });

    it("every generated file exports a file route with server handlers", () => {
        for (const file of generatedFiles()) {
            const source = readFileSync(file, "utf8");
            expect(source).toMatch(/export const Route = createFileRoute\(/);
            expect(source).toMatch(/server:\s*\{/);
            expect(source).toMatch(/handlers:\s*\{/);
        }
    });
});
