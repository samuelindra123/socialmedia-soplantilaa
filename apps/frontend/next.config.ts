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

  // Set turbopack root directory
  turbopack: {
    root: "/root/socialmedia-renunganku-bigproject",
  },

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "sgp.cloud.appwrite.io" },
      { protocol: "https", hostname: "cloud.appwrite.io" },
      // Legacy DO Spaces URLs (existing data in DB)
      { protocol: "https", hostname: "renunganku.sgp1.digitaloceanspaces.com" },
      { protocol: "https", hostname: "renunganku.sgp1.cdn.digitaloceanspaces.com" },
      // Active DO Spaces bucket
      { protocol: "https", hostname: "socialmediasoplantila.sgp1.digitaloceanspaces.com" },
      { protocol: "https", hostname: "socialmediasoplantila.sgp1.cdn.digitaloceanspaces.com" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },

  // Reduce serverless function size - important for Vercel free plan (250MB limit)
  serverExternalPackages: ["socket.io-client"],
};

export default nextConfig;
