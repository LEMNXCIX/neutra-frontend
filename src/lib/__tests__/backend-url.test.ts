import { afterEach, describe, expect, it, vi } from "vitest";

import { getBackendUrl } from "@/lib/backend-url";

afterEach(() => {
    vi.unstubAllEnvs();
});

describe("getBackendUrl", () => {
    it("returns the configured value when it already ends in /api", () => {
        vi.stubEnv("BACKEND_API_URL", "http://localhost:4001/api");
        expect(getBackendUrl()).toBe("http://localhost:4001/api");
    });

    it("appends /api when the configured value omits it", () => {
        vi.stubEnv("BACKEND_API_URL", "http://localhost:4001");
        expect(getBackendUrl()).toBe("http://localhost:4001/api");
    });

    it("strips trailing slashes before appending /api", () => {
        vi.stubEnv("BACKEND_API_URL", "http://localhost:4001/");
        expect(getBackendUrl()).toBe("http://localhost:4001/api");
    });

    it("adds a missing protocol", () => {
        vi.stubEnv("BACKEND_API_URL", "api:4001");
        expect(getBackendUrl()).toBe("http://api:4001/api");
    });

    it("keeps https", () => {
        vi.stubEnv("BACKEND_API_URL", "https://api.example.com/");
        expect(getBackendUrl()).toBe("https://api.example.com/api");
    });

    it("throws when BACKEND_API_URL is unset instead of guessing a host", () => {
        vi.stubEnv("BACKEND_API_URL", "");
        expect(() => getBackendUrl()).toThrow(/BACKEND_API_URL is not set/);
    });

    it("ignores NEXT_PUBLIC_API_URL so a public address cannot become a server default", () => {
        vi.stubEnv("BACKEND_API_URL", "");
        vi.stubEnv("NEXT_PUBLIC_API_URL", "http://192.168.68.105:4001/api");
        expect(() => getBackendUrl()).toThrow(/BACKEND_API_URL is not set/);
    });
});
