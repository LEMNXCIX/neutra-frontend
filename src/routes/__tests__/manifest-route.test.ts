import { describe, expect, it } from "vitest";
import { Route as LegacyRoute } from "../api/manifest[.]webmanifest";
import { Route as CanonicalRoute } from "../manifest[.]webmanifest";

type ManifestRoute = {
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

async function getManifest(route: unknown, host: string) {
    const handler = (
        (route as ManifestRoute).options.server as {
            handlers: {
                GET: (ctx: {
                    request: Request;
                }) => Response | Promise<Response>;
            };
        }
    ).handlers.GET;

    return handler({
        request: new Request("http://localhost/manifest.webmanifest", {
            headers: { host },
        }),
    });
}

describe("PWA manifest routes", () => {
    it("serves the canonical /manifest.webmanifest with the tenant name from Host", async () => {
        const response = await getManifest(
            CanonicalRoute,
            "tienda.midominio.com",
        );

        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toContain(
            "application/json",
        );

        const body = await response.json();
        expect(body.short_name).toBe("Tienda");
        expect(body.name).toBe("Tienda Platform");
        expect(body.start_url).toBe("/");
        expect(body.icons[0].src).toBe("/icon.svg");
    });

    it("keeps the legacy /api/manifest.webmanifest alias working", async () => {
        const response = await getManifest(LegacyRoute, "booking.ejemplo.com");
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.short_name).toBe("Booking");
    });
});
