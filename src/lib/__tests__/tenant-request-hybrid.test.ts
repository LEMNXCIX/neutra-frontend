/**
 * The real backend reports the superadmin tenant as type HYBRID. Treating it
 * as an unknown module made the server entry answer "Tenant configuration
 * unavailable" for superadmin.localhost /admin.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveTenant } from "../tenant-request";

const originalBackendUrl = process.env.BACKEND_API_URL;

afterEach(() => {
    vi.unstubAllGlobals();
    if (originalBackendUrl === undefined) delete process.env.BACKEND_API_URL;
    else process.env.BACKEND_API_URL = originalBackendUrl;
});

describe("resolveTenant module types", () => {
    it("maps the real HYBRID superadmin type to the root surface", async () => {
        process.env.BACKEND_API_URL = "http://localhost:4000/api";
        vi.stubGlobal(
            "fetch",
            vi.fn(async () =>
                Response.json({
                    success: true,
                    data: {
                        id: "superadmin-id",
                        type: "HYBRID",
                        name: "Neutra SuperAdmin",
                    },
                }),
            ),
        );

        const result = await resolveTenant("hybrid-fixture.localhost");

        expect(result).toEqual({
            slug: "hybrid-fixture",
            moduleType: "root",
            tenantId: "superadmin-id",
        });
    });
});
