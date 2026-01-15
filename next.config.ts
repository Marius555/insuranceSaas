import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'http://192.168.32.186:3000',
    '192.168.32.186',
    'local://*',
    'https://savannah-unnecessary-brisbane-seek.trycloudflare.com',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '30mb', // Allow up to 30MB for video uploads (20MB file → ~27MB base64)
    },
  },
};

export default nextConfig;
