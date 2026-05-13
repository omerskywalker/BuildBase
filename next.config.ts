import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  allowedDevOrigins: ["*.spock.replit.dev", "*.replit.dev"],
};

export default nextConfig;
