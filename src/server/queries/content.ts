/**
 * Lectura del contenido de la banda.
 * Con DATABASE_URL: PostgreSQL (solo lo publicado). Sin ella: datos de ejemplo.
 * El panel invalida la caché con `updateTag(tag)` al guardar.
 */
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { officialVideos } from "@/data/official/videos";
import { sampleMembers, sampleNews, sampleReleases, sampleShows } from "@/data/sample/content";
import { getDb, isDbConfigured } from "@/lib/db";
import type { BandMember, NewsPost, Release, Show, Video } from "@/lib/types";

export const CONTENT_TAGS = {
  releases: "releases",
  videos: "videos",
  shows: "shows",
  news: "news",
  band: "band",
} as const;

export async function getReleases(): Promise<Release[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAGS.releases);
  if (!isDbConfigured) return [...sampleReleases].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
  const rows = await getDb().release.findMany({
    where: { published: true },
    include: { tracks: { orderBy: { position: "asc" } } },
    orderBy: { releaseDate: "desc" },
  });
  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    type: r.type,
    releaseDate: r.releaseDate.toISOString(),
    description: r.description ?? "",
    coverImageUrl: r.coverImageUrl,
    tracks: r.tracks.map((t) => ({ position: t.position, title: t.title, durationS: t.durationS })),
    links: { spotify: r.spotifyUrl, appleMusic: r.appleMusicUrl, youtubeMusic: r.youtubeMusicUrl },
    embedUrl: r.embedUrl,
    isFeatured: r.isFeatured,
    isSample: r.isSample,
  }));
}

export async function getLatestRelease() {
  const releases = await getReleases();
  return releases.find((r) => r.isFeatured) ?? releases[0] ?? null;
}

export async function getVideos(): Promise<Video[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAGS.videos);
  if (!isDbConfigured) return [...officialVideos].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const rows = await getDb().video.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" } });
  return rows.map((v) => ({
    slug: v.slug,
    title: v.title,
    youtubeId: v.youtubeId,
    thumbnailUrl: v.thumbnailUrl,
    publishedAt: v.publishedAt.toISOString(),
    isFeatured: v.isFeatured,
    isSample: v.isSample,
  }));
}

async function allShows(): Promise<Show[]> {
  if (!isDbConfigured) return sampleShows;
  const rows = await getDb().show.findMany({ where: { published: true }, orderBy: { startsAt: "asc" } });
  return rows.map((s) => ({
    id: s.id,
    startsAt: s.startsAt.toISOString(),
    city: s.city,
    state: s.state,
    venue: s.venue,
    posterUrl: s.posterUrl,
    ticketUrl: s.ticketUrl,
    notes: s.notes,
    status: s.status,
    isSample: s.isSample,
  }));
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
  const sorted = [...(await allShows())].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return {
    upcoming: sorted.filter((s) => new Date(s.startsAt).getTime() >= now),
    past: sorted.filter((s) => new Date(s.startsAt).getTime() < now).reverse(),
  };
}

export async function getNews(limit = 3): Promise<NewsPost[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAGS.news);
  if (!isDbConfigured) {
    return [...sampleNews].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, limit);
  }
  const rows = await getDb().newsPost.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" }, take: limit });
  return rows.map((n) => ({ slug: n.slug, title: n.title, excerpt: n.excerpt, publishedAt: n.publishedAt.toISOString(), isSample: n.isSample }));
}

export async function getBandMembers(): Promise<BandMember[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CONTENT_TAGS.band);
  if (!isDbConfigured) return sampleMembers;
  const rows = await getDb().bandMember.findMany({ where: { active: true }, orderBy: { position: "asc" } });
  return rows.map((m) => ({ id: m.id, name: m.name, role: m.role, photoUrl: m.photoUrl }));
}
