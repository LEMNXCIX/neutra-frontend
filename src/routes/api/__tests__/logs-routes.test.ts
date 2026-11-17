/**
 * The admin logs BFF routes were missing, so /admin/logs/stats fell through to
 * the SPA 404 page and apiClient tried to parse HTML as JSON.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { Route as ListRoute } from "../../api/admin/logs/route";
import { Route as StatsRoute } from "../../api/admin/logs/stats/route";

const originalBackendUrl = process.env.BACKEND_API_URL;

afterEach(() => {
    vi.unstubAllGlobals();
    if (originalBackendUrl === undefined) delete process.env.BACKEND_API_URL;
    else process.env.BACKEND_API_URL = originalBackendUrl;
});

type BffRoute = {
    options: {
        server: {
            handlers: {
                GET: (ctx: {
                    request: Request;
                }) => Response | Promise<Response>;
            };
        };
    };
};

async function get(route: unknown, url: string) {
    const handler = (route as BffRoute).options.server.handlers.GET;
    return handler({ request: new Request(url) });
}

describe("admin logs BFF routes", () => {
    it.each([
        ["/api/admin/logs", "/admin/logs", ListRoute],
        ["/api/admin/logs/stats", "/admin/logs/stats", StatsRoute],
    ])(
        "proxies %s to the real backend endpoint",
        async (path, upstream, route) => {
            process.env.BACKEND_API_URL = "http://localhost:4000/api";
            const fetchMock = vi.fn(
                async (_url: string | URL | Request, _init?: RequestInit) =>
                    Response.json({
                        success: true,
                        statusCode: 200,
                        message: "OK",
                        data: [],
                    }),
            );
            vi.stubGlobal("fetch", fetchMock);

            const response = await get(
                route,
                `http://localhost${path}?timeframe=daily`,
            );
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body.success).toBe(true);
            const calledUrl = String(fetchMock.mock.calls[0][0]);
            expect(calledUrl).toContain(`/api${upstream}?timeframe=daily`);
        },
    );
});
