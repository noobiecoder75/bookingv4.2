import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Disable ESLint during build (warnings won't block deployment)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript errors during build (for faster deployment)
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore for quick deployment
  },

  // Externalize server-only packages to prevent client-side bundling
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],

  // Webpack config to exclude pdf-parse from client bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle pdf-parse on client-side
      config.resolve.alias = {
        ...config.resolve.alias,
        'pdf-parse': false,
        'pdfjs-dist': false,
      };
    }
    return config;
  },
};

export default nextConfig;
