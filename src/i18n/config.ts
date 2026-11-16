/**
 * Idiomas del sitio público. Español es el predeterminado y vive sin prefijo
 * (/store); inglés usa /en (/en/store). El proxy reescribe las rutas sin prefijo a /es.
 * El panel /admin y las APIs no se traducen.
 */
export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";
export const LOCALE_COOKIE = "soad_lang";

export const HTML_LANG: Record<Locale, string> = { es: "es-MX", en: "en" };
/** Formato de fechas y números por idioma (los precios siempre son MXN). */
export const INTL_LOCALE: Record<Locale, string> = { es: "es-MX", en: "en-US" };
export const OG_LOCALE: Record<Locale, string> = { es: "es_MX", en: "en_US" };

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Ruta interna → ruta pública del idioma: ("en", "/store") → "/en/store". */
export function localizePath(lang: Locale, path: string): string {
  if (!path.startsWith("/") || path.startsWith("/api") || path.startsWith("/admin")) return path;
  if (lang === DEFAULT_LOCALE) return path;
  return path === "/" ? `/${lang}` : `/${lang}${path}`;
}

/** Ruta pública → ruta sin idioma: "/en/store" → "/store". */
export function stripLocale(pathname: string): string {
  for (const l of LOCALES) {
    if (pathname === `/${l}`) return "/";
    if (pathname.startsWith(`/${l}/`)) return pathname.slice(l.length + 1);
  }
  return pathname;
}
