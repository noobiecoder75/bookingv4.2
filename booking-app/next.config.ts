import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

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
