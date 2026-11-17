import { createRouter } from "@tanstack/react-router";
import { Route as rootRoute } from "./routes/__root";
import "./styles/globals.css";

// Only the root route exists during scaffolding. Later tasks replace this
// hand-assembled tree with the generated file-based `routeTree.gen.ts`.
const routeTree = rootRoute.addChildren([]);

export function getRouter() {
    return createRouter({
        routeTree,
        defaultPreload: "intent",
        context: {},
    });
}

declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof getRouter>;
    }
}
