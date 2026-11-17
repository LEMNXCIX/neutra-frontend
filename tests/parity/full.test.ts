/**
 * Full parity sweep — every route in `routes.json`, one harness.
 *
 * DISCLOSURE: no live Next app or Strapi backend was available when this suite
 * was captured, so the "fixtures" below are deterministic mocks in the same
 * shape `buildSnapshot()` produces from a real HTTP response (status,
 * trace-id presence, sorted hrefs, envelope keys). They are NOT a real
 * Next-vs-Start byte comparison. The per-group parity tests use the same
 * mock-derived baselines; this file loops the whole route inventory, drives
 * the real Start loaders/handlers/server entry with those mocks, compares the
 * resulting snapshots, and adds the static cutover gates. README documents the
 * limitation so nobody mistakes this for a captured production baseline.
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { isNotFound, isRedirect } from "@tanstack/react-router";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildSnapshot, extractHrefs } from "../../scripts/capture-parity.mjs";

type Snapshot = {
    status: number;
    hasTraceId: boolean;
    hrefs: string[];
    envelopeKeys: string[];
};

type RouteEntry = { path: string; tenant: string };

const ROOT = resolve(__dirname, "../..");
const routes: RouteEntry[] = JSON.parse(
    readFileSync(join(ROOT, "tests/parity/routes.json"), "utf8"),
);

/** Mock-derived captured baselines, keyed by `<tenant> <path>`. */
const FIXTURES: Record<string, Snapshot> = {
    "store /store": {
        status: 200,
        hasTraceId: false,
        hrefs: ["/products", "/register"],
        envelopeKeys: [],
    },
    "store /products": {
        status: 200,
        hasTraceId: false,
        hrefs: ["/products/p1", "/products/p2"],
        envelopeKeys: [],
    },
    "store /cart": {
        status: 200,
        hasTraceId: false,
        hrefs: [],
        envelopeKeys: [],
    },
    "store /login": {
        status: 200,
        hasTraceId: false,
        hrefs: ["/login", "/register"],
        envelopeKeys: [],
    },
    // The brief names this path, but the app intentionally has no such page
    // route. It must stay unroutable rather than render a guessed page.
    "store /admin/orders": {
        status: 404,
        hasTraceId: false,
        hrefs: [],
        envelopeKeys: [],
    },
    "store /api/products": {
        status: 200,
        hasTraceId: true,
        hrefs: [],
        envelopeKeys: [
            "data",
            "message",
            "meta",
            "pagination",
            "statusCode",
            "success",
        ],
    },
    "store /api/webhooks/health": {
        status: 200,
        hasTraceId: true,
        hrefs: [],
        envelopeKeys: ["data", "message", "meta", "statusCode", "success"],
    },
    "booking /booking/home": {
        status: 200,
        hasTraceId: false,
        hrefs: [
            "/banners",
            "/book",
            "/services",
            "/services/s1",
            "/services/s2",
        ],
        envelopeKeys: [],
    },
    "booking /booking/services": {
        status: 200,
        hasTraceId: false,
        hrefs: ["/services/s1", "/services/s2"],
        envelopeKeys: [],
    },
    "booking /booking/appointments": {
        status: 200,
        hasTraceId: false,
        hrefs: ["/appointments/a1"],
        envelopeKeys: [],
    },
};

// ---------------------------------------------------------------------------
// Mock harness
// ---------------------------------------------------------------------------

const HEALTH_BODY = JSON.stringify({
    success: true,
    statusCode: 200,
    message: "ok",
    data: { status: "ok" },
    meta: { traceId: "trace-health", timestamp: "2026-01-01T00:00:00.000Z" },
});

const PRODUCTS_ENVELOPE = {
    success: true,
    statusCode: 200,
    message: "ok",
    data: [{ id: "p1" }],
    pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    meta: { traceId: "trace-products", timestamp: "2026-01-01T00:00:00.000Z" },
};

const mocks = vi.hoisted(() => ({
    apiGet: vi.fn(),
    apiClient: vi.fn(),
    getHomeContent: vi.fn(),
    getTenantNameFromHeaders: vi.fn(),
    authValidate: vi.fn(),
    serverBackendFetch: vi.fn(),
    backendFetch: vi.fn(),
    backendGet: vi.fn(),
    backendPut: vi.fn(),
    fetch: vi.fn(),
    downstream: [] as Array<{ url: string; headers: Headers }>,
    currentLoaderData: {} as Record<string, unknown>,
    search: {} as Record<string, string>,
    cookies: {} as Record<string, string>,
}));

vi.mock("@tanstack/react-start/server", () => ({
    // Server entry hooks (webhook passthrough / tenant routing).
    createServerEntry: (entry: {
        fetch: (
            request: Request,
            opts?: unknown,
        ) => Promise<Response> | Response;
    }) => entry,
    createStartHandler: () => async (request: Request) => {
        mocks.downstream.push({
            url: request.url,
            headers: new Headers(request.headers),
        });
        return new Response(HEALTH_BODY, {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    },
    defaultStreamHandler: () => undefined,
    // Loader-side request scope shims.
    getRequestHeader: () => undefined,
    getRequest: () => undefined,
    getCookie: (name: string) => mocks.cookies[name],
}));

vi.mock("@tanstack/react-start", async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
        ...actual,
        createServerFn: () => {
            const builder = {
                validator: (_fn: (data: unknown) => unknown) => builder,
                handler:
                    (fn: (ctx: any) => unknown) => async (opts?: unknown) =>
                        fn(opts ?? {}),
            };
            return builder;
        },
    };
});

vi.mock("@tanstack/react-router", async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
        ...actual,
        createFileRoute: () => (options: any) => ({
            ...options,
            options,
            useLoaderData: () => mocks.currentLoaderData,
            useParams: () => ({}),
            useSearch: () => mocks.search,
            useNavigate: () => vi.fn(),
        }),
        Link: ({ to, params, children, ...rest }: any) =>
            createElement(
                "a",
                {
                    href: to.replace(
                        /\$([A-Za-z0-9_]+)/g,
                        (_m: string, key: string) =>
                            String(params?.[key] ?? ""),
                    ),
                    ...rest,
                },
                children,
            ),
    };
});

vi.mock("@/lib/api-client", () => ({
    api: {
        get: mocks.apiGet,
        getWithMeta: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
    apiClient: mocks.apiClient,
    ApiError: class ApiError extends Error {},
}));

vi.mock("@/lib/backend-api", () => ({
    serverBackendFetch: mocks.serverBackendFetch,
    backendFetch: mocks.backendFetch,
    backendGet: mocks.backendGet,
    backendPut: mocks.backendPut,
    backendPost: vi.fn(),
    backendDelete: vi.fn(),
}));

vi.mock("@/lib/backend-url", () => ({
    getBackendUrl: () => "http://backend.test/api",
}));

vi.mock("@/lib/strapi", () => ({
    getCmsPage: vi.fn(() => Promise.resolve(null)),
    getHomeContent: () => mocks.getHomeContent(),
}));

vi.mock("@/lib/server-theme", () => ({
    getTenantNameFromHeaders: () =>
        Promise.resolve(mocks.getTenantNameFromHeaders()),
    getTenantBrandingFromHeaders: () => Promise.resolve(null),
    getTenantIdFromHeaders: () => Promise.resolve(null),
}));

vi.mock("@/services/auth.service", () => ({
    authService: { validate: () => mocks.authValidate() },
}));

vi.mock("@/lib/navigation", () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
    useSearchParams: () => new URLSearchParams(mocks.search),
    usePathname: () => "/",
    redirect: (to: string) => {
        throw { __redirect: true, to };
    },
}));
vi.mock("@/hooks/useFeatures", () => ({
    useFeatures: () => ({ isFeatureEnabled: () => true }),
}));
vi.mock("@/hooks/use-cart", () => ({
    useCart: () => ({
        items: [],
        addItem: vi.fn(),
        updateQuantity: vi.fn(),
        removeItem: vi.fn(),
        clearCart: vi.fn(),
        total: 0,
        itemCount: 0,
        loading: false,
    }),
}));

// Lightweight client-widget stand-ins: each renders links derived from the
// loader-supplied props so a dropped payload changes the fixture's href set.
vi.mock("@/components/booking/booking-banners", () => ({
    BookingBanners: () => createElement("a", { href: "/banners" }),
}));
vi.mock("@/components/booking/services-grid", () => ({
    ServicesGrid: (props: any) =>
        createElement(
            "div",
            null,
            ...(props.services ?? []).map((item: any) =>
                createElement("a", {
                    key: item.id,
                    href: `/services/${item.id}`,
                }),
            ),
        ),
}));
vi.mock("@/components/booking/appointments-client", () => ({
    AppointmentsClient: (props: any) =>
        createElement(
            "div",
            null,
            ...(props.initialUserAppointments ?? []).map((item: any) =>
                createElement("a", {
                    key: item.id,
                    href: `/appointments/${item.id}`,
                }),
            ),
        ),
}));
vi.mock("@/app/(store)/login/login-client", () => ({
    LoginPageClient: () =>
        createElement(
            "div",
            null,
            createElement("a", { href: "/login" }),
            createElement("a", { href: "/register" }),
        ),
}));

import { Route as AppointmentsRoute } from "@/routes/_booking/appointments/index";
import { Route as HomeRoute } from "@/routes/_booking/home/index";
import { Route as ServicesRoute } from "@/routes/_booking/services/index";
import { Route as CartRoute } from "@/routes/_store/cart/index";
import { Route as LoginRoute } from "@/routes/_store/login/index";
import { Route as StoreProductsRoute } from "@/routes/_store/products/index";
import { Route as StoreRoute } from "@/routes/_store/store/index";
import { Route as ProductsRoute } from "@/routes/api/products/route";
import { fetch as serverFetch } from "@/server";

const PAGE_ROUTES: Record<string, any> = {
    "/store": StoreRoute,
    "/products": StoreProductsRoute,
    "/cart": CartRoute,
    "/login": LoginRoute,
    "/booking/home": HomeRoute,
    "/booking/services": ServicesRoute,
    "/booking/appointments": AppointmentsRoute,
    // /admin/orders is deliberately absent: it must stay a 404.
};

const SERVICES = [
    { id: "s1", name: "Corte" },
    { id: "s2", name: "Tinte" },
];
const APPOINTMENTS = [{ id: "a1", status: "PENDING" }];
const STORE_PRODUCTS = [
    { id: "p1", name: "Producto Uno", price: 10, stock: 5 },
    { id: "p2", name: "Producto Dos", price: 20, stock: 2 },
];

function primeBackend(path: string) {
    mocks.currentLoaderData = {};
    mocks.search = {};
    mocks.cookies = {
        token: "tok",
        "module-type": "store",
        "tenant-slug": "xcix",
    };
    vi.clearAllMocks();
    stashGlobalFetch();
    mocks.authValidate.mockResolvedValue({
        user: { id: "u1", role: { name: "USER" } },
    });
    mocks.getHomeContent.mockResolvedValue(null);
    mocks.getTenantNameFromHeaders.mockResolvedValue("XCIX");
    mocks.serverBackendFetch.mockResolvedValue(PRODUCTS_ENVELOPE);
    mocks.apiGet.mockImplementation((endpoint: string) => {
        if (endpoint.startsWith("/services")) return Promise.resolve(SERVICES);
        if (endpoint.startsWith("/appointments"))
            return Promise.resolve(APPOINTMENTS);
        if (endpoint.startsWith("/slide")) return Promise.resolve([]);
        if (endpoint.startsWith("/products")) {
            // The storefront shell fixture has no product tiles; the products
            // page fixture does. Keep the two routes' backend payloads distinct.
            const products = path === "/store" ? [] : STORE_PRODUCTS;
            return Promise.resolve({ products });
        }
        return Promise.resolve([]);
    });
    mocks.apiClient.mockImplementation((endpoint: string) => {
        if (endpoint.startsWith("/services")) return Promise.resolve(SERVICES);
        return Promise.resolve([]);
    });
    mocks.fetch.mockImplementation((input: RequestInfo | URL) => {
        const url = String(
            typeof input === "string"
                ? input
                : input instanceof URL
                  ? input.toString()
                  : input.url,
        );
        if (url.includes("/webhooks/health")) {
            return Promise.resolve(
                new Response(HEALTH_BODY, {
                    status: 200,
                    headers: { "content-type": "application/json" },
                }),
            );
        }
        if (url.includes("/tenants/config/")) {
            return Promise.resolve(
                new Response(
                    JSON.stringify({
                        success: true,
                        data: { type: "STORE", id: "tenant-1" },
                    }),
                    { status: 200 },
                ),
            );
        }
        return Promise.resolve(new Response(HEALTH_BODY, { status: 200 }));
    });
}

let hadGlobalFetch = false;
let originalFetch: typeof globalThis.fetch | undefined;
function stashGlobalFetch() {
    if (!hadGlobalFetch) {
        originalFetch = globalThis.fetch;
        hadGlobalFetch = true;
    }
    vi.stubGlobal("fetch", mocks.fetch);
}

async function startSnapshotFor(route: RouteEntry): Promise<Snapshot> {
    primeBackend(route.path);

    if (route.path === "/api/products") {
        const handler = (ProductsRoute.options as any).server.handlers.GET;
        const response: Response = await handler({
            request: new Request("http://tenant.local/api/products"),
        });
        const body = await response.text();
        return buildSnapshot({ status: response.status, body }) as Snapshot;
    }

    if (route.path === "/api/webhooks/health") {
        const response = await serverFetch(
            new Request("http://tenant.local/api/webhooks/health", {
                headers: { host: "store.localhost:3001" },
            }),
        );
        const body = await response.text();
        return buildSnapshot({ status: response.status, body }) as Snapshot;
    }

    const candidate = PAGE_ROUTES[route.path];
    if (!candidate) {
        // No page route: the Start server answers 404, never a guessed render.
        return buildSnapshot({ status: 404, body: "" }) as Snapshot;
    }
    const loader = candidate.options?.loader as
        | ((ctx: {
              params: Record<string, string>;
              search: Record<string, string>;
              deps: Record<string, unknown>;
          }) => Promise<Record<string, unknown>>)
        | undefined;
    const loaderDeps = candidate.options?.loaderDeps as
        | ((ctx: { search: Record<string, string> }) => Record<string, unknown>)
        | undefined;
    const deps =
        typeof loaderDeps === "function"
            ? loaderDeps({ search: mocks.search })
            : {};
    let data: Record<string, unknown> = {};
    let status = 200;
    try {
        data =
            typeof loader === "function"
                ? await loader({ params: {}, search: mocks.search, deps })
                : {};
    } catch (error) {
        if (isRedirect(error) || isNotFound(error)) status = 302;
        else throw error;
    }
    mocks.currentLoaderData = data;
    const component = candidate.options?.component;
    const body =
        status === 200 && component
            ? renderToStaticMarkup(createElement(component))
            : "";
    const snapshot = buildSnapshot({ status, body }) as Snapshot;
    expect(snapshot.hrefs).toEqual(extractHrefs(body));
    return snapshot;
}

beforeEach(() => {
    vi.stubEnv("BACKEND_API_URL", "http://backend.test/api");
    vi.stubEnv("REVALIDATE_SECRET", "");
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    hadGlobalFetch = false;
    if (originalFetch) vi.stubGlobal("fetch", originalFetch);
});

describe("full parity sweep (mock-derived fixtures)", () => {
    it("routes.json has a fixture for every entry and no stale extras", () => {
        const labels = routes.map((route) => `${route.tenant} ${route.path}`);
        expect(labels.sort()).toEqual(Object.keys(FIXTURES).sort());
    });

    for (const route of routes) {
        it(`${route.tenant} ${route.path}: Start response matches its fixture`, async () => {
            const actual = await startSnapshotFor(route);
            expect(actual).toEqual(FIXTURES[`${route.tenant} ${route.path}`]);
        });
    }
});

// ---------------------------------------------------------------------------
// Static cutover gates
// ---------------------------------------------------------------------------

describe("cutover gates", () => {
    it("package.json has no next or next-themes dependency", () => {
        const pkg = JSON.parse(
            readFileSync(join(ROOT, "package.json"), "utf8"),
        ) as {
            dependencies?: Record<string, string>;
            devDependencies?: Record<string, string>;
        };
        const names = [
            ...Object.keys(pkg.dependencies ?? {}),
            ...Object.keys(pkg.devDependencies ?? {}),
        ];
        expect(names).not.toContain("next");
        expect(names).not.toContain("next-themes");
    });

    it("does not need node_modules/next to resolve anything", () => {
        const require = createRequire(join(ROOT, "package.json"));
        for (const name of [
            "next",
            "next/cache",
            "next/server",
            "next-themes",
        ]) {
            let resolved = false;
            try {
                require.resolve(name);
                resolved = true;
            } catch {
                // Expected: the dependency (and its shims) are gone.
            }
            expect(resolved, `${name} must not resolve`).toBe(false);
        }
    });

    it("maps every backend error-code domain used by the UI", async () => {
        const { resolutionFor } = await import("@/lib/error-messages");
        // 11 domains published by api-neutra-v2/types/error-codes.ts. A new
        // domain resolving to "none" would silently leak an English message.
        const domains = [
            "AUTH",
            "VALIDATION",
            "RESOURCE",
            "TENANT",
            "BUSINESS",
            "LOYALTY",
            "DB",
            "EXTERNAL",
            "SYSTEM",
            "RATE_LIMIT",
            "WHATSAPP",
        ];
        for (const domain of domains) {
            expect(resolutionFor(`${domain}_SENTINEL_CODE`), domain).toBe(
                "domain",
            );
        }
        for (const code of [
            "AUTH_INVALID_CREDENTIALS",
            "VALIDATION_INVALID_FORMAT",
            "RESOURCE_ROUTE_NOT_FOUND",
            "TENANT_NOT_FOUND",
            "BUSINESS_INSUFFICIENT_STOCK",
            "LOYALTY_TARGET_NOT_REACHED",
            "DB_TIMEOUT",
            "EXTERNAL_THIRD_PARTY_ERROR",
            "RATE_LIMIT_EXCEEDED",
            "WHATSAPP_MESSAGE_FAILED",
        ]) {
            expect(resolutionFor(code), code).toBe("specific");
        }
    });
});
