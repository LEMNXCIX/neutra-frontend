/**
 * Regression test for the Node -> Web Request adapter used by the production
 * server. A previous version handed a Promise to `new Request({ body })`, which
 * Node stringified to "[object Promise]"; every BFF POST (including the Strapi
 * revalidate webhook) then failed to parse its JSON body in the real image.
 */
import { EventEmitter } from "node:events";
import { describe, expect, it } from "vitest";
import { toWebRequest } from "../scripts/serve-start-request.mjs";

function nodeRequest(method: string, chunks: string[]): EventEmitter {
    const req = new EventEmitter() as EventEmitter & {
        headers: Record<string, string>;
        url: string;
        method: string;
    };
    req.headers = { host: "store.localhost:3001" };
    req.url = "/api/revalidate";
    req.method = method;
    // Emit on the next tick, like a real IncomingMessage.
    process.nextTick(() => {
        for (const chunk of chunks) req.emit("data", Buffer.from(chunk));
        req.emit("end");
    });
    return req;
}

describe("serve-start request adapter", () => {
    it("turns streamed POST bytes into a parseable JSON body", async () => {
        const request = await toWebRequest(
            nodeRequest("POST", ['{"entry":', '{"tenantId":"t1"}}']),
            3001,
        );

        expect(request.url).toBe("http://store.localhost:3001/api/revalidate");
        expect(await request.json()).toEqual({ entry: { tenantId: "t1" } });
    });

    it("leaves GET requests bodyless", async () => {
        const request = await toWebRequest(nodeRequest("GET", []), 3001);
        expect(request.body).toBeNull();
    });

    it("preserves multi-valued headers", async () => {
        const req = nodeRequest("POST", ["{}"]) as EventEmitter & {
            headers: Record<string, string | string[]>;
        };
        req.headers["set-cookie"] = ["a=1", "b=2"];
        const request = await toWebRequest(req, 3001);
        expect(request.headers.getSetCookie()).toEqual(["a=1", "b=2"]);
    });
});
