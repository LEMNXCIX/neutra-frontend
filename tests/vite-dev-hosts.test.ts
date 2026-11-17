/**
 * Dev-host parity with the deleted next.config.ts `allowedDevOrigins`:
 * nip.io tenant hosts, local IPs and DEV_ORIGINS must be accepted by Vite.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
    vi.unstubAllEnvs();
});

describe("vite dev allowed hosts", () => {
    it("allows nip.io tenants, local IPs and configured DEV_ORIGINS", async () => {
        vi.stubEnv(
            "DEV_ORIGINS",
            "console.example.com, http://device.example.test:5173/path",
        );
        vi.resetModules();

        const { default: config } = await import("../vite.config");

        expect(config.server?.host).toBe(true);
        const hosts = config.server?.allowedHosts;
        expect(Array.isArray(hosts)).toBe(true);
        expect(hosts).toContain(".nip.io");
        expect(hosts).toContain("console.example.com");
        expect(hosts).toContain("device.example.test");
    });
});
