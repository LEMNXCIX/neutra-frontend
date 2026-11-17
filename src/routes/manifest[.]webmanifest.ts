import { createFileRoute } from "@tanstack/react-router";
import { createManifestResponse } from "@/lib/manifest";

/** Canonical PWA manifest location, matching the original Next app. */
export const Route = createFileRoute("/manifest.webmanifest")({
    server: {
        handlers: {
            GET: ({ request }) => createManifestResponse(request),
        },
    },
});
