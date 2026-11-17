/**
 * Dev-host parity with the deleted next.config.ts `allowedDevOrigins`:
 * nip.io tenant hosts, local IPs and DEV_ORIGINS must be accepted by Vite.
 *
 * Deterministic by construction: the pure helper takes interfaces and the raw
 * DEV_ORIGINS string as arguments. No process.env stubbing, no vi.resetModules
 * and no dynamic import of vite.config — those globals made the old version of
 * this test flaky (and sometimes time out) under Vitest's parallel workers.
 */
import { describe, expect, it } from "vitest";
import {
    computeAllowedDevHosts,
    configuredDevHosts,
    type Interfaces,
    localDevHosts,
} from "../vite-dev-hosts";

const interfaces = {
    lo: [
        {
            address: "127.0.0.1",
            family: "IPv4",
            internal: true,
            mac: "",
            netmask: "255.0.0.0",
            scopeid: 0,
            cidr: "127.0.0.1/8",
        },
    ],
    eth0: [
        {
            address: "192.168.68.100",
            family: "IPv4",
            internal: false,
            mac: "",
            netmask: "255.255.255.0",
            scopeid: 0,
            cidr: "192.168.68.100/24",
        },
    ],
} as Interfaces;

describe("vite dev allowed hosts", () => {
    it("allows nip.io tenants, local IPs and configured DEV_ORIGINS", () => {
        const hosts = computeAllowedDevHosts(
            "console.example.com, http://device.example.test:5173/path",
            interfaces,
        );

        expect(hosts).toContain(".nip.io");
        expect(hosts).toContain("192.168.68.100");
        expect(hosts).toContain("192.168.68.100.nip.io");
        expect(hosts).toContain(".192.168.68.100.nip.io");
        expect(hosts).toContain("console.example.com");
        expect(hosts).toContain("device.example.test");
        // Loopback is always allowed by Vite; it is not pinned by us.
        expect(hosts).not.toContain("127.0.0.1");
    });

    it("ignores empty or malformed DEV_ORIGINS entries deterministically", () => {
        expect(configuredDevHosts(undefined)).toEqual([]);
        expect(
            configuredDevHosts("  , http://one.test:3000/x, ,two.test"),
        ).toEqual(["one.test", "two.test"]);
    });

    it("keeps local-host derivation a pure function of the interfaces", () => {
        expect(localDevHosts(interfaces)).toEqual([
            "192.168.68.100",
            "192.168.68.100.nip.io",
            ".192.168.68.100.nip.io",
        ]);
    });
});
