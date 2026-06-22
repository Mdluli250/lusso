import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Move this out of experimental
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg"],
  // Allow dev access from 127.0.0.1
  allowedDevOrigins: ["127.0.0.1"],
  // Allow external images (Google profile photos)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        // Allow Vercel Blob Storage public buckets (e.g. <id>.public.blob.vercel-storage.com)
        hostname: '*.vercel-storage.com',
      },
    ],
  },
};

export default nextConfig;
