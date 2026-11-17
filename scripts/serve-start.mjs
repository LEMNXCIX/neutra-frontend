import { createServer } from "node:http";
import entry from "../dist/server/server.mjs";
import { webHeadersToNodeHeaders } from "./serve-start-headers.mjs";

const PORT = Number(process.env.PORT ?? 3001);

/** Adapt Node's HTTP request into the Web Request the Start entry expects. */
async function toWebRequest(req) {
    const host = req.headers.host ?? `localhost:${PORT}`;
    const url = new URL(req.url ?? "/", `http://${host}`);
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
        if (value === undefined) continue;
        for (const item of Array.isArray(value) ? value : [value]) {
            headers.append(name, item);
        }
    }

    const method = req.method ?? "GET";
    const body =
        method === "GET" || method === "HEAD"
            ? undefined
            : new Promise((resolve, reject) => {
                  const chunks = [];
                  req.on("data", (chunk) => chunks.push(chunk));
                  req.on("end", () => resolve(Buffer.concat(chunks)));
                  req.on("error", reject);
              });

    return new Request(url, { method, headers, body });
}

createServer((req, res) => {
    toWebRequest(req)
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
            for await (const chunk of response.body) {
                res.write(chunk);
            }
            res.end();
        })
        .catch((error) => {
            console.error(error);
            res.writeHead(500, { "content-type": "text/plain" });
            res.end("Internal Server Error");
        });
}).listen(PORT, () => {
    console.log(`TanStack Start listening on http://localhost:${PORT}`);
});
