import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
   async rewrites() {
    return [
      {
        source: '/', // the URL you want in browser
        destination: '/signin',   // actual page under /pages/index.tsx
      },
     ];
  },
  // Explicitly set the workspace root to avoid "multiple lockfiles" warning
  // Adjust this if your real monorepo root is different.
  outputFileTracingRoot: path.join(__dirname),

  eslint: {
    ignoreDuringBuilds: true,
  },

  webpack: (config:any) => {
    // Fix: Prevent Webpack from trying to serialize warnings (causing your issue)
    config.cache = {
      type: "memory", // prevents "No serializer registered for Warning"
    };

    // Keep your current ignored warnings
    config.ignoreWarnings = [
      {
        module: /customStyle\.scss/,
      },
      {
        message: /No serializer registered for Warning/,
      },
    ];

    return config;
 
  },
};

export default nextConfig;
