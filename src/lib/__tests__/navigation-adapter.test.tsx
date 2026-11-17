// @vitest-environment happy-dom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    navigate: vi.fn(),
    location: { pathname: "/admin/users", searchStr: "", search: {} },
    history: { back: vi.fn(), forward: vi.fn() },
    invalidate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
    useNavigate: () => mocks.navigate,
    useLocation: (opts?: {
        select?: (state: typeof mocks.location) => unknown;
    }) => (opts?.select ? opts.select(mocks.location) : mocks.location),
    useRouter: () => ({
        invalidate: mocks.invalidate,
        history: mocks.history,
    }),
}));

import { useRouter } from "@/lib/navigation";

describe("navigation adapter options", () => {
    it("splits an embedded query into to + search instead of one opaque path", () => {
        const { result } = renderHook(() => useRouter());

        act(() => {
            result.current.push("/products?search=abc&category=shoes");
        });

        expect(mocks.navigate).toHaveBeenCalledWith({
            to: "/products",
            search: { search: "abc", category: "shoes" },
        });
    });

    it("keeps the current pathname for a query-only push", () => {
        mocks.navigate.mockClear();
        const { result } = renderHook(() => useRouter());

        act(() => {
            result.current.push("?page=2&status=active");
        });

        expect(mocks.navigate).toHaveBeenCalledWith({
            to: "/admin/users",
            search: { page: "2", status: "active" },
        });
    });

    it("uses window.location for absolute URLs", () => {
        mocks.navigate.mockClear();
        const { result } = renderHook(() => useRouter());
        const assign = vi.fn();
        vi.stubGlobal("location", { assign });

        act(() => {
            result.current.push("http://shop.localhost:3001/store");
        });

        expect(assign).toHaveBeenCalledWith("http://shop.localhost:3001/store");
        expect(mocks.navigate).not.toHaveBeenCalled();
    });
});
