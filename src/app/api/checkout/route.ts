import { checkoutSchema, firstErrors } from "@/lib/validation/checkout";
import { rateLimit } from "@/server/rate-limit";
import { getClientIp } from "@/server/request";
import { placeOrder } from "@/server/services/checkout";

/** POST /api/checkout — crea el pedido (idempotente) e inicia el pago. */
export async function POST(request: Request) {
  const ip = await getClientIp();
  const limit = rateLimit(`checkout:${ip}`, 10, 60_000);
  if (!limit.ok) {
    return Response.json(
      { ok: false, error: "too_many_requests", message: "Demasiados intentos. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterS) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "invalid_input", message: "Revisa los datos del formulario.", fields: firstErrors(parsed.error) },
      { status: 422 },
    );
  }

  try {
    const result = await placeOrder(parsed.data);
    if (!result.ok) {
      const status =
        result.error === "cart_changed" || result.error === "order_expired"
          ? 409
          : result.error === "payment_rejected"
            ? 402
            : result.error === "payment_error"
              ? 502
              : 422;
      return Response.json(result, { status });
    }
    // Solo se devuelve lo necesario para redirigir; el detalle se consulta con el token.
    return Response.json(
      { ok: true, accessToken: result.order.accessToken, status: result.order.status, next: result.next },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("[checkout] error inesperado", e);
    return Response.json({ ok: false, error: "server_error", message: "No pudimos procesar tu pedido. Intenta de nuevo." }, { status: 500 });
  }
}
