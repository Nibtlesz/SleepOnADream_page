/** Autorización de las tareas programadas (/api/cron/*): cabecera `Authorization: Bearer $CRON_SECRET`. */
import "server-only";
import { timingSafeEqual } from "node:crypto";

export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return Boolean(secret) && auth.length === expected.length && timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
}
