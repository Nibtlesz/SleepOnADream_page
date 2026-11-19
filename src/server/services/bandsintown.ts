/**
 * Sincronización de conciertos desde Bandsintown (API de solo lectura).
 *
 * Bandsintown manda: fecha y hora, ciudad, estado, país, recinto y enlace de boletos.
 * El panel manda: información adicional, cartel, visibilidad y estado (salvo "agotado",
 * que también se toma de Bandsintown). Los conciertos creados a mano en el panel no se tocan.
 * Si un concierto futuro desaparece de Bandsintown (borrado o cancelado), se oculta del sitio.
 *
 * Variables: BANDSINTOWN_APP_ID (Bandsintown for Artists → Settings → General → Get API Key)
 * y opcionalmente BANDSINTOWN_ARTIST (por defecto "Sleep On A Dream").
 */
import "server-only";
import { z } from "zod";
import { getDb, isDbConfigured } from "@/lib/db";

const API = "https://rest.bandsintown.com";
const DEFAULT_ARTIST = "Sleep On A Dream";

const eventSchema = z.object({
  id: z.coerce.string(),
  url: z.string(),
  datetime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/),
  description: z.string().nullish(),
  title: z.string().nullish(),
  venue: z.object({
    name: z.string().nullish(),
    city: z.string().nullish(),
    region: z.string().nullish(),
    country: z.string().nullish(),
  }),
  offers: z.array(z.object({ type: z.string().nullish(), url: z.string().nullish(), status: z.string().nullish() })).default([]),
});
export type BandsintownEvent = z.infer<typeof eventSchema>;

/** Estados de México por abreviatura (como los manda Bandsintown) o nombre. */
const MX_STATES: Record<string, string> = {
  ags: "Aguascalientes", bc: "Baja California", bcn: "Baja California", bcs: "Baja California Sur",
  camp: "Campeche", cam: "Campeche", chis: "Chiapas", chs: "Chiapas", chih: "Chihuahua", chh: "Chihuahua",
  cdmx: "CDMX", df: "CDMX", "ciudad de mexico": "CDMX", "mexico city": "CDMX", "distrito federal": "CDMX",
  coah: "Coahuila", coa: "Coahuila", col: "Colima", dgo: "Durango", dur: "Durango", gto: "Guanajuato", gua: "Guanajuato",
  gro: "Guerrero", hgo: "Hidalgo", hid: "Hidalgo", jal: "Jalisco", mex: "Estado de México", "edo mex": "Estado de México",
  "edomex": "Estado de México", "estado de mexico": "Estado de México", "state of mexico": "Estado de México",
  mich: "Michoacán", mic: "Michoacán", mor: "Morelos", nay: "Nayarit", nl: "Nuevo León", nle: "Nuevo León",
  oax: "Oaxaca", pue: "Puebla", qro: "Querétaro", que: "Querétaro", qroo: "Quintana Roo", "q roo": "Quintana Roo", roo: "Quintana Roo",
  slp: "San Luis Potosí", sin: "Sinaloa", son: "Sonora", tab: "Tabasco", tamps: "Tamaulipas", tam: "Tamaulipas",
  tlax: "Tlaxcala", tla: "Tlaxcala", ver: "Veracruz", yuc: "Yucatán", zac: "Zacatecas",
};
const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\./g, "").trim();

/** "Pachuca De Soto" → "Pachuca de Soto" (conectores en minúscula, salvo al inicio). */
export function tidyPlace(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((w, i) => (i > 0 && /^(de|del|la|las|los|el|y)$/i.test(w) ? w.toLowerCase() : w))
    .join(" ");
}

/** Quita el app_id de los enlaces que devuelve la API para no publicarlo en el sitio. */
export function publicUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.searchParams.delete("app_id");
    return u.toString();
  } catch {
    return raw;
  }
}

/**
 * Convierte un evento al formato de concierto del sitio. La hora de Bandsintown es la local del
 * recinto; el sitio (y el panel) manejan todas las horas como del centro de México (UTC−6).
 */
export function mapEvent(e: BandsintownEvent) {
  const country = plain(e.venue.country ?? "");
  const isMexico = country === "mexico" || country === "mx";
  const region = (e.venue.region ?? "").trim();
  const state = isMexico
    ? MX_STATES[plain(region)] ?? (tidyPlace(region) || "México")
    : [region, e.venue.country].filter(Boolean).join(", ") || "—";
  const tickets = e.offers.find((o) => o.url && /ticket/i.test(o.type ?? "")) ?? e.offers.find((o) => o.url);
  const time = e.datetime.length === 16 ? `${e.datetime}:00` : e.datetime;
  return {
    bandsintownId: e.id,
    startsAt: new Date(`${time}-06:00`),
    city: tidyPlace(e.venue.city ?? "") || "—",
    state,
    country: isMexico ? "MX" : (e.venue.country ?? "").slice(0, 60),
    venue: (e.venue.name ?? e.title ?? "").trim() || "Por anunciar",
    ticketUrl: publicUrl(tickets?.url ?? e.url),
    soldOut: e.offers.some((o) => /sold[\s_-]?out|agotad/i.test(o.status ?? "")),
    notes: e.description?.trim() || null,
  };
}

export function isBandsintownConfigured() {
  return Boolean(process.env.BANDSINTOWN_APP_ID) && isDbConfigured;
}

export async function fetchUpcomingEvents(): Promise<BandsintownEvent[]> {
  const appId = process.env.BANDSINTOWN_APP_ID;
  if (!appId) throw new Error("Falta BANDSINTOWN_APP_ID");
  // Nombres con "/" o "?" van doblemente codificados, como pide la documentación de Bandsintown.
  const artist = encodeURIComponent((process.env.BANDSINTOWN_ARTIST || DEFAULT_ARTIST).replace(/\//g, "%2F").replace(/\?/g, "%3F"));
  const res = await fetch(`${API}/artists/${artist}/events?app_id=${encodeURIComponent(appId)}&date=upcoming`, {
    cache: "no-store",
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Bandsintown respondió ${res.status}`);
  const body: unknown = await res.json();
  // Sin conciertos, la API puede responder [] o un objeto con "errors"/"warn".
  if (!Array.isArray(body)) {
    if (body && typeof body === "object" && ("errors" in body || "error" in body)) throw new Error(`Bandsintown: ${JSON.stringify(body).slice(0, 200)}`);
    return [];
  }
  return z.array(eventSchema).parse(body);
}

export type SyncResult = { created: number; updated: number; hidden: number; total: number };

/** Trae los próximos conciertos de Bandsintown y los aplica a la base. Si la API falla, no cambia nada. */
export async function syncBandsintownShows(): Promise<SyncResult> {
  const events = await fetchUpcomingEvents();
  const db = getDb();
  const result: SyncResult = { created: 0, updated: 0, hidden: 0, total: events.length };

  for (const e of events) {
    const { soldOut, notes, ...synced } = mapEvent(e);
    const existing = await db.show.findUnique({ where: { bandsintownId: synced.bandsintownId } });
    if (!existing) {
      await db.show.create({ data: { ...synced, notes, status: soldOut ? "SOLD_OUT" : "SCHEDULED", published: true, isSample: false } });
      result.created++;
      continue;
    }
    const changed =
      existing.startsAt.getTime() !== synced.startsAt.getTime() ||
      existing.city !== synced.city || existing.state !== synced.state || existing.country !== synced.country ||
      existing.venue !== synced.venue || existing.ticketUrl !== synced.ticketUrl ||
      (soldOut && existing.status !== "SOLD_OUT");
    if (changed) {
      await db.show.update({ where: { id: existing.id }, data: { ...synced, ...(soldOut ? { status: "SOLD_OUT" as const } : {}) } });
      result.updated++;
    }
  }

  // Conciertos futuros que ya no están en Bandsintown: se ocultan (no se borran).
  const ids = events.map((e) => e.id);
  const gone = await db.show.updateMany({
    where: { bandsintownId: { not: null, notIn: ids }, startsAt: { gte: new Date() }, published: true },
    data: { published: false },
  });
  result.hidden = gone.count;
  return result;
}
