import { fetchMercadoPagoPayment, mapMercadoPagoStatus, verifyMercadoPagoSignature } from "@/server/payments/mercadopago";
import { applyPaymentResult } from "@/server/services/payments";

/**
 * POST /api/webhooks/mercadopago
 * 1. Verifica la firma HMAC (x-signature) con MERCADOPAGO_WEBHOOK_SECRET.
 * 2. NO confía en el cuerpo: consulta el pago en la API de Mercado Pago.
 * 3. Aplica el resultado de forma idempotente (PaymentEvent único).
 */
export async function POST(request: Request) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || !process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  let body: { type?: string; action?: string; data?: { id?: string | number } } = {};
  try {
    body = await request.json();
  } catch {
    /* algunas notificaciones llegan solo con query params */
  }
  const dataId = url.searchParams.get("data.id") ?? (body.data?.id != null ? String(body.data.id) : null);
  const type = url.searchParams.get("type") ?? body.type;

  const valid = verifyMercadoPagoSignature({
    signatureHeader: request.headers.get("x-signature"),
    requestId: request.headers.get("x-request-id"),
    dataId,
    secret,
  });
  if (!valid) return Response.json({ error: "invalid_signature" }, { status: 401 });

  // Solo nos interesan notificaciones de pagos; las demás se aceptan para que no se reintenten.
  if (type !== "payment" || !dataId) return Response.json({ received: true });

  try {
    const payment = await fetchMercadoPagoPayment(dataId);
    if (!payment.external_reference) return Response.json({ received: true });
    const result = await applyPaymentResult({
      orderId: payment.external_reference,
      result: mapMercadoPagoStatus(payment.status),
      eventId: `${payment.id}:${payment.status}`,
      payment: {
        provider: "MERCADOPAGO",
        providerPaymentId: String(payment.id),
        amount: Math.round(payment.transaction_amount * 100),
        method: payment.payment_method_id,
      },
    });
    return Response.json({ received: true, result });
  } catch (e) {
    console.error("[webhook:mercadopago]", e);
    // 500 → Mercado Pago reintentará la notificación más tarde.
    return Response.json({ error: "processing_failed" }, { status: 500 });
  }
}
