/**
 * Videos OFICIALES de la banda (canal "Sleep On A Dream Official" en YouTube).
 * Se cargan con el seed y se muestran cuando el sitio funciona sin base de datos.
 * Para agregar más, usa el panel (/admin/videos) o añádelos aquí.
 * Fechas de publicación a las 12:00 del centro de México (18:00 UTC).
 */
import type { Video } from "@/lib/types";

const video = (slug: string, title: string, youtubeId: string, date: string, isFeatured = false): Video => ({
  slug,
  title,
  youtubeId,
  thumbnailUrl: null, // se usa la miniatura de YouTube
  publishedAt: `${date}T18:00:00.000Z`,
  isFeatured,
  isSample: false,
});

export const officialVideos: Video[] = [
  video("un-mejor-final", "Un Mejor Final", "EhbBIlDL50g", "2026-03-27", true),
  video("salvame", "Sálvame ft. Bam Bautista", "PQ7KDoGEfCk", "2025-08-29"),
  video("amor-regresa", "Amor Regresa (Rock Cover - Los Askis)", "D3eLI_jb8wQ", "2025-03-28"),
  video("eclipse", "Eclipse", "7pFiAcev__s", "2023-12-07"),
  video("antes-de-todo-despues-de-ti", "Antes De Todo, Después De Ti", "JlbVMyB983M", "2021-01-07"),
  video("voces", "Voces", "iMCuz2412pc", "2020-09-13"),
  video("in-the-end", "In The End (Metalcore Cover - Linkin Park)", "VnOpsMy_jVA", "2020-07-17"),
  video("renacer", "Renacer", "NA4_bLmih48", "2020-04-10"),
  video("cicatrices", "Cicatrices", "6s94xPgqxxk", "2018-07-10"),
];
