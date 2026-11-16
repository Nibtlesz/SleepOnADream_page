/**
 * Aplicación de resultados de pago a los pedidos.
 * Es el ÚNICO lugar que confirma un pago, y solo se llama con información
 * obtenida directamente de la API del proveedor (respuesta servidor-a-servidor
 * o webhook verificado) o desde el pago de prueba en desarrollo.
 * Nunca con datos que vengan del navegador.
 */
import "server-only";
import { formatMXN, orderNumber } from "@/lib/format";
import { orders, type PaymentUpdate } from "@/server/orders/repository";
import { sendEmail } from "./email";

export type PaymentResult = "approved" | "rejected" | "pending";

export type ApplyOutcome = "ok" | "duplicate" | "not_found" | "amount_mismatch" | "needs_review";

export async function applyPaymentResult(params: {
  orderId: string;
  result: PaymentResult;
  eventId: string | null;
  payment: PaymentUpdate;
}): Promise<ApplyOutcome> {
  const { orderId, result, eventId, payment } = params;

  if (eventId && !(await orders.recordEvent(payment.provider, eventId))) return "duplicate";

  const order = await orders.findById(orderId);
  if (!order) return "not_found";

  if (result !== "approved") {
    // Un pago rechazado NO cancela el pedido: el comprador puede reintentar con otro
    // medio mientras dure la reserva. Si no paga, el cron de expiración lo cancela.
    return "ok";
  }

  // Defensa: el monto cobrado debe coincidir con el total del pedido.
  if (payment.amount !== order.total) {
    console.error(`[pagos] Monto distinto en ${orderNumber(order.number)}: ${payment.amount} ≠ ${order.total}`);
    return "amount_mismatch";
  }

  if (order.status !== "PENDING_PAYMENT") {
    if (order.status === "CANCELLED") {
      // Pago aprobado después de que venció la reserva: requiere revisión manual
      // (reactivar si hay inventario o reembolsar desde el panel).
      console.error(`[pagos] Pago ${payment.providerPaymentId} aprobado para ${orderNumber(order.number)} ya cancelado: revisar/reembolsar.`);
      return "needs_review";
    }
    return "ok"; // ya estaba pagado: idempotente
  }

  const updated = await orders.markPaid(orderId, payment);
  if (updated?.status === "PAID") {
    await sendEmail({
      to: updated.email,
      subject: `Confirmamos tu pedido ${orderNumber(updated.number)}`,
      text: `Hola ${updated.customerName}, recibimos tu pago por ${formatMXN(updated.total)}. Te avisaremos cuando tu pedido sea enviado.`,
    });
  }
  return "ok";
}
