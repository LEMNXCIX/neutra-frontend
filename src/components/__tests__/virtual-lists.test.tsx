// @vitest-environment happy-dom

import { render } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

const mocks = vi.hoisted(() => ({
    addItem: vi.fn(),
    getAll: vi.fn(),
}));

// Product cards render `Link` from the router; forward it to a real anchor so
// the card markup renders exactly as it does in the app.
vi.mock("@tanstack/react-router", async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
        ...actual,
        Link: ({
            to,
            children,
            ...rest
        }: {
            to?: string;
            children?: ReactNode;
            [key: string]: unknown;
        }) =>
            createElement(
                "a",
                { href: typeof to === "string" ? to : "#", ...rest },
                children,
            ),
    };
});

vi.mock("@/hooks/use-cart", () => ({
    useCart: () => ({ addItem: mocks.addItem }),
}));

vi.mock("@/services/log.service", () => ({
    logService: { getAll: (...args: unknown[]) => mocks.getAll(...args) },
}));

import { LogsClient } from "@/components/admin/logs/logs-client";
import ProductGrid from "@/components/product-grid";
import type { LogEntry } from "@/services/log.service";

const PRODUCTS = Array.from({ length: 500 }, (_, index) => ({
    id: `product-${index}`,
    title: `Producto ${index + 1}`,
    price: 10 + index,
    description: "Descripción de prueba",
    stock: 10,
}));

const LOGS: LogEntry[] = Array.from({ length: 500 }, (_, index) => ({
    id: `log-${index}`,
    timestamp: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
    level: "INFO",
    method: "GET",
    url: `/api/recurso/${index}`,
    statusCode: 200,
    duration: 12,
    message: `Mensaje de prueba ${index}`,
    traceId: `trace-${index}`,
}));

beforeAll(() => {
    if (!globalThis.ResizeObserver) {
        class ResizeObserverStub {
            observe() {}
            unobserve() {}
            disconnect() {}
        }
        globalThis.ResizeObserver =
            ResizeObserverStub as unknown as typeof ResizeObserver;
    }
    // TanStack Virtual sizes its viewport from clientWidth/clientHeight.
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
        configurable: true,
        get: () => 900,
    });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
        configurable: true,
        get: () => 1200,
    });
});

describe("virtualized product lists", () => {
    it("renders fewer than 50 DOM cards for 500 products in grid view", () => {
        const { container } = render(<ProductGrid products={PRODUCTS} />);
        const cards = container.querySelectorAll('[data-slot="card"]');
        expect(cards.length).toBeGreaterThan(0);
        expect(cards.length).toBeLessThan(50);
    });

    it("renders fewer than 50 DOM cards for 500 products in list view", () => {
        const { container } = render(
            <ProductGrid products={PRODUCTS} viewMode="list" />,
        );
        const cards = container.querySelectorAll('[data-slot="card"]');
        expect(cards.length).toBeGreaterThan(0);
        expect(cards.length).toBeLessThan(50);
    });
});

describe("virtualized log list", () => {
    it("renders fewer than 50 desktop table rows for 500 logs", () => {
        mocks.getAll.mockResolvedValue([]);
        const { container } = render(
            <LogsClient
                initialLogs={LOGS}
                initialTotal={LOGS.length}
                tenants={[]}
            />,
        );
        const rows = container.querySelectorAll(
            '[data-slot="table-body"] [data-slot="table-row"]',
        );
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.length).toBeLessThan(50);
    });
});
