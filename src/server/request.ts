import "server-only";
import { headers } from "next/headers";

/** IP del cliente detrás del proxy / CDN (Vercel, Cloudflare, Nginx). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("cf-connecting-ip") ??
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
