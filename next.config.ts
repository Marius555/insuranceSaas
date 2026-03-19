import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.cloud.appwrite.io',
      },
    ],
  },
  allowedDevOrigins: [
    '192.168.32.186:3000',
    '192.168.32.186',
    'savannah-unnecessary-brisbane-seek.trycloudflare.com',
    'constructional-eva-unbafflingly.ngrok-free.dev',
  ],
  experimental: {
    staleTimes: {
      dynamic: 300, // cache RSC payloads for 5 minutes
    },
    serverActions: {
      bodySizeLimit: '75mb', // Allow up to 75MB — covers 55MB video as base64 (~73MB)
    },
    proxyClientMaxBodySize: '75mb', // Match server action limit for video uploads
  },
};

export default nextConfig;
