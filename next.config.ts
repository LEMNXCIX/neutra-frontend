import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

/**
 * Hostnames this machine can be reached at, derived from its own interfaces.
 *
 * Next matches allowedDevOrigins against the Origin hostname with no port, and
 * already allows localhost and *.localhost on its own. A pinned LAN address
 * would work until the network changed; reading the interfaces at startup means
 * the dev server accepts whatever address it actually has, on whatever network
 * it is on. The nip.io entry is what makes the tenant hosts used for device
 * testing resolve, since those are `<slug>.<ip>.nip.io`.
 *
 * Inert outside development: Next only consults this list when the dev server is
 * running. Inside the compose container the interfaces are the bridge network,
 * not the host's LAN, so DEV_ORIGINS stays the escape hatch there.
 */
const localNetworkOrigins = (): string[] => {
    const origins = new Set<string>();

    for (const addresses of Object.values(networkInterfaces())) {
        for (const address of addresses ?? []) {
            if (address.family !== "IPv4" || address.internal) continue;
            origins.add(address.address);
            origins.add(`${address.address}.nip.io`);
            origins.add(`*.${address.address}.nip.io`);
        }
    }

    return [...origins];
};

/** Extra origins for cases the interfaces cannot cover, comma-separated. */
const configuredOrigins = (process.env.DEV_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const devOrigins = [
    ...new Set([...localNetworkOrigins(), ...configuredOrigins]),
];

const nextConfig: NextConfig = {
    allowedDevOrigins: devOrigins,
    turbopack: {
        root: __dirname,
    },
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "picsum.photos" },
            { protocol: "https", hostname: "images.unsplash.com" },
            { protocol: "https", hostname: "ui-avatars.com" },
        ],
    },
    async rewrites() {
        // Only server-to-server webhooks pass through. Everything else under /api is
        // a real BFF route: a missing one must 404 loudly instead of silently
        // becoming a zero-logic passthrough with no tenant context, trace id or
        // error normalization. The backend verifies the webhook signature, so this
        // rewrite must stay lossless.
        const apiUrl =
            process.env.BACKEND_API_URL ??
            process.env.NEXT_PUBLIC_API_URL ??
            "http://localhost:4001";
        const baseUrl = apiUrl.endsWith("/api") ? apiUrl : `${apiUrl}/api`;

        return [
            {
                source: "/api/webhooks/:path*",
                destination: `${baseUrl}/webhooks/:path*`,
            },
        ];
    },
};

export default nextConfig;
