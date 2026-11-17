// @vitest-environment node

import { describe, expect, it } from "vitest";
import { webHeadersToNodeHeaders } from "../../scripts/serve-start-headers.mjs";

describe("webHeadersToNodeHeaders", () => {
    it("keeps two Set-Cookie values as separate entries for Node writeHead", () => {
        const headers = new Headers();
        headers.append("content-type", "text/plain");
        headers.append("set-cookie", "session=abc; Path=/; HttpOnly");
        headers.append("set-cookie", "theme=dark; Path=/");

        const nodeHeaders = webHeadersToNodeHeaders(headers);

        expect(nodeHeaders["set-cookie"]).toEqual([
            "session=abc; Path=/; HttpOnly",
            "theme=dark; Path=/",
        ]);
        expect(nodeHeaders["content-type"]).toBe("text/plain");
    });

    it("does not add a set-cookie key when none is present", () => {
        const headers = new Headers({ "content-type": "text/plain" });

        expect(webHeadersToNodeHeaders(headers)).toEqual({
            "content-type": "text/plain",
        });
    });
});
