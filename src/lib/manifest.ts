/**
 * PWA manifest payload shared by the canonical `/manifest.webmanifest` route
 * and the legacy `/api/manifest.webmanifest` alias. The tenant name still
 * comes from the subdomain of the request Host, as in the original Next app.
 */
export function createManifestResponse(request: Request): Response {
    const host = request.headers.get("host") || "";

    let tenantName = "XCIX";
    const parts = host.split(".");
    if (parts.length >= 3 && parts[0] !== "www" && parts[0] !== "api") {
        tenantName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }

    return Response.json({
        id: "/",
        name: `${tenantName} Platform`,
        short_name: tenantName,
        description: `Mobile app for ${tenantName}`,
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        icons: [
            {
                src: "/icon.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "any",
            },
            {
                src: "/icon.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "maskable",
            },
        ],
    });
}
