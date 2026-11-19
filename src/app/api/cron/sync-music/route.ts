import { revalidateTag } from "next/cache";
import { isCronAuthorized } from "@/server/cron";
import { CONTENT_TAGS } from "@/server/queries/content";
import { isMusicSyncConfigured, syncReleases } from "@/server/services/music-sync";

/**
 * GET /api/cron/sync-music — trae los lanzamientos nuevos de Apple Music (y enlaces de Spotify).
 * Programar cada hora (ver .github/workflows/sync-contenido.yml) con la cabecera
 * `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!isMusicSyncConfigured()) return Response.json({ skipped: "Falta DATABASE_URL" });

  try {
    const result = await syncReleases();
    if (result.created || result.updated || result.spotifyLinked) revalidateTag(CONTENT_TAGS.releases, "max");
    return Response.json(result);
  } catch (error) {
    console.error("[música] sincronización fallida:", error);
    return Response.json({ error: error instanceof Error ? error.message : "error" }, { status: 502 });
  }
}
