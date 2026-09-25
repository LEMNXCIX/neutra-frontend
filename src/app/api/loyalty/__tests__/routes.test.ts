import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
    createGetHandler: vi.fn((_endpoint: unknown) => vi.fn()),
    createPostHandler: vi.fn((_endpoint: unknown, _options?: unknown) =>
        vi.fn(),
    ),
    createPatchHandler: vi.fn((_endpoint: unknown) => vi.fn()),
    createDeleteHandler: vi.fn((_endpoint: unknown) => vi.fn()),
}));

type DynamicEndpoint = (
    request: unknown,
    params?: Record<string, string>,
) => string;
type Endpoint = string | DynamicEndpoint;

vi.mock("@/lib/api-route-handler", () => routeMocks);

beforeEach(async () => {
    vi.resetModules();
    routeMocks.createGetHandler.mockClear();
    routeMocks.createPostHandler.mockClear();
    routeMocks.createPatchHandler.mockClear();
    routeMocks.createDeleteHandler.mockClear();
    await Promise.all([
        import("../me/route"),
        import("../me/campaigns/[campaignId]/route"),
        import("../me/campaigns/[campaignId]/claim/route"),
        import("../admin/summary/route"),
        import("../admin/campaigns/route"),
        import("../admin/campaigns/[campaignId]/route"),
        import("../admin/campaigns/[campaignId]/activate/route"),
        import("../admin/campaigns/[campaignId]/end/route"),
        import("../admin/campaigns/[campaignId]/archive/route"),
        import("../admin/tenants/route"),
    ]);
});

function dynamicEndpoints(mock: {
    mock: { calls: unknown[][] };
}): DynamicEndpoint[] {
    return (mock.mock.calls as [Endpoint, ...unknown[]][])
        .map(([endpoint]) => endpoint)
        .filter(
            (endpoint): endpoint is DynamicEndpoint =>
                typeof endpoint === "function",
        );
}

describe("loyalty BFF campaign routes", () => {
    it("maps every static endpoint to the generic handler factories", () => {
        expect(routeMocks.createGetHandler).toHaveBeenCalledWith("/loyalty/me");
        expect(routeMocks.createGetHandler).toHaveBeenCalledWith(
            "/loyalty/admin/summary",
        );
        expect(routeMocks.createGetHandler).toHaveBeenCalledWith(
            "/loyalty/admin/campaigns",
        );
        expect(routeMocks.createGetHandler).toHaveBeenCalledWith(
            "/loyalty/admin/tenants",
        );
        expect(routeMocks.createPostHandler).toHaveBeenCalledWith(
            "/loyalty/admin/campaigns",
        );
    });

    it("encodes customer and tenant campaign identifiers", () => {
        const customerEndpoints = dynamicEndpoints(routeMocks.createGetHandler).map(
            (endpoint) => endpoint({}, { campaignId: "campaign/a" }),
        );
        const tenantEndpoints = [
            ...dynamicEndpoints(routeMocks.createGetHandler),
            ...dynamicEndpoints(routeMocks.createPatchHandler),
            ...dynamicEndpoints(routeMocks.createDeleteHandler),
        ].map((endpoint) => endpoint({}, { campaignId: "campaign/a" }));

        expect(customerEndpoints).toContain(
            "/loyalty/me/campaigns/campaign%2Fa",
        );
        expect(tenantEndpoints).toContain(
            "/loyalty/admin/campaigns/campaign%2Fa",
        );
    });

    it("maps dynamic lifecycle actions and returns HTTP 200", () => {
        const actionEndpoints = dynamicEndpoints(
            routeMocks.createPostHandler,
        ).map((endpoint) => endpoint({}, { campaignId: "campaign/a" }));

        expect(actionEndpoints).toEqual(
            expect.arrayContaining([
                "/loyalty/me/campaigns/campaign%2Fa/claim",
                "/loyalty/admin/campaigns/campaign%2Fa/activate",
                "/loyalty/admin/campaigns/campaign%2Fa/end",
                "/loyalty/admin/campaigns/campaign%2Fa/archive",
            ]),
        );
        expect(
            routeMocks.createPostHandler.mock.calls.filter(
                ([, options]) =>
                    (options as { successStatus?: number } | undefined)
                        ?.successStatus === 200,
            ),
        ).toHaveLength(4);
    });

    it("does not register legacy config route mappings", () => {
        const staticEndpoints = [
            ...routeMocks.createGetHandler.mock.calls,
            ...routeMocks.createPostHandler.mock.calls,
            ...routeMocks.createPatchHandler.mock.calls,
            ...routeMocks.createDeleteHandler.mock.calls,
        ]
            .map(([endpoint]) => endpoint)
            .filter((endpoint): endpoint is string => typeof endpoint === "string");

        expect(staticEndpoints).not.toContain("/loyalty/admin/config");
        expect(
            staticEndpoints.some((endpoint) => endpoint.includes("/config")),
        ).toBe(false);
    });
});
