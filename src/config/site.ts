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
    // El texto visible de cada sección viene del diccionario (t.nav[key]) según el idioma.
    { key: "home", href: "/", label: "Home" },
    { key: "music", href: "/music", label: "Music" },
    { key: "videos", href: "/videos", label: "Videos" },
    { key: "tour", href: "/tour", label: "Tour" },
    { key: "store", href: "/store", label: "Store" },
    { key: "about", href: "/about", label: "About" },
    { key: "contact", href: "/contact", label: "Contact" },
  ],
  socials: [
    { key: "instagram", label: "Instagram", short: "IG", url: null },
    { key: "facebook", label: "Facebook", short: "FB", url: null },
    { key: "tiktok", label: "TikTok", short: "TT", url: null },
    { key: "youtube", label: "YouTube", short: "YT", url: null },
    { key: "spotify", label: "Spotify", short: "SP", url: "https://open.spotify.com/artist/3wfBf4MLEJBUrY6vAuM1c0" },
  ] as Array<{ key: string; label: string; short: string; url: string | null }>,
  /** Perfil oficial de artista en Spotify (reproductor integrado en /music). */
  spotifyArtistId: "3wfBf4MLEJBUrY6vAuM1c0",
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
