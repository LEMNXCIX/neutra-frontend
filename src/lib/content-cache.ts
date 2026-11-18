/**
 * Server-side tagged content cache.
 *
 * TanStack Start has no `next/cache`, so Next's
 * `fetch(url, { next: { revalidate: 60, tags: [...] } })` data cache is replaced
 * here with a small, explicit equivalent. `src/lib/strapi.ts` stores published
 * CMS entries under a `content:<tenantId>` tag with a 60s TTL, and the
 * `POST /api/revalidate` webhook purges that tag on Strapi publish.
 *
 * The module is intentionally dependency-free (and import-safe on both sides of
 * the network boundary): it never reads request scope, so it can be cleared and
 * asserted deterministically in unit tests.
 */

interface CacheEntry {
    value: unknown;
    tags: Set<string>;
    expiresAt: number;
}

type RevalidationListener = (tag: string) => void;

const entries = new Map<string, CacheEntry>();
const listeners = new Set<RevalidationListener>();

export const CONTENT_TAG_PREFIX = "content:";

export const contentTag = (tenantId: string): string =>
    `${CONTENT_TAG_PREFIX}${tenantId}`;

/** Missing entries and cached `undefined` are indistinguishable; callers cache
 *  `null` for an empty Strapi result, never `undefined`. */
export function getCached<T>(key: string, now = Date.now()): T | undefined {
    const entry = entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= now) {
        entries.delete(key);
        return undefined;
    }
    return entry.value as T;
}

export interface SetCachedOptions {
    tags?: string[];
    ttlSeconds?: number;
    now?: number;
}

export function setCached<T>(
    key: string,
    value: T,
    { tags = [], ttlSeconds = 60, now = Date.now() }: SetCachedOptions = {},
): T {
    entries.set(key, {
        value,
        tags: new Set(tags),
        expiresAt: now + ttlSeconds * 1000,
    });
    return value;
}

/** Purge every entry carrying `tag`. Returns the number of entries removed. */
export function revalidateTag(tag: string): number {
    let purged = 0;
    for (const [key, entry] of entries) {
        if (!entry.tags.has(tag)) continue;
        entries.delete(key);
        purged += 1;
    }
    return purged;
}

/** In-realm notification used by the TanStack Query bridge. The webhook calls
 *  this even when the purge found nothing, so connected query clients still
 *  refetch after a publish. */
export function notifyContentRevalidated(tag: string): void {
    for (const listener of listeners) {
        try {
            listener(tag);
        } catch {
            // One broken subscriber must not abort the webhook's HTTP response.
        }
    }
}

export function onContentRevalidated(
    listener: RevalidationListener,
): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/** Test-only reset; also useful for a process-level cache flush on deploy. */
export function clearContentCache(): void {
    entries.clear();
}

export function contentCacheSize(): number {
    return entries.size;
}

/** Test helper: number of live revalidation subscribers. Used to prove a
 *  disconnected SSE stream unsubscribes instead of leaking a listener. */
export function contentRevalidatedListenerCount(): number {
    return listeners.size;
}
