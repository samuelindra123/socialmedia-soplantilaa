import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Vercel free plan optimizations
  output: "standalone",

  // Compress responses
  compress: true,

  // Reduce bundle size
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "date-fns",
    ],
  },

  // Turbopack for faster dev builds (not used in production)
  turbopack: {
    root: process.cwd(),
  },

  images: {
    // Use Vercel's image optimization (free tier: 1000 images/month)
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache
    remotePatterns: [
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "renunganku.sgp1.digitaloceanspaces.com" },
      { protocol: "https", hostname: "renunganku.sgp1.cdn.digitaloceanspaces.com" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },

  // Reduce serverless function size - important for Vercel free plan (250MB limit)
  serverExternalPackages: ["socket.io-client"],
};

export default nextConfig;
