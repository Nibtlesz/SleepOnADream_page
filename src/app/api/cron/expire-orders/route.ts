import { revalidateTag } from "next/cache";
import { isCronAuthorized } from "@/server/cron";
import { orders } from "@/server/orders/repository";
import { CATALOG_TAG } from "@/server/queries/catalog";

/**
 * GET /api/cron/expire-orders — libera inventario de pedidos no pagados a tiempo.
 * Programar cada 5–10 min (Vercel Cron, GitHub Actions, cron del servidor)
 * con la cabecera `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const expired = await orders.expireStale();
  if (expired > 0) revalidateTag(CATALOG_TAG, "max");
  return Response.json({ expired });
}
