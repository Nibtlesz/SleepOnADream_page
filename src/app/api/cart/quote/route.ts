import { cartQuoteSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/server/rate-limit";
import { getClientIp } from "@/server/request";
import { quoteCart } from "@/server/services/cart-quote";

/** POST /api/cart/quote — recalcula el carrito con precios e inventario del servidor. */
export async function POST(request: Request) {
  const ip = await getClientIp();
  const limit = rateLimit(`quote:${ip}`, 60, 60_000);
  if (!limit.ok) {
    return Response.json(
      { error: "too_many_requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterS) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = cartQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_input" }, { status: 422 });
  }

  const quote = await quoteCart(parsed.data);
  return Response.json(quote, { headers: { "Cache-Control": "no-store" } });
}
