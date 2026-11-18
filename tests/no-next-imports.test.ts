/**
 * Zero-Next gate for the TanStack Start rewrite.
 *
 * Every runtime import of `next/*` (and the `next-themes` package) must be gone
 * from `src/**`, the dependency must be removed from package.json, the Next
 * config/type shims must be deleted and the public scripts must run the Start
 * stack. This is the final acceptance gate for Task 10.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "..");
const SRC = join(ROOT, "src");

const NEXT_IMPORT =
    /\bfrom\s*["']next(?:\/[^"']*)?["']|\brequire\(\s*["']next(?:\/[^"']*)?["']\s*\)|\bimport\s*\(\s*["']next(?:\/[^"']*)?["']\s*\)/;

function walk(dir: string): string[] {
    if (!existsSync(dir)) return [];
    return readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry);
        return statSync(full).isDirectory() ? walk(full) : [full];
    });
}

const sourceFiles = (): string[] =>
    walk(SRC).filter((file) => /\.(ts|tsx|js|jsx)$/.test(file));

describe("zero-Next gate", () => {
    it("has no next/* or next-themes imports anywhere under src/**", () => {
        const offenders = sourceFiles().filter((file) =>
            NEXT_IMPORT.test(readFileSync(file, "utf8")),
        );
        expect(
            offenders.map((file) => relative(ROOT, file)),
            "replace next/* consumers with TanStack Start primitives",
        ).toEqual([]);
    });

    it("does not depend on next or next-themes", () => {
        const pkg = JSON.parse(
            readFileSync(join(ROOT, "package.json"), "utf8"),
        ) as {
            dependencies?: Record<string, string>;
            devDependencies?: Record<string, string>;
        };
        const installed = {
            ...pkg.dependencies,
            ...pkg.devDependencies,
        };
        expect(Object.keys(installed)).not.toContain("next");
        expect(Object.keys(installed)).not.toContain("next-themes");
    });

    it("runs the Start stack from dev, build and start", () => {
        const pkg = JSON.parse(
            readFileSync(join(ROOT, "package.json"), "utf8"),
        ) as { scripts: Record<string, string> };
        for (const name of ["dev", "build", "start"]) {
            expect(pkg.scripts[name], `${name} script`).toBeDefined();
            expect(pkg.scripts[name], `${name} script`).not.toMatch(/next/);
        }
        expect(pkg.scripts.dev).toMatch(/vite dev/);
        expect(pkg.scripts.build).toMatch(/vite build/);
        expect(pkg.scripts.start).toMatch(/serve-start/);
    });

    it("has no Next config, Next type shims or .next artifacts", () => {
        expect(existsSync(join(ROOT, "next.config.ts"))).toBe(false);
        expect(existsSync(join(ROOT, "next-env.d.ts"))).toBe(false);
        const artifacts = readdirSync(ROOT).filter((entry) =>
            /^\.next/.test(entry),
        );
        expect(artifacts).toEqual([]);
    });
});
