/**
 * Generate src/routeTree.gen.ts without running a full Vite build.
 *
 * `src/router.tsx` imports the generated tree, so a clean checkout fails
 * `tsc --noEmit` until the tree exists. This script uses the same generator
 * (and the same Start-specific footer) as the tanstackStart Vite plugin, and is
 * wired as `pretypecheck` so `npm run typecheck` always works from scratch.
 */
import { Generator, getConfig } from "@tanstack/router-generator";

const root = process.cwd();
const config = getConfig(
    {
        target: "react",
        routesDirectory: "./src/routes",
        generatedRouteTree: "./src/routeTree.gen.ts",
        routeFileIgnorePattern: "\\.test\\.",
        quoteStyle: "single",
        semicolons: false,
        // Mirrors buildRouteTreeFileFooter from @tanstack/start-plugin-core.
        // A single block keeps the lines contiguous (no blank lines between).
        routeTreeFileFooter: [
            "import type { getRouter } from './router.tsx'\nimport type { startInstance } from './start.ts'\ndeclare module '@tanstack/react-start' {\n  interface Register {\n    ssr: true\n    router: Awaited<ReturnType<typeof getRouter>>\n    config: Awaited<ReturnType<typeof startInstance.getOptions>>\n  }\n}",
        ],
    },
    root,
);

await new Generator({ config, root }).run();
console.log("Generated src/routeTree.gen.ts");
