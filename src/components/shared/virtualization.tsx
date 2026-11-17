"use client";

/**
 * Shared TanStack Virtual helpers. Item markup is owned by the caller: the
 * helpers only render a scroll viewport, a sizer and the window of rows that is
 * currently visible. Rows are measured dynamically so the sizer follows the
 * real content height at every breakpoint, not a single estimate constant.
 */
import {
    measureElement as defaultMeasureElement,
    observeElementRect,
    type Rect,
    useVirtualizer,
    type VirtualItem,
    type Virtualizer,
} from "@tanstack/react-virtual";
import { type ReactNode, type RefObject, useRef } from "react";

// Matches `max-h-[min(900px,70vh)]` on the scroll viewport; also used as the
// headless-DOM fallback rect where no layout measurement is available.
const FALLBACK_VIEWPORT_HEIGHT = 900;
const DEFAULT_OVERSCAN = 4;
const SCROLL_VIEWPORT_CLASS = "max-h-[min(900px,70vh)] overflow-y-auto";

/**
 * Headless DOM environments report a 0x0 rect. Ignore those so the virtualizer
 * keeps the fallback rect instead of rendering nothing; real browsers still
 * forward their measured size as normal.
 */
const observeMeasuredRect = <
    TScrollElement extends Element,
    TItemElement extends Element,
>(
    instance: Virtualizer<TScrollElement, TItemElement>,
    cb: (rect: Rect) => void,
) =>
    observeElementRect(instance, (rect) => {
        if (rect.height > 0 || rect.width > 0) cb(rect);
    });

/**
 * Use the real rendered height when it is available, otherwise fall back to
 * the estimate. This keeps dynamic sizing in browsers while making headless
 * tests (where offsetHeight is 0) deterministic.
 */
const measureWithFallback = <
    TScrollElement extends Element,
    TItemElement extends Element,
>(
    element: TItemElement,
    entry: ResizeObserverEntry | undefined,
    instance: Virtualizer<TScrollElement, TItemElement>,
): number => {
    const measured = defaultMeasureElement(element, entry, instance);
    return measured > 0
        ? measured
        : instance.options.estimateSize(instance.indexFromElement(element));
};

export type VirtualRange = {
    scrollRef: RefObject<HTMLDivElement | null>;
    virtualItems: VirtualItem[];
    totalSize: number;
    paddingTop: number;
    paddingBottom: number;
    /** Attach as `ref` plus `data-index` on each caller-rendered row. */
    measureElement: (node: Element | null) => void;
};

export function useVirtualRange({
    count,
    estimateSize,
    height = FALLBACK_VIEWPORT_HEIGHT,
    overscan = DEFAULT_OVERSCAN,
}: {
    count: number;
    estimateSize: () => number;
    height?: number;
    overscan?: number;
}): VirtualRange {
    const scrollRef = useRef<HTMLDivElement>(null);
    const virtualizer = useVirtualizer({
        count,
        getScrollElement: () => scrollRef.current,
        estimateSize,
        overscan,
        initialRect: { width: 0, height },
        observeElementRect: observeMeasuredRect,
        measureElement: measureWithFallback,
    });

    const virtualItems = virtualizer.getVirtualItems();
    const totalSize = virtualizer.getTotalSize();
    const first = virtualItems[0];
    const last = virtualItems[virtualItems.length - 1];

    return {
        scrollRef,
        virtualItems,
        totalSize,
        paddingTop: first ? first.start : 0,
        paddingBottom: last ? Math.max(0, totalSize - last.end) : 0,
        measureElement: virtualizer.measureElement as (
            node: Element | null,
        ) => void,
    };
}

export type VirtualizedRowsProps<T> = {
    items: T[];
    estimateSize: () => number;
    getItemKey: (item: T, index: number) => string | number;
    renderRow: (item: T, index: number) => ReactNode;
    height?: number;
    overscan?: number;
    className?: string;
    contentClassName?: string;
    rowClassName?: string;
};

export function VirtualizedRows<T>({
    items,
    estimateSize,
    getItemKey,
    renderRow,
    height = FALLBACK_VIEWPORT_HEIGHT,
    overscan = DEFAULT_OVERSCAN,
    className,
    contentClassName,
    rowClassName,
}: VirtualizedRowsProps<T>) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => scrollRef.current,
        estimateSize,
        overscan,
        initialRect: { width: 0, height },
        observeElementRect: observeMeasuredRect,
        measureElement: measureWithFallback,
        getItemKey: (index) => getItemKey(items[index], index),
    });

    return (
        <div
            ref={scrollRef}
            className={[SCROLL_VIEWPORT_CLASS, className]
                .filter(Boolean)
                .join(" ")}
        >
            <div
                className={contentClassName}
                style={{
                    height: virtualizer.getTotalSize(),
                    position: "relative",
                    width: "100%",
                }}
            >
                {virtualizer.getVirtualItems().map((virtualRow) => (
                    <div
                        key={virtualRow.key}
                        ref={virtualizer.measureElement}
                        data-index={virtualRow.index}
                        data-virtual-row=""
                        className={rowClassName}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualRow.start}px)`,
                        }}
                    >
                        {renderRow(items[virtualRow.index], virtualRow.index)}
                    </div>
                ))}
            </div>
        </div>
    );
}
