"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/components/admin/forms";
import { getDb } from "@/lib/db";
import { firstErrors } from "@/lib/validation/checkout";
import { audit } from "@/server/audit";
import { assertAdmin } from "@/server/auth/dal";
import { CONTENT_TAGS } from "@/server/queries/content";
import { isBandsintownConfigured, syncBandsintownShows } from "@/server/services/bandsintown";
import { isMusicSyncConfigured, syncReleases } from "@/server/services/music-sync";

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
const optUrl = z.union([z.url({ protocol: /^https$/, error: "Debe ser un enlace https://" }), z.literal("")]).optional();
const checkbox = z.literal("on").optional();
/** Fecha y hora capturadas en hora del centro de México (UTC−6, sin horario de verano). */
const mxDateTime = (date: string, time = "00:00") => new Date(`${date}T${time}:00-06:00`);
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

// ─── Conciertos ───────────────────────────────────────────────

const showSchema = z.object({
  id: z.string().optional(),
  date: dateStr,
  time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
  city: z.string().trim().min(2, "Ciudad requerida").max(80),
  state: z.string().trim().min(2, "Estado requerido").max(80),
  venue: z.string().trim().min(2, "Recinto requerido").max(120),
  ticketUrl: optUrl,
  posterUrl: optUrl,
  notes: z.string().trim().max(1000).optional(),
  status: z.enum(["SCHEDULED", "SOLD_OUT", "CANCELLED", "POSTPONED"]),
  published: checkbox,
  isSample: checkbox,
});

export async function saveShow(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await assertAdmin("content");
  const parsed = showSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: "Revisa los campos.", errors: firstErrors(parsed.error) };
  const d = parsed.data;
  const data = {
    startsAt: mxDateTime(d.date, d.time),
    city: d.city,
    state: d.state,
    venue: d.venue,
    ticketUrl: d.ticketUrl || null,
    posterUrl: d.posterUrl || null,
    notes: d.notes || null,
    status: d.status,
    published: d.published === "on",
    isSample: d.isSample === "on",
  };
  const db = getDb();
  const show = d.id ? await db.show.update({ where: { id: d.id }, data }) : await db.show.create({ data });
  await audit(user, d.id ? "show.update" : "show.create", "Show", show.id, { city: d.city, status: d.status });
  updateTag(CONTENT_TAGS.shows);
  redirect("/admin/conciertos?guardado=1");
}

/** Botón "Sincronizar con Bandsintown" del panel (lo mismo que hace la tarea programada cada hora). */
export async function syncBandsintown() {
  const user = await assertAdmin("content");
  if (!isBandsintownConfigured()) redirect("/admin/conciertos?sync=sin-clave");
  let summary: string;
  try {
    const r = await syncBandsintownShows();
    await audit(user, "show.sync", "Show", "bandsintown", r);
    updateTag(CONTENT_TAGS.shows);
    summary = `${r.created}-${r.updated}-${r.hidden}`;
  } catch (error) {
    console.error("[bandsintown] sincronización fallida:", error);
    summary = "error";
  }
  redirect(`/admin/conciertos?sync=${summary}`);
}

// ─── Videos ───────────────────────────────────────────────────

/** Acepta el ID o cualquier enlace de YouTube (watch, youtu.be, shorts, embed). */
function youtubeId(input: string): string | null {
  const v = input.trim();
  if (!v) return null;
  if (/^[\w-]{11}$/.test(v)) return v;
  const m = v.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

const videoSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, "Título requerido").max(140),
  slug: z.string().trim().max(80).optional(),
  youtube: z.string().trim().max(200).optional(),
  thumbnailUrl: optUrl,
  publishedAt: dateStr,
  isFeatured: checkbox,
  published: checkbox,
  isSample: checkbox,
});

export async function saveVideo(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await assertAdmin("content");
  const parsed = videoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: "Revisa los campos.", errors: firstErrors(parsed.error) };
  const d = parsed.data;
  const yt = d.youtube ? youtubeId(d.youtube) : null;
  if (d.youtube && !yt) return { message: "No reconocemos ese enlace de YouTube.", errors: { youtube: "Pega el enlace del video o su ID de 11 caracteres" } };
  const db = getDb();
  const slug = slugify(d.slug || d.title);
  if (await db.video.findFirst({ where: { slug, NOT: d.id ? { id: d.id } : undefined } })) return { message: "Ya existe un video con esa URL.", errors: { slug: "En uso" } };
  const data = {
    title: d.title,
    slug,
    youtubeId: yt,
    thumbnailUrl: d.thumbnailUrl || null,
    publishedAt: mxDateTime(d.publishedAt, "12:00"),
    isFeatured: d.isFeatured === "on",
    published: d.published === "on",
    isSample: d.isSample === "on",
  };
  const video = await db.$transaction(async (tx) => {
    // Solo un video destacado a la vez.
    if (data.isFeatured) await tx.video.updateMany({ where: { isFeatured: true, NOT: d.id ? { id: d.id } : undefined }, data: { isFeatured: false } });
    return d.id ? tx.video.update({ where: { id: d.id }, data }) : tx.video.create({ data });
  });
  await audit(user, d.id ? "video.update" : "video.create", "Video", video.id, { title: d.title });
  updateTag(CONTENT_TAGS.videos);
  redirect("/admin/videos?guardado=1");
}

// ─── Lanzamientos ─────────────────────────────────────────────

const releaseSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Título requerido").max(140),
  slug: z.string().trim().max(80).optional(),
  type: z.enum(["ALBUM", "EP", "SINGLE"]),
  releaseDate: dateStr,
  description: z.string().trim().max(3000).optional(),
  coverImageUrl: optUrl,
  spotifyUrl: optUrl,
  appleMusicUrl: optUrl,
  youtubeMusicUrl: optUrl,
  embedUrl: optUrl,
  tracks: z.string().max(5000).optional(),
  isFeatured: checkbox,
  published: checkbox,
  isSample: checkbox,
});

/** "Título | 3:45" por línea → pistas. */
function parseTracks(raw = "") {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [title, dur] = line.split("|").map((s) => s.trim());
      const m = dur?.match(/^(\d{1,2}):(\d{2})$/);
      return { position: i + 1, title: title.slice(0, 140), durationS: m ? Number(m[1]) * 60 + Number(m[2]) : null };
    });
}

export async function saveRelease(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await assertAdmin("content");
  const parsed = releaseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: "Revisa los campos.", errors: firstErrors(parsed.error) };
  const d = parsed.data;
  const db = getDb();
  const slug = slugify(d.slug || d.title);
  if (await db.release.findFirst({ where: { slug, NOT: d.id ? { id: d.id } : undefined } })) return { message: "Ya existe un lanzamiento con esa URL.", errors: { slug: "En uso" } };
  const tracks = parseTracks(d.tracks);
  const data = {
    title: d.title,
    slug,
    type: d.type,
    releaseDate: mxDateTime(d.releaseDate),
    description: d.description || null,
    coverImageUrl: d.coverImageUrl || null,
    spotifyUrl: d.spotifyUrl || null,
    appleMusicUrl: d.appleMusicUrl || null,
    youtubeMusicUrl: d.youtubeMusicUrl || null,
    embedUrl: d.embedUrl || null,
    isFeatured: d.isFeatured === "on",
    published: d.published === "on",
    isSample: d.isSample === "on",
  };
  const release = await db.$transaction(async (tx) => {
    if (data.isFeatured) await tx.release.updateMany({ where: { isFeatured: true, NOT: d.id ? { id: d.id } : undefined }, data: { isFeatured: false } });
    const r = d.id ? await tx.release.update({ where: { id: d.id }, data }) : await tx.release.create({ data });
    await tx.track.deleteMany({ where: { releaseId: r.id } });
    if (tracks.length) await tx.track.createMany({ data: tracks.map((t) => ({ ...t, releaseId: r.id })) });
    return r;
  });
  await audit(user, d.id ? "release.update" : "release.create", "Release", release.id, { title: d.title, tracks: tracks.length });
  updateTag(CONTENT_TAGS.releases);
  redirect("/admin/musica?guardado=1");
}

/** Botón "Sincronizar con Apple Music / Spotify" del panel (lo mismo que la tarea de cada hora). */
export async function syncMusic() {
  const user = await assertAdmin("content");
  if (!isMusicSyncConfigured()) redirect("/admin/musica?sync=error");
  let query: string;
  try {
    const r = await syncReleases();
    await audit(user, "release.sync", "Release", "apple-music", r);
    updateTag(CONTENT_TAGS.releases);
    query = new URLSearchParams({ sync: `${r.created}-${r.updated}-${r.spotifyLinked}`, spotify: r.spotify, ...(r.featured ? { destacado: r.featured } : {}) }).toString();
  } catch (error) {
    console.error("[música] sincronización fallida:", error);
    query = "sync=error";
  }
  redirect(`/admin/musica?${query}`);
}

// ─── Eliminar ─────────────────────────────────────────────────

const ENTITIES = {
  show: { tag: CONTENT_TAGS.shows, back: "/admin/conciertos", del: (id: string) => getDb().show.delete({ where: { id } }) },
  video: { tag: CONTENT_TAGS.videos, back: "/admin/videos", del: (id: string) => getDb().video.delete({ where: { id } }) },
  release: { tag: CONTENT_TAGS.releases, back: "/admin/musica", del: (id: string) => getDb().release.delete({ where: { id } }) },
} as const;

export async function deleteContent(formData: FormData) {
  const user = await assertAdmin("content");
  const kind = String(formData.get("kind"));
  const id = String(formData.get("id"));
  if (!Object.hasOwn(ENTITIES, kind)) throw new Error("Tipo inválido");
  const entity = ENTITIES[kind as keyof typeof ENTITIES];
  await entity.del(id);
  await audit(user, `${kind}.delete`, kind, id);
  updateTag(entity.tag);
  redirect(`${entity.back}?eliminado=1`);
}
