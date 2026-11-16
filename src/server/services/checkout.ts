/**
 * Creación de pedidos desde el checkout.
 *
 * Garantías:
 *  1. Idempotencia: la misma `idempotencyKey` siempre devuelve el mismo pedido
 *     (doble clic, reintento de red, recarga durante el envío).
 *  2. Precios, descuentos, envío e inventario se recalculan en el servidor.
 *  3. El inventario se reserva de forma atómica al crear el pedido y se libera
 *     si el pago no se confirma antes de `reservedUntil`.
 *  4. El pago solo se confirma por webhook verificado (o pago de prueba en desarrollo).
 */
import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { storeConfig } from "@/config/store";
import type { OrderRecord } from "@/lib/orders";
import type { CheckoutInput, MercadoPagoSubmission } from "@/lib/validation/checkout";
import { findVariantsForQuote } from "@/server/queries/catalog";
import { isMethodEnabled } from "@/server/payments/config";
import {
  createMercadoPagoPayment,
  extractInstructions,
  mapMercadoPagoStatus,
  rejectionMessage,
  resolvePaymentMethod,
} from "@/server/payments/mercadopago";
import { orders, OutOfStockError } from "@/server/orders/repository";
import { quoteCart, type CartQuote } from "./cart-quote";
import { applyPaymentResult } from "./payments";

export type CheckoutResult =
  | { ok: true; order: OrderRecord; next: "confirmation" }
  | { ok: false; error: "cart_changed"; message: string; quote: CartQuote }
  | {
      ok: false;
      error: "shipping_required" | "payment_unavailable" | "empty_cart" | "payment_rejected" | "payment_error" | "order_expired";
      message: string;
    };

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  // 1) Idempotencia: misma clave → mismo pedido.
  const existing = await orders.findByIdempotencyKey(input.idempotencyKey);
  if (existing) {
    if (existing.status === "CANCELLED") {
      return { ok: false, error: "order_expired", message: "Tu reserva expiró. Vuelve a intentar el pago para apartar de nuevo tus productos." };
    }
    // Reintento de pago (p. ej. otra tarjeta tras un rechazo) sobre el mismo pedido.
    if (existing.status === "PENDING_PAYMENT" && input.paymentMethod !== "test" && !existing.paymentInstructions) {
      return payWithMercadoPago(existing, input);
    }
    return { ok: true, order: existing, next: "confirmation" };
  }

  if (!isMethodEnabled(input.paymentMethod)) {
    return { ok: false, error: "payment_unavailable", message: "Ese método de pago no está disponible por ahora." };
  }

  // Libera reservas vencidas antes de calcular disponibilidad.
  await orders.expireStale();

  // 2) Cotización autoritativa
  const quote = await quoteCart({
    items: input.items,
    code: input.code,
    state: input.address.state,
    rateId: input.rateId,
  });

  const changed = quote.lines.some((l) => l.issue !== null);
  if (changed) {
    return { ok: false, error: "cart_changed", message: "Algunos productos cambiaron de precio o disponibilidad. Revisa tu pedido.", quote };
  }
  const rate = quote.shipping.options.find((o) => o.id === quote.shipping.selectedId);
  if (!rate || quote.totals.shippingTotal == null || quote.shipping.selectedId !== input.rateId) {
    return { ok: false, error: "shipping_required", message: "Elige un método de envío válido para tu estado." };
  }
  if (quote.lines.length === 0) return { ok: false, error: "empty_cart", message: "Tu carrito está vacío." };

  // 3) Instantánea de productos (nombre / variante al momento de comprar)
  const variants = await findVariantsForQuote(input.items.map((i) => i.variantId));
  const items = quote.lines.map((l) => {
    const v = variants.get(l.variantId)!;
    return {
      variantId: l.variantId,
      productName: v.product.name,
      variantLabel: [v.variant.color, v.variant.size].filter(Boolean).join(" / "),
      unitPrice: l.unitPrice,
      quantity: l.quantity,
    };
  });

  let order: OrderRecord;
  try {
    order = await orders.create({
      idempotencyKey: input.idempotencyKey,
      accessToken: randomBytes(24).toString("base64url"),
      email: input.customer.email.toLowerCase(),
      customerName: input.customer.name,
      phone: input.customer.phone,
      address: input.address,
      shippingRateName: `${rate.name} · ${rate.eta}`,
      paymentMethod: input.paymentMethod === "test" ? "test" : "mercadopago",
      items,
      subtotal: quote.totals.subtotal,
      discountTotal: quote.totals.discountTotal,
      discountCode: quote.discount?.status === "applied" ? quote.discount.code : null,
      shippingTotal: quote.totals.shippingTotal,
      total: quote.totals.total,
      reservedUntil: new Date(Date.now() + storeConfig.reservationMinutes * 60_000).toISOString(),
      paymentInstructions: null,
    });
  } catch (e) {
    if (e instanceof OutOfStockError) {
      const fresh = await quoteCart({ items: input.items, code: input.code, state: input.address.state, rateId: input.rateId });
      return { ok: false, error: "cart_changed", message: "Alguien se llevó las últimas piezas mientras comprabas. Revisa tu pedido.", quote: fresh };
    }
    throw e;
  }

  // 4) Pago
  if (input.paymentMethod === "test") {
    // Simula exactamente lo que haría un webhook aprobado.
    await applyPaymentResult({
      orderId: order.id,
      result: "approved",
      eventId: `test-${randomUUID()}`,
      payment: { provider: "TEST", providerPaymentId: `test-${order.number}`, amount: order.total, method: "test" },
    });
    order = (await orders.findById(order.id)) ?? order;
  }
  if (input.paymentMethod !== "test") return payWithMercadoPago(order, input);

  return { ok: true, order, next: "confirmation" };
}

/**
 * Cobra un pedido pendiente con Mercado Pago.
 *  - approved   → se confirma con el MISMO camino que el webhook (idempotente).
 *  - pending    → OXXO / SPEI / revisión: se guardan instrucciones y se extiende la reserva.
 *  - rejected   → el pedido sigue pendiente para reintentar con otro medio.
 */
async function payWithMercadoPago(order: OrderRecord, input: CheckoutInput): Promise<CheckoutResult> {
  // SPEI no pasa por el Brick: el pago (método "clabe") se crea solo con datos del servidor.
  const spei = input.paymentMethod === "spei";
  const submission: MercadoPagoSubmission = spei
    ? { attemptId: order.id, selectedPaymentMethod: "bank_transfer", formData: { payment_method_id: "clabe" } }
    : input.mercadopago!;
  const created = await createMercadoPagoPayment({
    order,
    submission,
    // Único por intento: si la red falla y el navegador reenvía, Mercado Pago no cobra dos veces.
    // SPEI usa una sola clave por pedido: repetir la solicitud devuelve la misma referencia.
    idempotencyKey: spei ? `${order.id}:spei` : `${order.id}:${submission.attemptId}`,
  });
  if (!created.ok) {
    return {
      ok: false,
      error: created.status >= 500 ? "payment_error" : "payment_rejected",
      message:
        created.status >= 500
          ? "No pudimos conectar con Mercado Pago. Intenta de nuevo en un momento."
          : "Mercado Pago no aceptó los datos de pago. Revísalos o usa otro medio.",
    };
  }

  const p = created.payment;
  if (p.external_reference && p.external_reference !== order.id) {
    console.error(`[checkout] external_reference inesperado ${p.external_reference} ≠ ${order.id}`);
    return { ok: false, error: "payment_error", message: "No pudimos verificar el pago. Contáctanos antes de reintentar." };
  }

  const result = mapMercadoPagoStatus(p.status);
  if (result === "rejected") {
    return { ok: false, error: "payment_rejected", message: rejectionMessage(p.status_detail) };
  }

  const method = resolvePaymentMethod(p);
  if (result === "approved") {
    await orders.updatePendingPayment(order.id, { paymentMethod: method, paymentInstructions: null, reservedUntil: null });
    await applyPaymentResult({
      orderId: order.id,
      result: "approved",
      eventId: `${p.id}:approved`, // mismo id que usará el webhook → no se procesa dos veces
      payment: {
        provider: "MERCADOPAGO",
        providerPaymentId: String(p.id),
        amount: Math.round(p.transaction_amount * 100),
        method: p.payment_method_id,
      },
    });
  } else {
    const instructions = extractInstructions(p, order.total);
    // Se aparta hasta que vence la ficha; si Mercado Pago no informa vigencia:
    // 72 h para SPEI y 24 h para pagos con tarjeta en revisión.
    const until = p.date_of_expiration ?? new Date(Date.now() + (spei ? 72 : 24) * 3600_000).toISOString();
    await orders.updatePendingPayment(order.id, { paymentMethod: method, paymentInstructions: instructions, reservedUntil: until });
  }

  return { ok: true, order: (await orders.findById(order.id)) ?? order, next: "confirmation" };
}
