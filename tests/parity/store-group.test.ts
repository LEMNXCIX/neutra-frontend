/**
 * Parity for the ported `(store)` route group.
 *
 * Live fixture capture is deferred to Task 14, so the "captured fixtures"
 * below are deterministic mocks in the same shape `buildSnapshot()` produces
 * from a real response: `status`, `envelopeKeys` and a sorted link set
 * (`hrefs`). Each case drives the route's real loader with mocked backend data
 * and renders the route component, then compares the rendered snapshot with
 * the fixture. Tenant is `store` for every case.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildSnapshot, extractHrefs } from "../../scripts/capture-parity.mjs";

type Snapshot = {
    status: number;
    hasTraceId: boolean;
    hrefs: string[];
    envelopeKeys: string[];
};

type Fixture = {
    status: number;
    envelopeKeys: string[];
    hrefs: string[];
};

const mocks = vi.hoisted(() => ({
    cmsPages: {} as Record<string, any>,
    homeContent: null as any,
    tenantName: "XCIX" as string | null,
    apiGet: vi.fn(),
    getCmsPage: vi.fn(),
    getHomeContent: vi.fn(),
    getTenantNameFromHeaders: vi.fn(),
    currentLoaderData: {} as Record<string, unknown>,
    validator: undefined as ((data: unknown) => unknown) | undefined,
}));

// Server-only helpers are reached through the loader's dynamic imports.
vi.mock("@/lib/strapi", () => ({
    getCmsPage: (name: string) => mocks.getCmsPage(name),
    getHomeContent: () => mocks.getHomeContent(),
}));

vi.mock("@/lib/server-theme", () => ({
    getTenantNameFromHeaders: () => Promise.resolve(mocks.tenantName),
    getTenantBrandingFromHeaders: () => Promise.resolve(null),
    getTenantIdFromHeaders: () => Promise.resolve(null),
}));

vi.mock("@/lib/api-client", () => ({
    api: {
        get: mocks.apiGet,
        getWithMeta: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
    apiClient: vi.fn(),
    ApiError: class ApiError extends Error {},
}));

vi.mock("@tanstack/react-start/server", () => ({
    getRequestHeader: () => undefined,
    getRequest: () => undefined,
    getCookie: () => undefined,
}));

// createServerFn cannot run without Start's server runtime; in tests its
// handler is a plain async function so loaders can be exercised directly.
vi.mock("@tanstack/react-start", async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
        ...actual,
        createServerFn: () => {
            const builder = {
                validator: (fn: (data: unknown) => unknown) => {
                    mocks.validator = fn;
                    return builder;
                },
                handler: (fn: (ctx: any) => unknown) => async (opts?: unknown) =>
                    fn(opts ?? {}),
            };
            return builder;
        },
    };
});

// Give every shell a route object whose useLoaderData() returns the data we
// just loaded, so the real route component can render in isolation.
vi.mock("@tanstack/react-router", async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
        ...actual,
        createFileRoute: () => (options: any) => ({
            ...options,
            options,
            useLoaderData: () => mocks.currentLoaderData,
            useParams: () => ({}),
            useSearch: () => ({}),
            useNavigate: () => vi.fn(),
        }),
        Link: ({ to, children, ...rest }: any) =>
            createElement("a", { href: to, ...rest }, children),
    };
});

// Next shims so the reused client components render under plain React.
vi.mock("next/link", () => ({
    default: ({ href, children, ...rest }: any) =>
        createElement("a", { href, ...rest }, children),
}));
vi.mock("next/image", () => ({
    default: (props: any) => createElement("img", props),
}));
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => "/",
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

import { Route as CartRoute } from "@/routes/_store/cart/index";
import { Route as ContactRoute } from "@/routes/_store/contact/index";
import { Route as FaqRoute } from "@/routes/_store/faq/index";
import { Route as ProductsRoute } from "@/routes/_store/products/index";
import { Route as StoreRoute } from "@/routes/_store/store/index";

const ROUTES: Record<string, any> = {
    "/store": StoreRoute,
    "/products": ProductsRoute,
    "/cart": CartRoute,
    "/contact": ContactRoute,
    "/faq": FaqRoute,
};

// Mock-only "captured" fixtures (authoritative live capture: Task 14).
const FIXTURES: Record<string, Fixture> = {
    "/store": {
        status: 200,
        envelopeKeys: [],
        hrefs: ["/products", "/register"],
    },
    "/products": {
        status: 200,
        envelopeKeys: [],
        hrefs: ["/products/p1", "/products/p2"],
    },
    "/cart": { status: 200, envelopeKeys: [], hrefs: [] },
    "/contact": { status: 200, envelopeKeys: [], hrefs: [] },
    "/faq": { status: 200, envelopeKeys: [], hrefs: ["/contact"] },
};

function primeBackend(path: string) {
    mocks.cmsPages = {};
    mocks.homeContent = null;
    mocks.tenantName = "XCIX";
    mocks.apiGet.mockReset();
    mocks.getCmsPage.mockReset();
    mocks.getHomeContent.mockReset();
    mocks.getCmsPage.mockImplementation((name: string) =>
        Promise.resolve(mocks.cmsPages[name] ?? null),
    );
    mocks.getHomeContent.mockImplementation(() =>
        Promise.resolve(mocks.homeContent),
    );

    if (path === "/store") {
        mocks.apiGet.mockImplementation((endpoint: string) => {
            if (endpoint.includes("/slide")) return Promise.resolve([]);
            if (endpoint.startsWith("/products"))
                return Promise.resolve({ products: [] });
            return Promise.resolve([]);
        });
    } else if (path === "/products") {
        mocks.apiGet.mockImplementation((endpoint: string) => {
            if (endpoint.includes("/categories")) return Promise.resolve([]);
            return Promise.resolve({
                products: [
                    {
                        id: "p1",
                        name: "Producto Uno",
                        price: 10,
                        stock: 5,
                    },
                    {
                        id: "p2",
                        name: "Producto Dos",
                        price: 20,
                        stock: 2,
                    },
                ],
            });
        });
    } else if (path === "/contact") {
        mocks.cmsPages["contact-pages"] = {
            title: "Contacto",
            subtitle: "Ponete en contacto con nuestro equipo",
        };
    } else if (path === "/faq") {
        mocks.cmsPages["faq-pages"] = {
            title: "Preguntas Frecuentes",
            subtitle: "Preguntas y respuestas frecuentes",
            faqs: [{ question: "Q?", answer: "A." }],
        };
    }
}

async function snapshotFor(path: string): Promise<Snapshot> {
    primeBackend(path);
    const route = ROUTES[path];
    const loader = route?.options?.loader;
    mocks.currentLoaderData =
        typeof loader === "function" ? await loader({ params: {} }) : {};
    const component = route?.options?.component;
    const body = component
        ? renderToStaticMarkup(createElement(component))
        : "";
    const snapshot = buildSnapshot({ status: 200, body }) as Snapshot;
    // Guard the helper itself: the sorted link set must match extractHrefs().
    expect(snapshot.hrefs).toEqual(extractHrefs(body));
    return snapshot;
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("store group route parity (mock fixtures, tenant=store)", () => {
    for (const path of Object.keys(FIXTURES)) {
        it(`renders ${path} with the fixture's status, envelope keys and links`, async () => {
            const snapshot = await snapshotFor(path);
            const fixture = FIXTURES[path];

            expect(snapshot.status).toBe(fixture.status);
            expect(snapshot.envelopeKeys).toEqual(fixture.envelopeKeys);
            expect(snapshot.hrefs).toEqual(fixture.hrefs);
        });
    }

    it("loads storefront data through the loader, not the component", async () => {
        await snapshotFor("/store");
        expect(mocks.apiGet).toHaveBeenCalledWith(
            expect.stringContaining("/slide"),
        );
        expect(mocks.apiGet).toHaveBeenCalledWith("/products");
        expect(mocks.getCmsPage).not.toHaveBeenCalled();
    });

    it("loads CMS content through the loader for static pages", async () => {
        await snapshotFor("/faq");
        expect(mocks.getCmsPage).toHaveBeenCalledWith("faq-pages");
    });
});
