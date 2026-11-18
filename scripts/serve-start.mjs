import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import entry from "../dist/server/server.mjs";
import { webHeadersToNodeHeaders } from "./serve-start-headers.mjs";
import {
    createRequestAbortController,
    toWebRequest,
} from "./serve-start-request.mjs";
import { contentType, resolveStaticFile } from "./serve-start-static.mjs";

const PORT = Number(process.env.PORT ?? 3001);

async function handleRequest(req, res) {
    const pathname = new URL(req.url ?? "/", "http://localhost").pathname;

    // Vite emits static assets into dist/client. The Start fetch handler does
    // not serve files from disk, so the Node adapter must do it before handing
    // the request to the router (routes and SPA fallbacks stay with Start).
    const staticFile = await resolveStaticFile(pathname);
    if (staticFile) {
        res.writeHead(200, {
            "content-type": contentType(staticFile),
            "cache-control": pathname.startsWith("/assets/")
                ? "public, max-age=31536000, immutable"
                : "public, max-age=3600",
        });
        if (req.method === "HEAD") {
            res.end();
            return;
        }
        await new Promise((resolve, reject) => {
            const stream = createReadStream(staticFile);
            stream.on("error", reject);
            stream.on("end", resolve);
            stream.pipe(res);
        });
        return;
    }

    // A disconnect must reach the Start handler's AbortSignal, otherwise a
    // streaming response (SSE) keeps its heartbeat timer and listener forever.
    const controller = createRequestAbortController(req, res);
    const request = await toWebRequest(req, PORT, controller.signal);
    const response = await entry.fetch(request);

    res.writeHead(response.status, webHeadersToNodeHeaders(response.headers));
    if (!response.body) {
        res.end();
        return;
    }
    // Belt and suspenders: cancelling the Web stream also runs the stream's
    // cancel() cleanup if the handler ignores the signal.
    const cancelBody = () => {
        void response.body.cancel().catch(() => {});
    };
    res.once("close", cancelBody);
    try {
        for await (const chunk of response.body) {
            if (res.destroyed || controller.signal.aborted) break;
            res.write(chunk);
        }
    } finally {
        res.removeListener("close", cancelBody);
        if (!res.writableEnded && !res.destroyed) res.end();
    }
}

createServer((req, res) => {
    handleRequest(req, res).catch((error) => {
        console.error(error);
        if (!res.headersSent) {
            res.writeHead(500, { "content-type": "text/plain" });
        }
        res.end("Internal Server Error");
    });
}).listen(PORT, () => {
    console.log(`TanStack Start listening on http://localhost:${PORT}`);
});
