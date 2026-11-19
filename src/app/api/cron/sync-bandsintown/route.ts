import { revalidateTag } from "next/cache";
import { isCronAuthorized } from "@/server/cron";
import { CONTENT_TAGS } from "@/server/queries/content";
import { isBandsintownConfigured, syncBandsintownShows } from "@/server/services/bandsintown";

/**
 * GET /api/cron/sync-bandsintown — trae los conciertos de Bandsintown al sitio.
 * Programar cada hora (ver .github/workflows/sync-contenido.yml) con la cabecera
 * `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!isBandsintownConfigured()) return Response.json({ skipped: "Falta BANDSINTOWN_APP_ID o DATABASE_URL" });

  try {
    const result = await syncBandsintownShows();
    if (result.created || result.updated || result.hidden) revalidateTag(CONTENT_TAGS.shows, "max");
    return Response.json(result);
  } catch (error) {
    console.error("[bandsintown] sincronización fallida:", error);
    return Response.json({ error: error instanceof Error ? error.message : "error" }, { status: 502 });
  }
}
