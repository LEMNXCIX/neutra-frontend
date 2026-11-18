// @vitest-environment happy-dom

/**
 * Real-router integration for the two navigation bugs found in review:
 *
 *  1. a `<Link>` with a typed `search` must match `/products` and populate the
 *     route's validateSearch / loaderDeps (no regex-interpolating mock);
 *  2. `useRouter().push` with an embedded `?query` must be parsed into
 *     `navigate({ to, search })` instead of being passed as one opaque path.
 *
 * A minimal route tree keeps server functions and the real app shell out of the
 * test while exercising the actual TanStack Router matching machinery.
 */
import {
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
    Link,
    Outlet,
    RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useRouter as useAppRouter } from "@/lib/navigation";

function PushButton() {
    const router = useAppRouter();
    return (
        <button
            type="button"
            onClick={() => router.push("/products?search=abc&category=shoes")}
        >
            Filtrar
        </button>
    );
}

const rootRoute = createRootRoute({
    component: () => (
        <div>
            <Link to="/products" search={{ category: "shoes" }}>
                Categoría Zapatos
            </Link>
            <PushButton />
            <Outlet />
        </div>
    ),
});

const productsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/products",
    validateSearch: (
        search: Record<string, unknown>,
    ): { search?: string; category?: string } => ({
        search: typeof search.search === "string" ? search.search : undefined,
        category:
            typeof search.category === "string" ? search.category : undefined,
    }),
    loaderDeps: ({ search }) => ({
        search: search.search ?? "",
        category: search.category ?? "all",
    }),
    loader: ({ deps }) => Promise.resolve(deps),
    component: () => <div>Productos</div>,
});

const routeTree = rootRoute.addChildren([productsRoute]);

const makeRouter = () =>
    createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: ["/"] }),
        defaultPreload: false,
    });

// The test's minimal tree is not the app's registered tree, so its route ids
// fall outside the Router generic; read them structurally.
const productsMatch = (router: ReturnType<typeof makeRouter>): any =>
    router.state.matches.find(
        (match) => (match as { routeId: string }).routeId === "/products",
    );

describe("real-router navigation", () => {
    it("matches /products and populates loaderDeps from a typed category link", async () => {
        const router = makeRouter();
        await router.load();
        render(<RouterProvider router={router} />);

        await userEvent.click(
            screen.getByRole("link", { name: "Categoría Zapatos" }),
        );

        await waitFor(() => {
            expect(String(router.state.location.pathname)).toBe("/products");
        });
        expect(router.state.location.search).toEqual({ category: "shoes" });
        expect(productsMatch(router)?.loaderDeps).toEqual({
            search: "",
            category: "shoes",
        });
        expect(productsMatch(router)?.loaderData).toEqual({
            search: "",
            category: "shoes",
        });
    });

    it("parses embedded query strings in useRouter().push into to + search", async () => {
        const router = makeRouter();
        await router.load();
        render(<RouterProvider router={router} />);

        await userEvent.click(screen.getByRole("button", { name: "Filtrar" }));

        await waitFor(() => {
            expect(String(router.state.location.pathname)).toBe("/products");
        });
        expect(router.state.location.search).toEqual({
            search: "abc",
            category: "shoes",
        });
        expect(productsMatch(router)?.loaderDeps).toEqual({
            search: "abc",
            category: "shoes",
        });
    });
});
