import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use a unique build directory per port during development to avoid conflicts
  distDir: process.env.NODE_ENV === 'development' && process.env.PORT
    ? `.next-${process.env.PORT}`
    : '.next',
  images: {
    domains: ['picsum.photos', 'images.unsplash.com', 'ui-avatars.com'],
    // allow remote patterns if needed
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
};

export default nextConfig;
