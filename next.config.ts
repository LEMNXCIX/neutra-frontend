import type { NextConfig } from "next";

/**
 * Hostnames the dev server accepts cross-origin requests from (HMR websocket).
 * Comma-separated in DEV_ORIGINS, e.g. `192.168.68.100,*.192.168.68.100.nip.io`.
 *
 * No IP is hardcoded here on purpose: a pinned LAN address silently breaks HMR
 * for everyone on a different network. Same-origin localhost needs no entry.
 */
const devOrigins = (process.env.DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  allowedDevOrigins: devOrigins,
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
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
      'http://localhost:4001';
    const baseUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;

    return [
      {
        source: '/api/webhooks/:path*',
        destination: `${baseUrl}/webhooks/:path*`,
      },
    ];
  },
};

export default nextConfig;
