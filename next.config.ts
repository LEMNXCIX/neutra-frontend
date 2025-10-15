import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['picsum.photos', 'images.unsplash.com', 'ui-avatars.com'],
    // allow remote patterns if needed
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
};

export default nextConfig;
