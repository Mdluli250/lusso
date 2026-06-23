import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma and pg run server-side only — exclude from client bundle
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  // Allow dev access from 127.0.0.1
  allowedDevOrigins: ["127.0.0.1"],
  // Allow external images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.vercel-storage.com',
      },
    ],
  },
  // Empty turbopack config silences the webpack/turbopack conflict warning
  // and confirms we are intentionally using Turbopack with no custom config
  turbopack: {},
};

export default nextConfig;
