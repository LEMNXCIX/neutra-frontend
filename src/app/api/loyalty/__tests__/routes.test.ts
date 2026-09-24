import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
    createGetHandler: vi.fn((_endpoint: unknown) => vi.fn()),
    createPostHandler: vi.fn((_endpoint: unknown, _options?: unknown) =>
        vi.fn(),
    ),
    createPutHandler: vi.fn((_endpoint: unknown) => vi.fn()),
}));

type Endpoint =
    | string
    | ((request: unknown, params?: Record<string, string>) => string);

vi.mock("@/lib/api-route-handler", () => routeMocks);

beforeEach(async () => {
    vi.resetModules();
    routeMocks.createGetHandler.mockClear();
    routeMocks.createPostHandler.mockClear();
    routeMocks.createPutHandler.mockClear();
    await Promise.all([
        import("../me/route"),
        import("../me/claim/route"),
        import("../admin/summary/route"),
        import("../admin/config/route"),
        import("../admin/tenants/route"),
        import("../admin/tenants/[tenantId]/config/route"),
    ]);
});

describe("loyalty BFF route mappings", () => {
    it("maps every static endpoint to the existing handler factories", () => {
        expect(routeMocks.createGetHandler).toHaveBeenCalledWith("/loyalty/me");
        expect(routeMocks.createGetHandler).toHaveBeenCalledWith(
            "/loyalty/admin/summary",
        );
        expect(routeMocks.createGetHandler).toHaveBeenCalledWith(
            "/loyalty/admin/config",
        );
        expect(routeMocks.createGetHandler).toHaveBeenCalledWith(
            "/loyalty/admin/tenants",
        );
        expect(routeMocks.createPutHandler).toHaveBeenCalledWith(
            "/loyalty/admin/config",
        );
    });

    it("returns a successful claim with HTTP 200", () => {
        expect(routeMocks.createPostHandler).toHaveBeenCalledWith(
            "/loyalty/me/claim",
            { successStatus: 200 },
        );
    });

    it("maps and encodes the dynamic tenant config endpoint for GET and PUT", () => {
        const getEndpoint = routeMocks.createGetHandler.mock.calls.find(
            ([endpoint]) => typeof endpoint === "function",
        )?.[0] as Endpoint | undefined;
        const putEndpoint = routeMocks.createPutHandler.mock.calls.find(
            ([endpoint]) => typeof endpoint === "function",
        )?.[0] as Endpoint | undefined;

        expect(getEndpoint).toBe(putEndpoint);
        if (typeof getEndpoint !== "function") {
            throw new Error("Dynamic GET endpoint resolver was not registered");
        }
        expect(getEndpoint({}, { tenantId: "tenant/a" })).toBe(
            "/loyalty/admin/tenants/tenant%2Fa/config",
        );
    });
});
