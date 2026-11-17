import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../../..");
const MANIFEST_PATH = join(ROOT, "scripts/page-routes.json");
const ROUTES_DIR = join(ROOT, "src/routes");

type PageRoute = {
    /** Original App Router page file, kept so the mapping stays auditable. */
    source: string;
    /** Pathless layout route that owns the page, or null for top-level pages. */
    layout: string | null;
    /** Public App Router URL (route groups dropped, dynamic segments as [id]). */
    url: string;
    /** TanStack Router file-route id (pathless prefix, dynamic $id, trailing /). */
    routePath: string;
    /** Literal title recorded from metadata / generateMetadata / layout. */
    title: string;
    /** Literal description used by the route head. */
    description: string;
};

const readManifest = (): PageRoute[] => {
    if (!existsSync(MANIFEST_PATH)) return [];
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as PageRoute[];
};

/** Derive the public URL from the original page path, independently of the
 *  manifest's own `url` field (route groups are Next-only artefacts). */
const urlFromSource = (source: string): string => {
    const segments = source
        .replace(/^src\/app\//, "")
        .split("/")
        .filter((segment) => segment && !/^\(.*\)$/.test(segment));
    segments.pop(); // page.tsx
    return `/${segments.join("/")}`;
};

const tanStackPath = (url: string): string =>
    url
        .split("/")
        .filter(Boolean)
        .map((segment) =>
            /^\[(.+)\]$/.test(segment) ? `$${segment.slice(1, -1)}` : segment,
        )
        .join("/");

/** The `createFileRoute` id TanStack generates from a page's file location:
 *  pathless layout prefix + URL segments, trailing slash on index routes. */
const routeId = (entry: Pick<PageRoute, "layout" | "url">): string => {
    const segments = [
        ...(entry.layout ? [entry.layout] : []),
        ...tanStackPath(entry.url).split("/").filter(Boolean),
    ];
    return segments.length ? `/${segments.join("/")}/` : "/";
};

const expectedFile = (entry: PageRoute): string =>
    join(ROUTES_DIR, ...routeId(entry).split("/").filter(Boolean), "index.tsx");

function walk(dir: string): string[] {
    if (!existsSync(dir)) return [];
    return readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry);
        return statSync(full).isDirectory() ? walk(full) : [full];
    });
}

/** Page shells only — API routes, the root route and pathless layouts are
 *  covered by their own tests/inventory. */
const pageShellFiles = (): string[] =>
    walk(ROUTES_DIR).filter(
        (file) =>
            file.endsWith(`${sep}index.tsx`) &&
            !file.includes(`${sep}api${sep}`) &&
            !file.includes(`${sep}__tests__${sep}`),
    );

/** Read the title/description literally from the `head` option, the same way
 *  a reviewer would, so a missing or renamed head cannot pass the test. CMS-driven
 *  pages (ported in Task 8) keep the manifest literal as a `??` fallback, so the
 *  head may take a `({ loaderData })` parameter and the literal may be the
 *  fallback of a dynamic expression. */
const readHead = (source: string): { title?: string; description?: string } => {
    const head = source.match(
        /head:\s*(?:async\s*)?\([^)]*\)\s*=>\s*\(\{([\s\S]*?)\n\s{4}\}\),/,
    );
    if (!head) return {};
    const title = head[1].match(
        /title:\s*(?:"((?:[^"\\]|\\.)*)"|[^,\n]*\?\?\s*"((?:[^"\\]|\\.)*)")/,
    );
    const description = head[1].match(
        /name:\s*"description",\s*content:\s*(?:"((?:[^"\\]|\\.)*)"|[\s\S]*?\?\?\s*"((?:[^"\\]|\\.)*)")/,
    );
    const literal = (match: RegExpMatchArray | null): string | undefined => {
        if (!match) return undefined;
        const value = match[1] ?? match[2];
        return value === undefined
            ? undefined
            : (JSON.parse(`"${value}"`) as string);
    };
    return {
        title: literal(title),
        description: literal(description),
    };
};

describe("generated page route tree", () => {
    it("records all 68 original pages in the manifest", () => {
        expect(readManifest()).toHaveLength(68);
    });

    it("records each page's public URL and pathless layout correctly", () => {
        for (const entry of readManifest()) {
            expect(urlFromSource(entry.source), entry.source).toBe(entry.url);
            expect(entry.routePath, entry.source).toBe(routeId(entry));
            expect(entry.title, entry.source).toBeTruthy();
        }
    });

    it("generates exactly 68 page shell files", () => {
        expect(pageShellFiles()).toHaveLength(68);
    });

    it("maps every manifest entry to an existing index.tsx at the same URL", () => {
        for (const entry of readManifest()) {
            expect(existsSync(expectedFile(entry)), entry.source).toBe(true);
        }
    });

    it("exports a Route with the matching file-route path and head metadata", () => {
        for (const entry of readManifest()) {
            const source = readFileSync(expectedFile(entry), "utf8");
            const match = source.match(
                /createFileRoute\(\s*["']([^"']+)["']\s*,?\s*\)/,
            );
            expect(match?.[1], entry.source).toBe(entry.routePath);
            expect(source, entry.source).toMatch(/export const Route = /);
            expect(source, entry.source).toMatch(/head:\s*\([^)]*\)\s*=>/);

            const head = readHead(source);
            expect(head.title, entry.source).toBe(entry.title);
            expect(head.description, entry.source).toBe(entry.description);
        }
    });

    it("uses TanStack $params and never imports next/* in generated routes", () => {
        for (const file of pageShellFiles()) {
            const source = readFileSync(file, "utf8");
            expect(file.includes("[")).toBe(false);
            expect(source).not.toMatch(/from\s+["']next\//);
        }
    });

    it("creates the five pathless layout routes", () => {
        for (const layout of [
            "_store",
            "_booking",
            "_admin",
            "_storeAdmin",
            "_bookingAdmin",
        ]) {
            const file = join(ROUTES_DIR, `${layout}.tsx`);
            expect(existsSync(file), layout).toBe(true);
            const source = readFileSync(file, "utf8");
            expect(source, layout).toContain(`createFileRoute("/${layout}")`);
            expect(source, layout).not.toMatch(/from\s+["']next\//);
            expect(source, layout).toMatch(/<Outlet\s*\/>/);
        }
    });
});
