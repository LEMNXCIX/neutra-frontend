/**
 * Parity for the three ported admin groups (`_admin`, `_storeAdmin`,
 * `_bookingAdmin`).
 *
 * Live fixture capture is deferred to Task 14, so the fixtures below are
 * deterministic mocks in the shape `buildSnapshot()` produces from a real
 * response: `status`, `envelopeKeys` and a sorted link set (`hrefs`). Each case
 * drives the route's real loader with mocked backend data and renders the route
 * component. Tenant is `store` for admin/store-admin and `booking` for the
 * booking-admin case.
 *
 * `status` is derived from the loader outcome: a loader that throws
 * `redirect()` yields 302, detected with the real TanStack guard.
 */
import { isNotFound, isRedirect } from "@tanstack/react-router";
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
    fixture: Fixture;
};

const mocks = vi.hoisted(() => ({
    apiGet: vi.fn(),
    apiGetWithMeta: vi.fn(),
    validateAdminAccess: vi.fn(),
    currentLoaderData: {} as Record<string, unknown>,
    search: {} as Record<string, string>,
    adminValid: true as boolean,
}));

vi.mock("@/lib/api-client", () => ({
    api: {
        get: mocks.apiGet,
        getWithMeta: mocks.apiGetWithMeta,
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
    apiClient: vi.fn(),
    ApiError: class ApiError extends Error {},
}));

vi.mock("@/lib/server-auth", () => ({
    validateAdminAccess: () => mocks.validateAdminAccess(),
}));

vi.mock("@tanstack/react-start/server", () => ({
    getRequestHeader: () => undefined,
    getRequest: () => undefined,
    getCookie: () => undefined,
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
        Link: ({ to, children, ...rest }: any) =>
            createElement("a", { href: to, ...rest }, children),
    };
});

vi.mock("next/link", () => ({
    default: ({ href, children, ...rest }: any) =>
        createElement("a", { href, ...rest }, children),
}));
vi.mock("next/image", () => ({
    default: (props: any) => createElement("img", props),
}));
vi.mock("next/navigation", () => ({
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

// Stub bodies reference the imported createElement only at render time (the
// vi.mock factories are hoisted). Each derives its links from loader data.
vi.mock("@/components/admin/LogAnalyticsDashboard", () => ({
    default: () => createElement("a", { href: "/admin/logs" }),
}));
vi.mock("@/components/admin/loyalty/SuperAdminLoyaltyClient", () => ({
    SuperAdminLoyaltyClient: () =>
        createElement("a", { href: "/loyalty/campaigns" }),
}));
vi.mock("@/components/admin/products/ProductsTableClient", () => ({
    default: (props: any) =>
        createElement(
            "div",
            null,
            ...(props.products ?? []).map((item: any) =>
                createElement("a", {
                    key: item.id,
                    href: `/products/${item.id}`,
                }),
            ),
        ),
}));
vi.mock("@/components/admin/appointments/AppointmentsTableClient", () => ({
    default: (props: any) =>
        createElement(
            "div",
            null,
            ...(props.appointments ?? []).map((item: any) =>
                createElement("a", {
                    key: item.id,
                    href: `/appointments/${item.id}`,
                }),
            ),
        ),
}));

import { Route as AdminRoute } from "@/routes/_admin/admin/index";
import { Route as AdminLoyaltyRoute } from "@/routes/_admin/admin/loyalty/index";
import { Route as BookingAdminAppointmentsRoute } from "@/routes/_bookingAdmin/booking-admin/appointments/index";
import { Route as StoreAdminProductsRoute } from "@/routes/_storeAdmin/store-admin/products/index";

const ROUTES = {
    "/admin": AdminRoute,
    "/admin/loyalty": AdminLoyaltyRoute,
    "/store-admin/products": StoreAdminProductsRoute,
    "/booking-admin/appointments": BookingAdminAppointmentsRoute,
};

const ADMIN_CASE: ParityCase = {
    label: "/admin",
    route: "/admin",
    fixture: { status: 200, envelopeKeys: [], hrefs: ["/admin/logs"] },
};
// Non-200 case: the real admin loader redirects when access validation fails.
const UNAUTH_ADMIN_CASE: ParityCase = {
    label: "/admin (unauthenticated)",
    route: "/admin",
    fixture: { status: 302, envelopeKeys: [], hrefs: [] },
};
const LOYALTY_CASE: ParityCase = {
    label: "/admin/loyalty",
    route: "/admin/loyalty",
    fixture: {
        status: 200,
        envelopeKeys: [],
        hrefs: ["/loyalty/campaigns"],
    },
};
const STORE_PRODUCTS_CASE: ParityCase = {
    label: "/store-admin/products",
    route: "/store-admin/products",
    fixture: {
        status: 200,
        envelopeKeys: [],
        hrefs: ["/products/p1", "/products/p2"],
    },
};
// A distinct backend payload plus search params proves the loader keeps the
// original page's validated filtering instead of dropping it on first paint.
const FILTERED_STORE_PRODUCTS_CASE: ParityCase = {
    label: "/store-admin/products?search=silla&category=cat1",
    route: "/store-admin/products",
    search: { search: "silla", category: "cat1" },
    fixture: { status: 200, envelopeKeys: [], hrefs: ["/products/p3"] },
};
const BOOKING_APPOINTMENTS_CASE: ParityCase = {
    label: "/booking-admin/appointments?search=ana&status=PENDING",
    route: "/booking-admin/appointments",
    search: { search: "ana", status: "PENDING" },
    fixture: {
        status: 200,
        envelopeKeys: [],
        hrefs: ["/appointments/a1"],
    },
};

const CASES: ParityCase[] = [
    ADMIN_CASE,
    UNAUTH_ADMIN_CASE,
    LOYALTY_CASE,
    STORE_PRODUCTS_CASE,
    FILTERED_STORE_PRODUCTS_CASE,
    BOOKING_APPOINTMENTS_CASE,
];

const ALL_PRODUCTS = [
    { id: "p1", name: "Mesa", price: 10, stock: 5, categories: [] },
    { id: "p2", name: "Silla", price: 20, stock: 2, categories: [] },
];
const FILTERED_PRODUCTS = [
    {
        id: "p3",
        name: "Silla Filtrada",
        price: 30,
        stock: 1,
        categories: [{ id: "cat1", name: "Sillas" }],
    },
];
const APPOINTMENTS = [{ id: "a1", status: "PENDING" }];

function primeBackend(c: ParityCase) {
    mocks.adminValid = c !== UNAUTH_ADMIN_CASE;
    mocks.search = c.search ? { ...c.search } : {};
    mocks.validateAdminAccess.mockReset();
    mocks.validateAdminAccess.mockResolvedValue({
        isValid: mocks.adminValid,
        user: mocks.adminValid ? { id: "u1" } : null,
    });
    mocks.apiGet.mockReset();
    mocks.apiGetWithMeta.mockReset();
    mocks.apiGet.mockImplementation((endpoint: string) => {
        if (endpoint === "/products")
            return Promise.resolve({
                products:
                    c === FILTERED_STORE_PRODUCTS_CASE
                        ? [...ALL_PRODUCTS, ...FILTERED_PRODUCTS]
                        : ALL_PRODUCTS,
            });
        if (endpoint === "/categories") return Promise.resolve([]);
        return Promise.resolve([]);
    });
    mocks.apiGetWithMeta.mockImplementation((endpoint: string) => {
        if (endpoint.startsWith("/appointments"))
            return Promise.resolve({
                data: APPOINTMENTS,
                meta: { pagination: { page: 1, limit: 10, total: 1 } },
            });
        return Promise.resolve({ data: [], meta: {} });
    });
}

type SnapshotResult = Snapshot & { body: string; statusKind: string };

async function snapshotFor(c: ParityCase): Promise<SnapshotResult> {
    primeBackend(c);
    const route = ROUTES[c.route];
    const loader = route?.options?.loader as
        | ((ctx: {
              params: Record<string, string>;
              search: Record<string, string>;
              deps: Record<string, unknown>;
          }) => Promise<Record<string, unknown>>)
        | undefined;
    const loaderDeps = route?.options?.loaderDeps as
        | ((ctx: { search: Record<string, string> }) => Record<string, unknown>)
        | undefined;
    const deps =
        typeof loaderDeps === "function"
            ? loaderDeps({ search: c.search ?? {} })
            : {};
    let data: Record<string, unknown> = {};
    let status = 200;
    let statusKind = "ok";
    try {
        data =
            typeof loader === "function"
                ? await loader({
                      params: {},
                      search: c.search ?? {},
                      deps,
                  })
                : {};
    } catch (error) {
        if (isRedirect(error)) {
            status = 302;
            statusKind = "redirect";
        } else if (isNotFound(error)) {
            status = 404;
            statusKind = "notFound";
        } else {
            throw error;
        }
    }
    mocks.currentLoaderData = data;
    const component = route?.options?.component;
    const body =
        status === 200 && component
            ? renderToStaticMarkup(createElement(component))
            : "";
    const snapshot = buildSnapshot({ status, body }) as Snapshot;
    expect(snapshot.hrefs).toEqual(extractHrefs(body));
    return { ...snapshot, body, statusKind };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("admin group route parity (mock fixtures)", () => {
    for (const c of CASES) {
        it(`renders ${c.label} with the fixture's status, envelope keys and links`, async () => {
            const result = await snapshotFor(c);
            expect(result.status).toBe(c.fixture.status);
            expect(result.envelopeKeys).toEqual(c.fixture.envelopeKeys);
            expect(result.hrefs).toEqual(c.fixture.hrefs);
        });
    }

    it("throws a real redirect from the admin loader when access is invalid", async () => {
        const result = await snapshotFor(UNAUTH_ADMIN_CASE);
        expect(result.statusKind).toBe("redirect");
    });

    it("keeps store-admin product search/category filtering on the first paint", async () => {
        const result = await snapshotFor(FILTERED_STORE_PRODUCTS_CASE);
        expect(result.hrefs).toEqual(["/products/p3"]);
        expect(mocks.apiGet).toHaveBeenCalledWith("/products");
        const validateSearch = StoreAdminProductsRoute.options
            .validateSearch as (search: Record<string, unknown>) => {
            search?: string;
            category?: string;
        };
        expect(
            validateSearch({ search: "silla", category: "cat1", extra: "x" }),
        ).toEqual({ search: "silla", category: "cat1" });
    });

    it("threads booking-admin search/status into the backend query", async () => {
        await snapshotFor(BOOKING_APPOINTMENTS_CASE);
        expect(mocks.apiGetWithMeta).toHaveBeenCalledWith(
            "/appointments?page=1&limit=10&search=ana&status=PENDING",
        );
    });

    it("loads the admin dashboard through validateAdminAccess in the loader", async () => {
        await snapshotFor(ADMIN_CASE);
        expect(mocks.validateAdminAccess).toHaveBeenCalled();
    });
});
