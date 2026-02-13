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
      dynamic: 30, // cache dynamic RSC payloads client-side for 30 seconds
    },
    serverActions: {
      bodySizeLimit: '30mb', // Allow up to 30MB for video uploads (20MB file → ~27MB base64)
    },
    proxyClientMaxBodySize: '30mb', // Match server action limit for video uploads
  },
};

export default nextConfig;
