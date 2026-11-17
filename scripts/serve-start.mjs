import { createServer } from "node:http";
import entry from "../dist/server/server.mjs";
import { webHeadersToNodeHeaders } from "./serve-start-headers.mjs";
import {
    createRequestAbortController,
    toWebRequest,
} from "./serve-start-request.mjs";

const PORT = Number(process.env.PORT ?? 3001);

createServer((req, res) => {
    // A disconnect must reach the Start handler's AbortSignal, otherwise a
    // streaming response (SSE) keeps its heartbeat timer and listener forever.
    const controller = createRequestAbortController(req, res);
    toWebRequest(req, PORT, controller.signal)
        .then((request) => entry.fetch(request))
        .then(async (response) => {
            res.writeHead(
                response.status,
                webHeadersToNodeHeaders(response.headers),
            );
            if (!response.body) {
                res.end();
                return;
            }
            // Belt and suspenders: cancelling the Web stream also runs the
            // stream's cancel() cleanup if the handler ignores the signal.
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
        })
        .catch((error) => {
            console.error(error);
            if (!res.headersSent) {
                res.writeHead(500, { "content-type": "text/plain" });
            }
            res.end("Internal Server Error");
        });
}).listen(PORT, () => {
    console.log(`TanStack Start listening on http://localhost:${PORT}`);
});
