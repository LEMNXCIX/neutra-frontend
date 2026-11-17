/**
 * Re-port of the deleted `src/app/api/loyalty/__tests__/routes.test.ts` against
 * the generated Web routes. `createBffHandler` is exercised for real with a
 * stubbed backend, so the assertions check the resolved endpoint that reaches
 * the backend (not just mock factory calls) plus the lifecycle status codes.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    serverBackendFetch: vi.fn(),
}));

vi.mock("@/lib/backend-api", () => ({
    serverBackendFetch: mocks.serverBackendFetch,
    backendGet: vi.fn(),
    backendFetch: vi.fn(),
    backendPut: vi.fn(),
    backendPost: vi.fn(),
    backendDelete: vi.fn(),
}));

vi.mock("@/lib/backend-url", () => ({
    getBackendUrl: vi.fn(() => "http://backend.test/api"),
}));

import { Route as ActivateRoute } from "@/routes/api/loyalty/admin/campaigns/$campaignId/activate/route";
import { Route as ArchiveRoute } from "@/routes/api/loyalty/admin/campaigns/$campaignId/archive/route";
import { Route as EndRoute } from "@/routes/api/loyalty/admin/campaigns/$campaignId/end/route";
import { Route as AdminCampaignRoute } from "@/routes/api/loyalty/admin/campaigns/$campaignId/route";
import { Route as AdminCampaignsRoute } from "@/routes/api/loyalty/admin/campaigns/route";
import { Route as AdminSummaryRoute } from "@/routes/api/loyalty/admin/summary/route";
import { Route as AdminTenantsRoute } from "@/routes/api/loyalty/admin/tenants/route";
import { Route as ClaimRoute } from "@/routes/api/loyalty/me/campaigns/$campaignId/claim/route";
import { Route as MeCampaignRoute } from "@/routes/api/loyalty/me/campaigns/$campaignId/route";
import { Route as MeRoute } from "@/routes/api/loyalty/me/route";

type Handler = (ctx: {
    request: Request;
    params?: Record<string, string>;
}) => Promise<Response>;

type RouteWithServer = { options: unknown };

function handlerFor(route: RouteWithServer, method: string): Handler {
    const server = (
        route.options as { server?: { handlers: Record<string, Handler> } }
    ).server;
    const handler = server?.handlers?.[method];
    if (typeof handler !== "function") {
        throw new Error(`No ${method} handler on loyalty route`);
    }
    return handler;
}

async function invoke(
    route: RouteWithServer,
    method: string,
    params?: Record<string, string>,
): Promise<Response> {
    return handlerFor(
        route,
        method,
    )({
        request: new Request("http://tenant.local/api/loyalty", { method }),
        params,
    });
}

function backendEndpoints(): string[] {
    return mocks.serverBackendFetch.mock.calls.map(([endpoint]) => endpoint);
}

beforeEach(() => {
    vi.clearAllMocks();
    mocks.serverBackendFetch.mockResolvedValue({
        success: true,
        statusCode: 200,
        message: "ok",
        data: [],
        meta: { traceId: "loyalty-trace", timestamp: "2026-01-01T00:00:00Z" },
    });
});

describe("loyalty BFF campaign routes (Web handlers)", () => {
    it("maps every static endpoint to the Web backend", async () => {
        await invoke(MeRoute, "GET");
        await invoke(AdminSummaryRoute, "GET");
        await invoke(AdminCampaignsRoute, "GET");
        await invoke(AdminCampaignsRoute, "POST");
        await invoke(AdminTenantsRoute, "GET");

        expect(backendEndpoints()).toEqual(
            expect.arrayContaining([
                "/loyalty/me",
                "/loyalty/admin/summary",
                "/loyalty/admin/campaigns",
                "/loyalty/admin/tenants",
            ]),
        );
    });

    it("encodes customer and tenant campaign identifiers", async () => {
        await invoke(MeCampaignRoute, "GET", { campaignId: "campaign/a" });
        await invoke(AdminCampaignRoute, "GET", { campaignId: "campaign/a" });
        await invoke(AdminCampaignRoute, "PATCH", { campaignId: "campaign/a" });
        await invoke(AdminCampaignRoute, "DELETE", {
            campaignId: "campaign/a",
        });

        expect(backendEndpoints()).toEqual(
            expect.arrayContaining([
                "/loyalty/me/campaigns/campaign%2Fa",
                "/loyalty/admin/campaigns/campaign%2Fa",
            ]),
        );
    });

    it("maps dynamic lifecycle actions and returns HTTP 200", async () => {
        const params = { campaignId: "campaign/a" };
        const responses = [
            await invoke(ClaimRoute, "POST", params),
            await invoke(ActivateRoute, "POST", params),
            await invoke(EndRoute, "POST", params),
            await invoke(ArchiveRoute, "POST", params),
        ];

        expect(backendEndpoints()).toEqual(
            expect.arrayContaining([
                "/loyalty/me/campaigns/campaign%2Fa/claim",
                "/loyalty/admin/campaigns/campaign%2Fa/activate",
                "/loyalty/admin/campaigns/campaign%2Fa/end",
                "/loyalty/admin/campaigns/campaign%2Fa/archive",
            ]),
        );
        // Default POST success would be 201; 200 proves successStatus: 200
        // survived the generator into createBffHandler for all four actions.
        expect(responses.map((response) => response.status)).toEqual([
            200, 200, 200, 200,
        ]);
    });

    it("does not register any legacy config endpoint", async () => {
        await invoke(MeRoute, "GET");
        await invoke(MeCampaignRoute, "GET", { campaignId: "campaign/a" });
        await invoke(ClaimRoute, "POST", { campaignId: "campaign/a" });
        await invoke(AdminSummaryRoute, "GET");
        await invoke(AdminCampaignsRoute, "GET");
        await invoke(AdminCampaignsRoute, "POST");
        await invoke(AdminCampaignRoute, "GET", { campaignId: "campaign/a" });
        await invoke(AdminCampaignRoute, "PATCH", { campaignId: "campaign/a" });
        await invoke(AdminCampaignRoute, "DELETE", {
            campaignId: "campaign/a",
        });
        await invoke(ActivateRoute, "POST", { campaignId: "campaign/a" });
        await invoke(EndRoute, "POST", { campaignId: "campaign/a" });
        await invoke(ArchiveRoute, "POST", { campaignId: "campaign/a" });
        await invoke(AdminTenantsRoute, "GET");

        const endpoints = backendEndpoints();
        expect(endpoints).not.toContain("/loyalty/admin/config");
        expect(endpoints.some((endpoint) => endpoint.includes("/config"))).toBe(
            false,
        );
    });
});
