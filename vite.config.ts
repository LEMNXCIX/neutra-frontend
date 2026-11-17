import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    // Suppress auto-discovery of the Next-oriented postcss.config.mjs;
    // Tailwind is handled by @tailwindcss/vite above.
    css: { postcss: { plugins: [] } },
    plugins: [
        // Vite-native Tailwind v4 integration; the existing postcss.config.mjs
        // stays in place for the Next app until the final cutover.
        tailwindcss(),
        tanstackStart({
            router: {
                // Unit tests live beside routes but are not route files.
                routeFileIgnorePattern: "\\.test\\.",
            },
            // The custom server entry is added in the server-entry task; until
            // then the plugin uses its default Node server entry.
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
