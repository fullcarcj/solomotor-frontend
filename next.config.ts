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
  /** Evita que Webpack empaquete `undici` (Agent del proxy de inventario); usa el módulo de Node en runtime. */
  serverExternalPackages: ["undici"],

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
      /** Raíz: solo App Router `(auth)/signin` — no usar rewrites a /pages (evita mezcla con manifiestos). */
      { source: "/", destination: "/signin", permanent: false },
      {
        source: "/admin-dashboard-two",
        destination: "/admin-dashboard",
        permanent: false,
      },
      /** Legacy DreamPOS: rutas eliminadas; pedidos omnicanal en ERP */
      { source: "/orders", destination: "/ventas/pedidos", permanent: false },
      {
        source: "/orders/pending-approval",
        destination: "/ventas/pedidos",
        permanent: false,
      },
    ];
  },
  // Raíz del workspace: este directorio (mismo que `package-lock.json` del frontend).
  // Evita que Next infiera otra raíz si existe otro lockfile en carpetas padre (p. ej. C:\Users\Javier\).
  outputFileTracingRoot: path.resolve(__dirname),

  eslint: {
    ignoreDuringBuilds: true,
  },

  /** Next 15: tipos en `.next/types` esperan `params: Promise<…>` en route handlers; migrar handlers o quitar cuando esté alineado. */
  typescript: {
    ignoreBuildErrors: true,
  },

  webpack: (config: any) => {
    if (process.env.NODE_ENV === "production") {
      config.cache = false;
    }

    config.ignoreWarnings = [
      { module: /customStyle\.scss/ },
      { message: /No serializer registered for Warning/ },
      { message: /autoprefixer/ },
      { message: /postcss-url-parser/ },
      { message: /Sass.*@import/ },
    ];

    return config;
  },
};

export default nextConfig;
