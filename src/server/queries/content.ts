/**
 * Lectura de contenido de la banda.
 * Fase 1–3: devuelve DATOS DE EJEMPLO. En la Fase 4 cada función consultará
 * Prisma (`getDb()`) y el panel invalidará la caché con `revalidateTag(tag)`.
 */
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { sampleMembers, sampleNews, sampleReleases, sampleShows, sampleVideos } from "@/data/sample/content";

export const CONTENT_TAGS = {
  releases: "releases",
  videos: "videos",
  shows: "shows",
  news: "news",
  band: "band",
} as const;

export async function getReleases() {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAGS.releases);
  return [...sampleReleases].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
}

export async function getLatestRelease() {
  const releases = await getReleases();
  return releases.find((r) => r.isFeatured) ?? releases[0] ?? null;
}

export async function getVideos() {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAGS.videos);
  return [...sampleVideos].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/**
 * Separa próximos conciertos del historial según la fecha actual.
 * Al estar en caché por horas, un concierto pasa al historial como máximo
 * una hora después de su inicio, sin procesos manuales.
 */
export async function getShows() {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAGS.shows);
  const now = Date.now();
  const sorted = [...sampleShows].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return {
    upcoming: sorted.filter((s) => new Date(s.startsAt).getTime() >= now),
    past: sorted.filter((s) => new Date(s.startsAt).getTime() < now).reverse(),
  };
}

export async function getNews(limit = 3) {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAGS.news);
  return [...sampleNews].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, limit);
}

export async function getBandMembers() {
  "use cache";
  cacheLife("days");
  cacheTag(CONTENT_TAGS.band);
  return sampleMembers;
}
