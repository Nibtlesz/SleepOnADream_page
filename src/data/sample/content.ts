/**
 * ⚠️ DATOS DE EJEMPLO — NO SON INFORMACIÓN OFICIAL DE LA BANDA.
 * Sirven solo para maquetar. Se reemplazarán por el contenido real
 * administrado desde el panel (Fase 4). Todos llevan `isSample: true`.
 */
import type { NewsPost, Release, Show } from "@/lib/types";

const tracks = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    position: i + 1,
    title: `Pista de ejemplo ${String(i + 1).padStart(2, "0")}`,
    durationS: 180 + ((i * 37) % 90),
  }));

const noLinks = { spotify: null, appleMusic: null, youtubeMusic: null };

/** Lanzamientos de ejemplo visibles (ninguno: ya hay discografía oficial en data/official/releases.ts). */
export const sampleReleases: Release[] = [];

/**
 * Lanzamientos de ejemplo OCULTOS por ahora (no se borran: se pueden volver a usar). El seed
 * los carga como no publicados; para mostrarlos, publícalos desde el panel o muévelos a `sampleReleases`.
 */
export const hiddenSampleReleases: Release[] = [
  {
    slug: "lanzamiento-ejemplo-sencillo",
    title: "Sencillo de ejemplo",
    type: "SINGLE",
    releaseDate: "2026-10-24T06:00:00.000Z",
    description:
      "Texto provisional. Aquí irá la descripción oficial del lanzamiento más reciente, redactada por la banda.",
    coverImageUrl: null,
    tracks: tracks(1),
    links: noLinks,
    embedUrl: null,
    isFeatured: true,
    isSample: true,
  },
  {
    slug: "lanzamiento-ejemplo-ep",
    title: "EP de ejemplo",
    type: "EP",
    releaseDate: "2025-06-13T06:00:00.000Z",
    description:
      "Texto provisional para un EP. La descripción, la lista de canciones y los enlaces se administrarán desde el panel interno.",
    coverImageUrl: null,
    tracks: tracks(5),
    links: noLinks,
    embedUrl: null,
    isFeatured: false,
    isSample: true,
  },
  {
    slug: "lanzamiento-ejemplo-album",
    title: "Álbum de ejemplo",
    type: "ALBUM",
    releaseDate: "2024-03-08T06:00:00.000Z",
    description:
      "Texto provisional para un álbum de larga duración. Reemplazar con la información oficial.",
    coverImageUrl: null,
    tracks: tracks(10),
    links: noLinks,
    embedUrl: null,
    isFeatured: false,
    isSample: true,
  },
];

/** Recintos y fechas ficticios. OCULTOS: el seed los carga como no publicados (ya hay fechas oficiales). */
export const sampleShows: Show[] = [
  { id: "show-1", startsAt: "2026-12-05T03:00:00.000Z", city: "Ciudad de México", state: "CDMX", venue: "Recinto de ejemplo A", posterUrl: null, ticketUrl: null, notes: "Información adicional de ejemplo: puertas 19:00 h, todas las edades.", status: "SCHEDULED", isSample: true },
  { id: "show-2", startsAt: "2026-12-13T03:00:00.000Z", city: "Guadalajara", state: "Jalisco", venue: "Recinto de ejemplo B", posterUrl: null, ticketUrl: null, notes: null, status: "SOLD_OUT", isSample: true },
  { id: "show-3", startsAt: "2027-01-24T03:00:00.000Z", city: "Monterrey", state: "Nuevo León", venue: "Recinto de ejemplo C", posterUrl: null, ticketUrl: null, notes: null, status: "SCHEDULED", isSample: true },
  { id: "show-4", startsAt: "2027-02-14T03:00:00.000Z", city: "Puebla", state: "Puebla", venue: "Recinto de ejemplo D", posterUrl: null, ticketUrl: null, notes: "Fecha de ejemplo pospuesta.", status: "POSTPONED", isSample: true },
  { id: "show-5", startsAt: "2026-09-20T03:00:00.000Z", city: "Querétaro", state: "Querétaro", venue: "Recinto de ejemplo E", posterUrl: null, ticketUrl: null, notes: null, status: "SCHEDULED", isSample: true },
  { id: "show-6", startsAt: "2026-06-07T03:00:00.000Z", city: "Tijuana", state: "Baja California", venue: "Recinto de ejemplo F", posterUrl: null, ticketUrl: null, notes: null, status: "SCHEDULED", isSample: true },
];

export const sampleNews: NewsPost[] = [
  { slug: "noticia-ejemplo-1", title: "Novedad de ejemplo: nuevo sencillo", excerpt: "Texto provisional para anunciar un lanzamiento. Se administrará desde el panel.", publishedAt: "2026-10-24T18:00:00.000Z", isSample: true },
  { slug: "noticia-ejemplo-2", title: "Novedad de ejemplo: fechas de gira", excerpt: "Texto provisional para anunciar nuevas fechas de concierto.", publishedAt: "2026-10-02T18:00:00.000Z", isSample: true },
  { slug: "noticia-ejemplo-3", title: "Novedad de ejemplo: mercancía exclusiva", excerpt: "Texto provisional para anunciar un lanzamiento en la tienda oficial.", publishedAt: "2026-09-15T18:00:00.000Z", isSample: true },
];

/** Número de integrantes y roles por confirmar. */
