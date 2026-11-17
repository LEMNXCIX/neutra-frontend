// @vitest-environment happy-dom
/** The browser half of the revalidation bridge: QueryProvider registers its
 *  client and refetches when Strapi publishes new content. */
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { notifyContentRevalidated } from "@/lib/content-cache";
import { registeredQueryClientCount } from "@/lib/query-invalidation";
import { QueryProvider } from "@/providers/query-provider";

let captured: QueryClient | undefined;

function CaptureClient() {
    captured = useQueryClient();
    return null;
}

class FakeEventSource {
    static instances: FakeEventSource[] = [];
    handlers = new Map<string, Array<() => void>>();
    closed = false;

    constructor(readonly url: string) {
        FakeEventSource.instances.push(this);
    }

    addEventListener(type: string, handler: () => void) {
        this.handlers.set(type, [...(this.handlers.get(type) ?? []), handler]);
    }

    removeEventListener(type: string, handler: () => void) {
        this.handlers.set(
            type,
            (this.handlers.get(type) ?? []).filter((h) => h !== handler),
        );
    }

    close() {
        this.closed = true;
    }

    emit(type: string) {
        for (const handler of this.handlers.get(type) ?? []) handler();
    }
}

afterEach(() => {
    captured = undefined;
    FakeEventSource.instances.length = 0;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe("QueryProvider revalidation bridge", () => {
    it("registers its QueryClient and invalidates it on a content event", () => {
        const baseline = registeredQueryClientCount();
        const invalidate = vi.spyOn(QueryClient.prototype, "invalidateQueries");

        const view = render(
            <QueryProvider>
                <CaptureClient />
            </QueryProvider>,
        );

        expect(captured).toBeInstanceOf(QueryClient);
        expect(registeredQueryClientCount()).toBe(baseline + 1);

        act(() => {
            notifyContentRevalidated("content:tenant-1");
        });
        expect(invalidate).toHaveBeenCalledTimes(1);

        view.unmount();
        expect(registeredQueryClientCount()).toBe(baseline);
    });

    it("subscribes to the server SSE feed and refetches on a publish event", () => {
        vi.stubGlobal("EventSource", FakeEventSource);
        const invalidate = vi.spyOn(QueryClient.prototype, "invalidateQueries");

        const view = render(
            <QueryProvider>
                <CaptureClient />
            </QueryProvider>,
        );

        const source = FakeEventSource.instances[0];
        expect(source.url).toBe("/api/revalidate/events");
        act(() => source.emit("message"));
        expect(invalidate).toHaveBeenCalledTimes(1);

        view.unmount();
        expect(source.closed).toBe(true);
    });
});
