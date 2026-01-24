import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,

  typescript: {
    ignoreBuildErrors:
      process.env["NEXT_PUBLIC_IGNORE_BUILD_ERROR"] === "true",
  },

  // Turbopack configuration (Next.js 16+ default)
  // Empty config to allow webpack fallback for Web3 compatibility
  turbopack: {},

  // Webpack configuration for Web3 compatibility
  // Note: Used when running with --webpack flag or in certain build scenarios
  webpack: (config) => {
    // Node.js polyfills - set to false for browser
    config.resolve.fallback = { fs: false, net: false, tls: false };

    // External packages that should not be bundled
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
    // Enable server actions
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
