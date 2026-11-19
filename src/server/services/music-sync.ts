/**
 * Sincronización de lanzamientos desde el catálogo de la banda.
 *
 * 1. Apple Music (API pública de iTunes, sin clave): crea los lanzamientos nuevos con título, tipo,
 *    fecha, portada, canciones, sello y enlace. En los ya existentes solo actualiza la fecha (los
 *    pre-lanzamientos a veces la cambian) y completa portada, enlace o canciones si faltan.
 * 2. Spotify (opcional: SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET de una app en Spotify for Developers):
 *    agrega el enlace y el reproductor de Spotify a los lanzamientos que aún no lo tienen.
 *
 * Lo editado en el panel (título, descripción, enlaces, visibilidad) no se sobrescribe y nada se borra.
 * Un lanzamiento nuevo más reciente que todos pasa a ser el destacado ("Nuevo lanzamiento" en la portada).
 */
import "server-only";
import { z } from "zod";
import { siteConfig } from "@/config/site";
import { getDb, isDbConfigured } from "@/lib/db";

const ITUNES = "https://itunes.apple.com/lookup";
const COUNTRY = "mx";
type ReleaseType = "ALBUM" | "EP" | "SINGLE";

// ─── Apple Music ─────────────────────────────────────────────

const collectionSchema = z.object({
  wrapperType: z.literal("collection"),
  collectionId: z.number(),
  collectionName: z.string(),
  collectionViewUrl: z.string(),
  artworkUrl100: z.string().optional(),
  releaseDate: z.string(),
  trackCount: z.number().optional(),
  copyright: z.string().optional(),
});
const trackSchema = z.object({
  wrapperType: z.literal("track"),
  collectionId: z.number(),
  trackName: z.string(),
  trackNumber: z.number().optional(),
  discNumber: z.number().optional(),
  trackTimeMillis: z.number().optional(),
});
export type AppleCollection = z.infer<typeof collectionSchema>;
export type AppleTrack = z.infer<typeof trackSchema>;

async function itunes(params: Record<string, string>): Promise<unknown[]> {
  const res = await fetch(`${ITUNES}?${new URLSearchParams({ country: COUNTRY, limit: "200", ...params })}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Apple Music respondió ${res.status}`);
  const body = (await res.json()) as { results?: unknown[] };
  if (!Array.isArray(body.results)) throw new Error("Respuesta inesperada de Apple Music");
  return body.results;
}

export async function fetchAppleCollections(artistId: string): Promise<AppleCollection[]> {
  const rows = await itunes({ id: artistId, entity: "album" });
  return rows.flatMap((r) => {
    const parsed = collectionSchema.safeParse(r);
    return parsed.success ? [parsed.data] : [];
  });
}

export async function fetchAppleTracks(collectionId: number): Promise<AppleTrack[]> {
  const rows = await itunes({ id: String(collectionId), entity: "song" });
  return rows
    .flatMap((r) => {
      const parsed = trackSchema.safeParse(r);
      return parsed.success && parsed.data.collectionId === collectionId ? [parsed.data] : [];
    })
    .sort((a, b) => (a.discNumber ?? 1) - (b.discNumber ?? 1) || (a.trackNumber ?? 0) - (b.trackNumber ?? 0));
}

const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export const slugify = (s: string) => plain(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

/** "Ruinas - Single" → { title: "Ruinas", type: "SINGLE" } (así nombra Apple los sencillos y EP). */
export function mapCollection(c: AppleCollection) {
  const m = c.collectionName.match(/^(.*?)\s+-\s+(Single|EP)$/i);
  const type: ReleaseType = m ? (m[2].toUpperCase() === "EP" ? "EP" : "SINGLE") : "ALBUM";
  const title = (m ? m[1] : c.collectionName).trim();
  const count = c.trackCount ?? 0;
  const kind = type === "SINGLE" ? "Sencillo" : `${type === "EP" ? "EP" : "Álbum"}${count > 1 ? ` de ${count} canciones` : ""}`;
  const url = new URL(c.collectionViewUrl);
  url.search = "";
  return {
    appleMusicId: String(c.collectionId),
    title,
    type,
    // Medianoche del centro de México, igual que las fechas capturadas en el panel.
    releaseDate: new Date(`${c.releaseDate.slice(0, 10)}T06:00:00.000Z`),
    description: [kind, c.copyright?.trim()].filter(Boolean).join(". ") + ".",
    coverImageUrl: c.artworkUrl100 ? c.artworkUrl100.replace(/\/\d+x\d+bb\.(jpg|png|webp)$/, "/600x600bb.jpg") : null,
    appleMusicUrl: url.toString(),
  };
}

const appleIdFromUrl = (url: string | null) => url?.match(/music\.apple\.com\/.+\/(\d+)(?:[?#]|$)/)?.[1] ?? null;
const toTracks = (tracks: AppleTrack[]) =>
  tracks.map((t, i) => ({ position: i + 1, title: t.trackName.slice(0, 140), durationS: t.trackTimeMillis ? Math.round(t.trackTimeMillis / 1000) : null }));

// ─── Spotify (opcional) ───────────────────────────────────────

const spotifyAlbumSchema = z.object({
  id: z.string(),
  name: z.string(),
  release_date: z.string(),
  images: z.array(z.object({ url: z.string() })).default([]),
});
export type SpotifyAlbum = z.infer<typeof spotifyAlbumSchema>;

export const isSpotifyConfigured = () => Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);

export async function fetchSpotifyAlbums(artistId: string): Promise<SpotifyAlbum[]> {
  const basic = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { authorization: `Basic ${basic}`, "content-type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!tokenRes.ok) throw new Error(`Spotify (token) respondió ${tokenRes.status}`);
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const albums: SpotifyAlbum[] = [];
  let next: string | null = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&market=MX&limit=10`;
  for (let page = 0; next && page < 20; page++) {
    const res: Response = await fetch(next, { headers: { authorization: `Bearer ${access_token}` }, cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`Spotify respondió ${res.status}`);
    const body = (await res.json()) as { items?: unknown[]; next?: string | null };
    for (const item of body.items ?? []) {
      const parsed = spotifyAlbumSchema.safeParse(item);
      if (parsed.success) albums.push(parsed.data);
    }
    next = body.next ?? null;
  }
  return albums;
}

/** Título comparable entre plataformas: sin acentos, sin "(feat. …)" ni "- Single". */
export function matchKey(title: string) {
  return plain(title)
    .replace(/\s+-\s+(single|ep)$/, "")
    .replace(/[([]\s*(feat|ft|featuring)\.?\s[^)\]]*[)\]]/g, "")
    .replace(/\s(feat|ft)\.?\s.*$/, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Elige el álbum de Spotify con el mismo título y la fecha más cercana (máx. 60 días de diferencia). */
export function findSpotifyMatch(title: string, releaseDate: Date, albums: SpotifyAlbum[]) {
  const key = matchKey(title);
  const DAY = 86_400_000;
  return albums
    .filter((a) => matchKey(a.name) === key)
    .map((a) => ({ a, diff: Math.abs(new Date(`${a.release_date.padEnd(10, "-01").slice(0, 10)}T06:00:00Z`).getTime() - releaseDate.getTime()) }))
    .filter((x) => x.diff <= 60 * DAY)
    .sort((x, y) => x.diff - y.diff)[0]?.a;
}

// ─── Sincronización ───────────────────────────────────────────

export const isMusicSyncConfigured = () => isDbConfigured;

export type MusicSyncResult = { created: number; updated: number; spotifyLinked: number; total: number; featured: string | null; spotify: "ok" | "sin-clave" | "error" };

export async function syncReleases(): Promise<MusicSyncResult> {
  const artistId = process.env.APPLE_MUSIC_ARTIST_ID || siteConfig.appleMusicArtistId;
  const collections = await fetchAppleCollections(artistId);
  const db = getDb();
  const result: MusicSyncResult = { created: 0, updated: 0, spotifyLinked: 0, total: collections.length, featured: null, spotify: "sin-clave" };

  const existing = await db.release.findMany({ include: { _count: { select: { tracks: true } } } });
  const byAppleId = new Map<string, (typeof existing)[number]>();
  for (const r of existing) {
    const id = r.appleMusicId ?? appleIdFromUrl(r.appleMusicUrl);
    if (id) byAppleId.set(id, r);
  }
  const slugs = new Set(existing.map((r) => r.slug));
  const newest = existing.filter((r) => r.published && !r.isSample).reduce((max, r) => Math.max(max, r.releaseDate.getTime()), 0);

  const created: Array<{ id: string; title: string; releaseDate: Date }> = [];
  for (const c of collections) {
    const data = mapCollection(c);
    const current = byAppleId.get(data.appleMusicId);

    if (!current) {
      let slug = slugify(data.title) || data.appleMusicId;
      if (slugs.has(slug)) slug = `${slug}-${data.releaseDate.getUTCFullYear()}`;
      if (slugs.has(slug)) slug = `${slug}-${data.appleMusicId}`;
      slugs.add(slug);
      const tracks = toTracks(await fetchAppleTracks(c.collectionId));
      const r = await db.release.create({
        data: { ...data, slug, published: true, isSample: false, isFeatured: false, tracks: { create: tracks } },
      });
      created.push({ id: r.id, title: r.title, releaseDate: r.releaseDate });
      result.created++;
      continue;
    }

    const patch: { appleMusicId?: string; releaseDate?: Date; coverImageUrl?: string; appleMusicUrl?: string } = {};
    if (current.appleMusicId !== data.appleMusicId) patch.appleMusicId = data.appleMusicId;
    if (current.releaseDate.getTime() !== data.releaseDate.getTime()) patch.releaseDate = data.releaseDate;
    if (!current.coverImageUrl && data.coverImageUrl) patch.coverImageUrl = data.coverImageUrl;
    if (!current.appleMusicUrl) patch.appleMusicUrl = data.appleMusicUrl;
    const needsTracks = current._count.tracks === 0;
    if (Object.keys(patch).length || needsTracks) {
      const tracks = needsTracks ? toTracks(await fetchAppleTracks(c.collectionId)) : [];
      await db.release.update({ where: { id: current.id }, data: { ...patch, ...(tracks.length ? { tracks: { create: tracks } } : {}) } });
      // Ligar el ID no cuenta como cambio visible.
      if (Object.keys(patch).some((k) => k !== "appleMusicId") || tracks.length) result.updated++;
    }
  }

  // El lanzamiento nuevo más reciente (si supera a todo lo publicado) pasa a ser el destacado.
  const latest = created.sort((a, b) => b.releaseDate.getTime() - a.releaseDate.getTime())[0];
  if (latest && latest.releaseDate.getTime() >= newest) {
    await db.$transaction([
      db.release.updateMany({ where: { isFeatured: true }, data: { isFeatured: false } }),
      db.release.update({ where: { id: latest.id }, data: { isFeatured: true } }),
    ]);
    result.featured = latest.title;
  }

  // Spotify: completar enlace y reproductor donde falten. Si falla, lo de Apple ya quedó guardado.
  if (isSpotifyConfigured()) {
    try {
      const albums = await fetchSpotifyAlbums(siteConfig.spotifyArtistId);
      const missing = await db.release.findMany({ where: { spotifyUrl: null, isSample: false } });
      for (const r of missing) {
        const match = findSpotifyMatch(r.title, r.releaseDate, albums);
        if (!match) continue;
        await db.release.update({
          where: { id: r.id },
          data: {
            spotifyUrl: `https://open.spotify.com/album/${match.id}`,
            ...(r.embedUrl ? {} : { embedUrl: `https://open.spotify.com/embed/album/${match.id}?theme=0` }),
            ...(r.coverImageUrl || !match.images[0] ? {} : { coverImageUrl: match.images[0].url }),
          },
        });
        result.spotifyLinked++;
      }
      result.spotify = "ok";
    } catch (error) {
      console.error("[música] Spotify falló:", error);
      result.spotify = "error";
    }
  }
  return result;
}
