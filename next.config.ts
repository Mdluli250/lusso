import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for smaller Docker/Vercel deployments
  output: 'standalone',
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
  // Reduce bundle size by excluding heavy server-only packages from client
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle these on the client — they're server-only
      config.resolve.alias = {
        ...config.resolve.alias,
        'pdfkit': false,
      };
    }
    return config;
  },
};

export default nextConfig;
