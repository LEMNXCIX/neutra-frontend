/**
 * TanStack Query invalidation bridge.
 *
 * QueryClient instances live in a realm (the browser, or the server during
 * SSR). The revalidate webhook runs on the server, so it can only invalidate
 * clients registered in its own realm; the browser half subscribes to the
 * in-realm revalidation event from `content-cache` (see QueryProvider).
 *
 * Registering is explicit and returns an unsubscribe function, so tests and
 * hot reloads never leave stale clients behind.
 */
import type { QueryClient } from "@tanstack/react-query";

const registered = new Set<QueryClient>();

export function registerQueryClient(client: QueryClient): () => void {
    registered.add(client);
    return () => {
        registered.delete(client);
    };
}

/** Invalidate every registered client. Returns the number of clients notified. */
export function invalidateContentQueries(): number {
    for (const client of registered) {
        // `invalidateQueries` resolves on its own; the webhook does not wait for
        // a refetch, only for the invalidation to be scheduled.
        void client.invalidateQueries();
    }
    return registered.size;
}

export function registeredQueryClientCount(): number {
    return registered.size;
}
