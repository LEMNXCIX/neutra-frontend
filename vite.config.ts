import { networkInterfaces } from "node:os";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Replacement for next.config.ts's `allowedDevOrigins`. Vite checks the Host
 * header against `server.allowedHosts` and rejects unknown ones with 403, which
 * breaks tenant device testing on `<slug>.<ip>.nip.io`. Deriving the hosts from
 * the machine's interfaces avoids pinning a LAN address that changes with the
 * network; `.nip.io` covers every nip.io subdomain, including ones resolved
 * after the dev server started. DEV_ORIGINS stays the escape hatch for compose
 * containers, where the visible interfaces are the bridge network.
 */
const localDevHosts = (): string[] => {
    const hosts = new Set<string>();
    for (const addresses of Object.values(networkInterfaces())) {
        for (const address of addresses ?? []) {
            if (address.family !== "IPv4" || address.internal) continue;
            hosts.add(address.address);
            hosts.add(`${address.address}.nip.io`);
            hosts.add(`.${address.address}.nip.io`);
        }
    }
    return [...hosts];
};

const configuredDevHosts = (process.env.DEV_ORIGINS ?? "")
    .split(",")
    .map((origin) =>
        origin
            .trim()
            .replace(/^[a-z][a-z\d+.-]*:\/\//i, "")
            .replace(/\/.*$/, "")
            .replace(/:\d+$/, ""),
    )
    .filter(Boolean);

const allowedDevHosts = [
    ...new Set([".nip.io", ...localDevHosts(), ...configuredDevHosts]),
];

export default defineConfig({
    // Suppress auto-discovery of the Next-oriented postcss.config.mjs;
    // Tailwind is handled by @tailwindcss/vite above.
    css: { postcss: { plugins: [] } },
    server: {
        // Listen on the LAN interface too, otherwise <ip>.nip.io cannot reach
        // the dev server even when the Host header is allowed.
        host: true,
        allowedHosts: allowedDevHosts,
    },
    plugins: [
        tailwindcss(),
        tanstackStart({
            router: {
                // Unit tests live beside routes but are not route files.
                routeFileIgnorePattern: "\\.test\\.",
            },
            server: { entry: "./server.ts" },
        }),
        viteReact(),
    ],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
});
