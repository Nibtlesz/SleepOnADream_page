import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { orders } from "@/server/orders/repository";
import { CATALOG_TAG } from "@/server/queries/catalog";

/**
 * GET /api/cron/expire-orders — libera inventario de pedidos no pagados a tiempo.
 * Programar cada 5–10 min (Vercel Cron, GitHub Actions, cron del servidor)
 * con la cabecera `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const ok =
    Boolean(secret) && auth.length === expected.length && timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
  if (!ok) return Response.json({ error: "unauthorized" }, { status: 401 });

  const expired = await orders.expireStale();
  if (expired > 0) revalidateTag(CATALOG_TAG, "max");
  return Response.json({ expired });
}
