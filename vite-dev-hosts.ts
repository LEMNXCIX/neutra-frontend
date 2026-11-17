/**
 * Pure derivation of Vite's `server.allowedHosts`, extracted from vite.config.ts
 * so it can be tested without importing the heavy Start plugin, stubbing global
 * env vars or resetting the module registry. Those globals made the old test
 * time out under parallel Vitest load.
 */
import { networkInterfaces } from "node:os";

export type Interfaces = ReturnType<typeof networkInterfaces>;

/** Non-internal IPv4 addresses plus every `.nip.io` shape tenant devices use. */
export function localDevHosts(
    interfaces: Interfaces = networkInterfaces(),
): string[] {
    const hosts = new Set<string>();
    for (const addresses of Object.values(interfaces)) {
        for (const address of addresses ?? []) {
            if (address.family !== "IPv4" || address.internal) continue;
            hosts.add(address.address);
            hosts.add(`${address.address}.nip.io`);
            hosts.add(`.${address.address}.nip.io`);
        }
    }
    return [...hosts];
}

/** DEV_ORIGINS is a comma-separated escape hatch for compose/dev containers. */
export function configuredDevHosts(devOrigins: string | undefined): string[] {
    return (devOrigins ?? "")
        .split(",")
        .map((origin) =>
            origin
                .trim()
                .replace(/^[a-z][a-z\d+.-]*:\/\//i, "")
                .replace(/\/.*$/, "")
                .replace(/:\d+$/, ""),
        )
        .filter(Boolean);
}

export function computeAllowedDevHosts(
    devOrigins: string | undefined,
    interfaces: Interfaces = networkInterfaces(),
): string[] {
    return [
        ...new Set([
            ".nip.io",
            ...localDevHosts(interfaces),
            ...configuredDevHosts(devOrigins),
        ]),
    ];
}
