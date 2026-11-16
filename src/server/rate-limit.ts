/**
 * Limitador de peticiones en memoria (ventana fija).
 * Suficiente para un solo servidor. En producción con varias instancias o
 * serverless, sustituir por Redis / Upstash manteniendo la misma firma.
 */
import "server-only";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterS: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    return { ok: true, retryAfterS: 0 };
  }
  bucket.count += 1;
  return { ok: bucket.count <= limit, retryAfterS: Math.ceil((bucket.resetAt - now) / 1000) };
}
