import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  // Avoid stale production SW intercepting dev chunks (ChunkLoadError)
  register: process.env.NODE_ENV === "production",
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    importScripts: ["/push-handler.js"],
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Hides the floating Next.js "N" badge in development (still shows on errors)
  devIndicators: false,
};

export default withPWA(nextConfig);
