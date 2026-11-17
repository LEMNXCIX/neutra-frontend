import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import "./styles/globals.css";

/** Use the generated file-based tree so the 68 page routes, pathless group
 *  layouts and API/server routes are reachable (no hand-assembled root tree). */
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
