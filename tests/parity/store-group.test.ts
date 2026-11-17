/**
 * Parity for the ported `(store)` route group.
 *
 * Live fixture capture is deferred to Task 14, so the "captured fixtures"
 * below are deterministic mocks in the same shape `buildSnapshot()` produces
 * from a real response: `status`, `envelopeKeys` and a sorted link set
 * (`hrefs`). Each case drives the route's real loader with mocked backend data
 * and renders the route component, then compares the rendered snapshot with
 * the fixture. Tenant is `store` for every case.
 *
 * `status` is not hardcoded per fixture: it is derived from the loader outcome,
 * including a real 404 thrown by the order loader through `notFound()`.
 */
import { isNotFound } from "@tanstack/react-router";
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

type ParityCase = {
    label: string;
    route: keyof typeof ROUTES;
    search?: Record<string, string>;
    params?: Record<string, string>;
    fixture: Fixture;
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
    // Both the TanStack search contract and the reused client's
    // next/navigation useSearchParams() read these per-case values.
    searchParams: new URLSearchParams(),
    search: {} as Record<string, string>,
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
                handler:
                    (fn: (ctx: any) => unknown) => async (opts?: unknown) =>
                        fn(opts ?? {}),
            };
            return builder;
        },
    };
});

// Give every shell a route object whose useLoaderData() returns the data we
// just loaded, so the real route component can render in isolation. isNotFound
// stays real (spread from the actual module) so a loader-thrown 404 is detected.
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
    useSearchParams: () => mocks.searchParams,
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
import { Route as OrderRoute } from "@/routes/_store/orders/$id/index";
import { Route as ProductsRoute } from "@/routes/_store/products/index";
import { Route as StoreRoute } from "@/routes/_store/store/index";

const ROUTES = {
    "/store": StoreRoute,
    "/products": ProductsRoute,
    "/cart": CartRoute,
    "/contact": ContactRoute,
    "/faq": FaqRoute,
    "/orders/$id": OrderRoute,
};

const STORE_CASE: ParityCase = {
    label: "/store",
    route: "/store",
    fixture: {
        status: 200,
        envelopeKeys: [],
        hrefs: ["/products", "/register"],
    },
};
const PRODUCTS_CASE: ParityCase = {
    label: "/products",
    route: "/products",
    fixture: {
        status: 200,
        envelopeKeys: [],
        hrefs: ["/products/p1", "/products/p2"],
    },
};
const FILTERED_PRODUCTS_CASE: ParityCase = {
    label: "/products?search=silla&category=cat1",
    route: "/products",
    search: { search: "silla", category: "cat1" },
    fixture: { status: 200, envelopeKeys: [], hrefs: ["/products/p3"] },
};
const CART_CASE: ParityCase = {
    label: "/cart",
    route: "/cart",
    fixture: { status: 200, envelopeKeys: [], hrefs: [] },
};
const CONTACT_CASE: ParityCase = {
    label: "/contact",
    route: "/contact",
    fixture: { status: 200, envelopeKeys: [], hrefs: [] },
};
const FAQ_CASE: ParityCase = {
    label: "/faq",
    route: "/faq",
    fixture: { status: 200, envelopeKeys: [], hrefs: ["/contact"] },
};
// Non-200 fixture: the real order loader throws notFound() for a missing id.
const MISSING_ORDER_CASE: ParityCase = {
    label: "/orders/missing",
    route: "/orders/$id",
    params: { id: "missing" },
    fixture: { status: 404, envelopeKeys: [], hrefs: [] },
};

const CASES: ParityCase[] = [
    STORE_CASE,
    PRODUCTS_CASE,
    FILTERED_PRODUCTS_CASE,
    CART_CASE,
    CONTACT_CASE,
    FAQ_CASE,
    MISSING_ORDER_CASE,
];

const PRODUCTS = [
    { id: "p1", name: "Producto Uno", price: 10, stock: 5 },
    { id: "p2", name: "Producto Dos", price: 20, stock: 2 },
];
const FILTERED_PRODUCTS = [
    { id: "p3", name: "Silla Filtrada", price: 30, stock: 1 },
];

function primeBackend(route: string, search?: Record<string, string>) {
    mocks.cmsPages = {};
    mocks.homeContent = null;
    mocks.tenantName = "XCIX";
    mocks.searchParams = new URLSearchParams(search);
    mocks.search = search ? { ...search } : {};
    mocks.apiGet.mockReset();
    mocks.getCmsPage.mockReset();
    mocks.getHomeContent.mockReset();
    mocks.getCmsPage.mockImplementation((name: string) =>
        Promise.resolve(mocks.cmsPages[name] ?? null),
    );
    mocks.getHomeContent.mockImplementation(() =>
        Promise.resolve(mocks.homeContent),
    );

    if (route === "/store") {
        mocks.apiGet.mockImplementation((endpoint: string) => {
            if (endpoint.includes("/slide")) return Promise.resolve([]);
            if (endpoint.startsWith("/products"))
                return Promise.resolve({ products: [] });
            return Promise.resolve([]);
        });
    } else if (route === "/products") {
        mocks.apiGet.mockImplementation((endpoint: string) => {
            if (endpoint.includes("/categories")) return Promise.resolve([]);
            // A distinct backend payload for the filtered endpoint: if the
            // route drops the search params, hrefs are p1/p2 and the fixture
            // expecting p3 fails.
            if (endpoint === "/products?search=silla&category=cat1")
                return Promise.resolve({ products: FILTERED_PRODUCTS });
            return Promise.resolve({ products: PRODUCTS });
        });
    } else if (route === "/orders/$id") {
        mocks.apiGet.mockImplementation(() => Promise.resolve(null));
    } else if (route === "/contact") {
        mocks.cmsPages["contact-pages"] = {
            title: "Contacto",
            subtitle: "Ponete en contacto con nuestro equipo",
        };
    } else if (route === "/faq") {
        mocks.cmsPages["faq-pages"] = {
            title: "Preguntas Frecuentes",
            subtitle: "Preguntas y respuestas frecuentes",
            faqs: [{ question: "Q?", answer: "A." }],
        };
    }
}

type SnapshotResult = Snapshot & { body: string; notFound: boolean };

async function snapshotFor(c: ParityCase): Promise<SnapshotResult> {
    primeBackend(c.route, c.search);
    const route = ROUTES[c.route];
    // Each generated route exposes a differently typed loader (some require
    // params); this harness drives them all with the same loose context.
    const loader = route?.options?.loader as
        | ((ctx: {
              params: Record<string, string>;
              search: Record<string, string>;
              deps: Record<string, string>;
          }) => Promise<Record<string, unknown>>)
        | undefined;
    const loaderDeps = route?.options?.loaderDeps as
        | ((ctx: { search: Record<string, string> }) => Record<string, string>)
        | undefined;
    const deps =
        typeof loaderDeps === "function"
            ? loaderDeps({ search: c.search ?? {} })
            : {};
    let data: Record<string, unknown> = {};
    let status = 200;
    let notFound = false;
    try {
        data =
            typeof loader === "function"
                ? await loader({
                      params: c.params ?? {},
                      search: c.search ?? {},
                      deps,
                  })
                : {};
    } catch (error) {
        if (!isNotFound(error)) throw error;
        notFound = true;
        status = 404;
    }
    mocks.currentLoaderData = data;
    const component = route?.options?.component;
    const body =
        !notFound && component
            ? renderToStaticMarkup(createElement(component))
            : "";
    const snapshot = buildSnapshot({ status, body }) as Snapshot;
    // Guard the helper itself: the sorted link set must match extractHrefs().
    expect(snapshot.hrefs).toEqual(extractHrefs(body));
    return { ...snapshot, body, notFound };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("store group route parity (mock fixtures, tenant=store)", () => {
    for (const c of CASES) {
        it(`renders ${c.label} with the fixture's status, envelope keys and links`, async () => {
            const result = await snapshotFor(c);

            expect(result.status).toBe(c.fixture.status);
            expect(result.envelopeKeys).toEqual(c.fixture.envelopeKeys);
            expect(result.hrefs).toEqual(c.fixture.hrefs);
        });
    }

    it("threads validated search into the backend so the first paint is filtered", async () => {
        await snapshotFor(FILTERED_PRODUCTS_CASE);
        expect(mocks.apiGet).toHaveBeenCalledWith(
            "/products?search=silla&category=cat1",
        );
        expect(mocks.apiGet).toHaveBeenCalledWith("/categories?type=PRODUCT");
    });

    it("does not send filters for the unfiltered products first paint", async () => {
        await snapshotFor(PRODUCTS_CASE);
        expect(mocks.apiGet).toHaveBeenCalledWith("/products?");
        expect(mocks.apiGet).not.toHaveBeenCalledWith(
            "/products?search=silla&category=cat1",
        );
    });

    it("validates the products search contract and leaves links unencumbered", () => {
        const validateSearch = ProductsRoute.options.validateSearch as (
            search: Record<string, unknown>,
        ) => { search?: string; category?: string };
        expect(typeof validateSearch).toBe("function");
        // Optional fields keep <Link to="/products"> usable without a search
        // prop; the loader supplies the ""/ "all" defaults itself.
        expect(validateSearch({})).toEqual({
            search: undefined,
            category: undefined,
        });
        expect(
            validateSearch({ search: "silla", category: "cat1", extra: "x" }),
        ).toEqual({ search: "silla", category: "cat1" });
    });

    it("renders query-bearing searchParams so client filter state survives", async () => {
        const { body } = await snapshotFor(FILTERED_PRODUCTS_CASE);
        // next/navigation useSearchParams now carries the query, so the reused
        // client shows the active filter badge from the URL.
        expect(body).toContain("silla");
    });

    it("derives a real 404 from the order loader's notFound()", async () => {
        const result = await snapshotFor(MISSING_ORDER_CASE);
        expect(result.notFound).toBe(true);
        expect(result.status).toBe(404);
        expect(mocks.apiGet).toHaveBeenCalledWith("/order/missing");
    });

    it("loads storefront data through the loader, not the component", async () => {
        await snapshotFor(STORE_CASE);
        expect(mocks.apiGet).toHaveBeenCalledWith(
            expect.stringContaining("/slide"),
        );
        expect(mocks.apiGet).toHaveBeenCalledWith("/products");
        expect(mocks.getCmsPage).not.toHaveBeenCalled();
    });

    it("loads CMS content through the loader for static pages", async () => {
        await snapshotFor(FAQ_CASE);
        expect(mocks.getCmsPage).toHaveBeenCalledWith("faq-pages");
    });
});
