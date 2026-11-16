import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad aplicadas a todas las rutas.
 * La CSP completa (con nonce) se configurará en la Fase 5, cuando se
 * conozcan los dominios definitivos de pagos (Mercado Pago / Stripe),
 * analítica y almacenamiento de imágenes.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  experimental: {
    // 404 global: el sitio (app/[lang]) y el panel (app/admin) tienen layouts raíz distintos.
    globalNotFound: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Miniaturas de YouTube para la galería de videos.
      { protocol: "https", hostname: "i.ytimg.com" },
      // Agregar aquí el dominio del almacenamiento de objetos (S3 / R2) en Fase 4.
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
