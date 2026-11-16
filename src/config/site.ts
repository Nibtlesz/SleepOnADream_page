/**
 * Configuración global del sitio.
 * ⚠️ Los enlaces de redes y correos son MARCADORES: reemplazar por los oficiales.
 * Un valor `null` oculta o deshabilita el enlace correspondiente.
 */
export const siteConfig = {
  name: "Sleep On a Dream",
  shortName: "SOAD",
  description:
    "Sitio oficial de Sleep On a Dream: música, videos, fechas de concierto y tienda oficial.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "es_MX",
  nav: [
    { href: "/", label: "Home" },
    { href: "/music", label: "Music" },
    { href: "/videos", label: "Videos" },
    { href: "/tour", label: "Tour" },
    { href: "/store", label: "Store" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ],
  socials: [
    { key: "instagram", label: "Instagram", short: "IG", url: null },
    { key: "facebook", label: "Facebook", short: "FB", url: null },
    { key: "tiktok", label: "TikTok", short: "TT", url: null },
    { key: "youtube", label: "YouTube", short: "YT", url: null },
    { key: "spotify", label: "Spotify", short: "SP", url: null },
  ] as Array<{ key: string; label: string; short: string; url: string | null }>,
  contact: {
    booking: null as string | null, // p. ej. "booking@dominio.mx"
    press: null as string | null,
    store: null as string | null,
  },
  legal: [
    { slug: "privacidad", label: "Aviso de privacidad" },
    { slug: "terminos", label: "Términos y condiciones" },
    { slug: "envios-y-devoluciones", label: "Envíos y devoluciones" },
  ],
} as const;

export type NavItem = (typeof siteConfig.nav)[number];
