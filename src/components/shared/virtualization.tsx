"use client";

/**
 * Shared TanStack Virtual helpers. Item markup is owned by the caller: the
 * helpers only render a fixed-height scroll viewport, a sizer and the window
 * of rows that is currently visible.
 */
import {
    observeElementRect,
    useVirtualizer,
    type VirtualItem,
} from "@tanstack/react-virtual";
import { type ReactNode, type RefObject, useRef } from "react";

const DEFAULT_HEIGHT = 900;
const DEFAULT_OVERSCAN = 4;

/**
 * Headless DOM environments report a 0x0 rect. Ignore those so the virtualizer
 * keeps the fixed-height `initialRect` instead of rendering nothing; real
 * browsers still forward their measured size as normal.
 */
const observeMeasuredRect = (
    instance: Parameters<typeof observeElementRect>[0],
    cb: (rect: { width: number; height: number }) => void,
) =>
    observeElementRect(instance, (rect) => {
        if (rect.height > 0 || rect.width > 0) cb(rect);
    });

export type VirtualRange = {
    scrollRef: RefObject<HTMLDivElement | null>;
    virtualItems: VirtualItem[];
    totalSize: number;
    paddingTop: number;
    paddingBottom: number;
};

export function useVirtualRange({
    count,
    estimateSize,
    height = DEFAULT_HEIGHT,
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
    height = DEFAULT_HEIGHT,
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
        getItemKey: (index) => getItemKey(items[index], index),
    });

    return (
        <div
            ref={scrollRef}
            className={className}
            style={{ height, overflowY: "auto" }}
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
