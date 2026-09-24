import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.68.100',
    '192.168.68.100.nip.io',
    // Tenant URLs use <slug>.<lan-ip>.nip.io during local development.
    '*.192.168.68.100.nip.io',
  ],
  turbopack: {
    root: __dirname,
  },
  // Use a unique build directory per port during development to avoid conflicts
  distDir: process.env.NODE_ENV === 'development' && process.env.PORT
    ? `.next-${process.env.PORT}`
    : '.next',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
    ],
  },
  async rewrites() {
    const apiUrl =
      process.env.BACKEND_API_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      'http://localhost:4001';
    const baseUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;

    return [
      {
        source: '/api/:path*',
        destination: `${baseUrl}/:path*`,
      },
      {
        source: '/api/auth/:path*',
        destination: `${baseUrl}/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
