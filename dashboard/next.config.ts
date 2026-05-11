import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: {
    appIsrStatus: false,
  },
} as any;

// Try at top level
(nextConfig as any).allowedDevOrigins = ['192.168.0.13', 'localhost:3000'];

export default nextConfig;
