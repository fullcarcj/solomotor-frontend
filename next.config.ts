import path from "path";

/** Base REST de imágenes Firebase (misma URL en servidor y cliente). Incluye VITE_IMG_BASE_URL por compatibilidad con deploys que solo tenían las vars del Vite antiguo (tienda-repuestos). */
function productImageBaseFromProcessEnv(): string {
  return (
    process.env.NEXT_PUBLIC_PRODUCT_IMAGE_BASE_URL ||
    process.env.PRODUCT_IMAGE_BASE_URL ||
    process.env.VITE_IMG_BASE_URL ||
    ""
  ).trim();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    PRODUCT_IMAGE_BASE_URL: productImageBaseFromProcessEnv(),
    // Misma URL en cliente (inlined en build). next.config no expone import.meta.env.VITE_*; duplicamos aquí.
    NEXT_PUBLIC_PRODUCT_IMAGE_BASE_URL: productImageBaseFromProcessEnv(),
    /** Carpeta en el bucket antes del SKU (p.ej. products, o productos si es legado). Vacío en build = default en código "products". */
    PRODUCT_IMAGE_STORAGE_PREFIX:
      process.env.PRODUCT_IMAGE_STORAGE_PREFIX ||
      process.env.NEXT_PUBLIC_PRODUCT_IMAGE_STORAGE_PREFIX ||
      "",
    NEXT_PUBLIC_PRODUCT_IMAGE_STORAGE_PREFIX:
      process.env.NEXT_PUBLIC_PRODUCT_IMAGE_STORAGE_PREFIX ||
      process.env.PRODUCT_IMAGE_STORAGE_PREFIX ||
      "",
  },

  async redirects() {
    return [
      {
        source: "/admin-dashboard-two",
        destination: "/admin-dashboard",
        permanent: false,
      },
    ];
  },

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
