import { createServer } from "node:http";
import entry from "../dist/server/server.mjs";
import { webHeadersToNodeHeaders } from "./serve-start-headers.mjs";
import { toWebRequest } from "./serve-start-request.mjs";

const PORT = Number(process.env.PORT ?? 3001);

createServer((req, res) => {
    toWebRequest(req, PORT)
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
