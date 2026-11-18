import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { computeAllowedDevHosts } from "./vite-dev-hosts";

/**
 * Replacement for next.config.ts's `allowedDevOrigins`. Vite checks the Host
 * header against `server.allowedHosts` and rejects unknown ones with 403, which
 * breaks tenant device testing on `<slug>.<ip>.nip.io`. Deriving the hosts from
 * the machine's interfaces avoids pinning a LAN address that changes with the
 * network; `.nip.io` covers every nip.io subdomain, including ones resolved
 * after the dev server started. DEV_ORIGINS stays the escape hatch for compose
 * containers, where the visible interfaces are the bridge network.
 *
 * The derivation lives in a pure helper so it is testable without importing
 * the Start plugin or mutating process.env (tests/vite-dev-hosts.test.ts).
 */
const allowedDevHosts = computeAllowedDevHosts(process.env.DEV_ORIGINS);

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
