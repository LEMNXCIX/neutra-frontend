/**
 * Parity for the ported booking group plus the three top-level pages that
 * Task 9 owns (/, /profile and /onboarding/tenant).
 *
 * Live fixture capture is deferred to Task 14, so the "captured fixtures"
 * below are deterministic mocks in the same shape `buildSnapshot()` produces
 * from a real response: `status`, `envelopeKeys` and a sorted link set
 * (`hrefs`). Each case drives the route's real loader with mocked backend data
 * and renders the route component, then compares the rendered snapshot with
 * the fixture. Tenant is `booking` for every case.
 *
 * `status` is not hardcoded per fixture: a loader that throws `redirect()`
 * yields 302 and one that throws `notFound()` yields 404, both detected with
 * the real TanStack guards.
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
    hrefsPartial?: boolean;
};

type ParityCase = {
    label: string;
    route: keyof typeof ROUTES | "__no_route__";
    search?: Record<string, string>;
    params?: Record<string, string>;
    fixture: Fixture;
};

const mocks = vi.hoisted(() => ({
    apiGet: vi.fn(),
    apiClient: vi.fn(),
    getHomeContent: vi.fn(),
    getTenantNameFromHeaders: vi.fn(),
    authValidate: vi.fn(),
    currentLoaderData: {} as Record<string, unknown>,
    search: {} as Record<string, string>,
    authUser: null as any,
    cookies: {} as Record<string, string>,
}));

// Server-only helpers are reached through the loader's dynamic imports.
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

vi.mock("@tanstack/react-start/server", () => ({
    getRequestHeader: () => undefined,
    getRequest: () => undefined,
    getCookie: (name: string) => mocks.cookies[name],
}));

// createServerFn cannot run without Start's server runtime; in tests its
// handler is a plain async function so loaders can be exercised directly.
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

// Give every shell a route object whose useLoaderData() returns the data we
// just loaded. isNotFound/isRedirect stay real so loader-thrown statuses are
// detected rather than swallowed.
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

// Navigation shims so reused components render under plain React.
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

// Lightweight stand-ins for the heavy client widgets. Each renders links
// derived from its loader-supplied props, so a dropped loader payload changes
// the fixture's href set instead of passing silently. Stub bodies reference
// the imported createElement only at render time (the factories are hoisted).
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
vi.mock("@/components/booking/booking-wizard", () => ({
    BookingWizard: () => createElement("div", null, "wizard"),
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
vi.mock("@/app/landing-client", () => ({
    LandingPageClient: () =>
        createElement(
            "div",
            null,
            createElement("a", { href: "/store" }),
            createElement("a", { href: "/book" }),
        ),
}));
vi.mock("@/app/onboarding/tenant/tenant-onboarding-client", () => ({
    TenantOnboardingPageClient: () =>
        createElement("a", { href: "/onboarding/tenant/new" }),
}));
vi.mock("@/components/profile/profile-client", () => ({
    ProfileClient: (props: any) =>
        createElement(
            "div",
            null,
            ...(props.initialOrders ?? []).map((item: any) =>
                createElement("a", {
                    key: item.id,
                    href: `/profile/orders/${item.id}`,
                }),
            ),
        ),
}));

import { Route as AppointmentsRoute } from "@/routes/_booking/appointments/index";
import { Route as BookRoute } from "@/routes/_booking/book/index";
import { Route as HomeRoute } from "@/routes/_booking/home/index";
import { Route as ServicesRoute } from "@/routes/_booking/services/index";
import { Route as LandingRoute } from "@/routes/index";
import { Route as OnboardingRoute } from "@/routes/onboarding/tenant/index";
import { Route as ProfileRoute } from "@/routes/profile/index";

const ROUTES = {
    "/booking/home": HomeRoute,
    "/booking/services": ServicesRoute,
    "/booking/book": BookRoute,
    "/booking/appointments": AppointmentsRoute,
    "/": LandingRoute,
    "/onboarding/tenant": OnboardingRoute,
    "/profile": ProfileRoute,
};

const HOME_CASE: ParityCase = {
    label: "/booking/home",
    route: "/booking/home",
    fixture: {
        status: 200,
        envelopeKeys: [],
        hrefs: [
            "/banners",
            "/book",
            "/services",
            "/services/s1",
            "/services/s2",
        ],
    },
};
const SERVICES_CASE: ParityCase = {
    label: "/booking/services",
    route: "/booking/services",
    fixture: {
        status: 200,
        envelopeKeys: [],
        hrefs: ["/services/s1", "/services/s2"],
    },
};
const BOOK_CASE: ParityCase = {
    label: "/booking/book?serviceId=s1",
    route: "/booking/book",
    search: { serviceId: "s1" },
    fixture: { status: 200, envelopeKeys: [], hrefs: [] },
};
const APPOINTMENTS_CASE: ParityCase = {
    label: "/booking/appointments",
    route: "/booking/appointments",
    fixture: {
        status: 200,
        envelopeKeys: [],
        hrefs: ["/appointments/a1"],
    },
};
// Non-200 case: unauthenticated visitors are redirected by the real loader.
const UNAUTH_APPOINTMENTS_CASE: ParityCase = {
    label: "/booking/appointments (unauthenticated)",
    route: "/booking/appointments",
    fixture: { status: 302, envelopeKeys: [], hrefs: [] },
};
const LANDING_CASE: ParityCase = {
    label: "/",
    route: "/",
    fixture: { status: 200, envelopeKeys: [], hrefs: ["/book", "/store"] },
};
const ONBOARDING_CASE: ParityCase = {
    label: "/onboarding/tenant",
    route: "/onboarding/tenant",
    fixture: {
        status: 200,
        envelopeKeys: [],
        hrefs: ["/onboarding/tenant/new"],
    },
};
const PROFILE_CASE: ParityCase = {
    label: "/profile",
    route: "/profile",
    fixture: {
        status: 200,
        envelopeKeys: [],
        hrefs: ["/profile/orders/o1"],
        // The route now renders the same tenant shell as Next, adding nav/footer links.
        hrefsPartial: true,
    },
};
// Non-200 case: the profile loader throws a real redirect without a session.
const UNAUTH_PROFILE_CASE: ParityCase = {
    label: "/profile (unauthenticated)",
    route: "/profile",
    fixture: { status: 302, envelopeKeys: [], hrefs: [] },
};
// The brief names /admin/orders; there is no such page route in the app. It
// must stay unroutable rather than silently rendering something.
const NO_ADMIN_ORDERS_CASE: ParityCase = {
    label: "/admin/orders (no page route)",
    route: "__no_route__",
    fixture: { status: 404, envelopeKeys: [], hrefs: [] },
};

const CASES: ParityCase[] = [
    HOME_CASE,
    SERVICES_CASE,
    BOOK_CASE,
    APPOINTMENTS_CASE,
    UNAUTH_APPOINTMENTS_CASE,
    LANDING_CASE,
    ONBOARDING_CASE,
    PROFILE_CASE,
    UNAUTH_PROFILE_CASE,
];

const SERVICES = [
    { id: "s1", name: "Corte" },
    { id: "s2", name: "Tinte" },
];
const APPOINTMENTS = [{ id: "a1", status: "PENDING" }];
const ORDERS = [{ id: "o1" }];

function primeBackend(c: ParityCase) {
    const unauth = c === UNAUTH_APPOINTMENTS_CASE || c === UNAUTH_PROFILE_CASE;
    mocks.authUser = unauth ? null : { id: "u1", role: { name: "USER" } };
    mocks.cookies = unauth
        ? {}
        : { token: "tok", "module-type": "store", "tenant-slug": "xcix" };
    mocks.search = c.search ? { ...c.search } : {};
    mocks.getHomeContent.mockReset();
    mocks.getHomeContent.mockResolvedValue(null);
    mocks.getTenantNameFromHeaders.mockReset();
    mocks.getTenantNameFromHeaders.mockResolvedValue("XCIX");
    mocks.authValidate.mockReset();
    mocks.authValidate.mockResolvedValue({ user: mocks.authUser });
    mocks.apiGet.mockReset();
    mocks.apiClient.mockReset();
    mocks.apiGet.mockImplementation((endpoint: string) => {
        if (endpoint.startsWith("/services")) return Promise.resolve(SERVICES);
        if (endpoint.startsWith("/slide")) return Promise.resolve([]);
        if (endpoint.startsWith("/appointments"))
            return Promise.resolve(APPOINTMENTS);
        if (endpoint.startsWith("/order/getOrderByUser"))
            return Promise.resolve(ORDERS);
        if (endpoint.startsWith("/tenants/mine")) return Promise.resolve([]);
        return Promise.resolve([]);
    });
    mocks.apiClient.mockImplementation((endpoint: string) => {
        if (endpoint.startsWith("/services")) return Promise.resolve(SERVICES);
        return Promise.resolve([]);
    });
}

type SnapshotResult = Snapshot & { body: string; statusKind: string };

async function snapshotFor(c: ParityCase): Promise<SnapshotResult> {
    primeBackend(c);
    const route = c.route === "__no_route__" ? undefined : ROUTES[c.route];
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
    let status = route ? 200 : 404;
    let statusKind = route ? "ok" : "noRoute";
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

describe("booking + top-level route parity (mock fixtures, tenant=booking)", () => {
    for (const c of CASES) {
        it(`renders ${c.label} with the fixture's status, envelope keys and links`, async () => {
            const result = await snapshotFor(c);
            expect(result.status).toBe(c.fixture.status);
            expect(result.envelopeKeys).toEqual(c.fixture.envelopeKeys);
            if (c.fixture.hrefsPartial) {
                for (const href of c.fixture.hrefs) {
                    expect(result.hrefs).toContain(href);
                }
            } else {
                expect(result.hrefs).toEqual(c.fixture.hrefs);
            }
        });
    }

    it("throws real redirects from unauthenticated loaders", async () => {
        const appointments = await snapshotFor(UNAUTH_APPOINTMENTS_CASE);
        const profile = await snapshotFor(UNAUTH_PROFILE_CASE);
        expect(appointments.statusKind).toBe("redirect");
        expect(profile.statusKind).toBe("redirect");
        expect(mocks.apiGet).not.toHaveBeenCalled();
    });

    it("threads the validated serviceId into the booking wizard's first paint", async () => {
        await snapshotFor(BOOK_CASE);
        expect(mocks.apiClient).toHaveBeenCalledWith(
            "/services?activeOnly=true",
        );
        expect(mocks.apiClient).toHaveBeenCalledWith("/staff?activeOnly=true");
        const validateSearch = BookRoute.options.validateSearch as (
            search: Record<string, unknown>,
        ) => { serviceId?: string };
        expect(validateSearch({ serviceId: "s1" })).toEqual({
            serviceId: "s1",
        });
    });

    it("loads booking home data through the loader, not the component", async () => {
        await snapshotFor(HOME_CASE);
        expect(mocks.apiGet).toHaveBeenCalledWith("/services?activeOnly=true");
        expect(mocks.apiGet).toHaveBeenCalledWith("/slide?activeOnly=true");
        expect(mocks.getHomeContent).toHaveBeenCalled();
        expect(mocks.getTenantNameFromHeaders).toHaveBeenCalled();
    });

    it("treats /admin/orders as unroutable (no page route exists)", async () => {
        const result = await snapshotFor(NO_ADMIN_ORDERS_CASE);
        expect(result.status).toBe(404);
        expect(result.body).toBe("");
    });
});
