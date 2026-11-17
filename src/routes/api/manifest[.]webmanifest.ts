import { createFileRoute } from "@tanstack/react-router";
import { createManifestResponse } from "@/lib/manifest";

/** Legacy alias kept for existing links; canonical route is /manifest.webmanifest. */
export const Route = createFileRoute("/api/manifest.webmanifest")({
    server: {
        handlers: {
            GET: ({ request }) => createManifestResponse(request),
        },
    },
});
