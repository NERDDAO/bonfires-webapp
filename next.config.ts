import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env["ANALYZE"] === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,

  typescript: {
    ignoreBuildErrors:
      process.env["NEXT_PUBLIC_IGNORE_BUILD_ERROR"] === "true",
  },

  // Server-side external packages (works with both Turbopack and webpack)
  serverExternalPackages: ["pino-pretty", "lokijs", "encoding"],

  // Turbopack configuration (Next.js 16+ default bundler)
  turbopack: {
    resolveAlias: {
      // Node.js built-in stubs for client bundles (Web3 compatibility)
      fs: { browser: "./src/lib/empty-module.ts" },
      net: { browser: "./src/lib/empty-module.ts" },
      tls: { browser: "./src/lib/empty-module.ts" },
    },
  },

  // Webpack fallback for Web3 compatibility
  // Only used with --webpack flag; Turbopack is the default bundler in Next.js 16+
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default withBundleAnalyzer(nextConfig);
