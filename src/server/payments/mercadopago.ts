/**
 * Mercado Pago — API oficial REST (servidor).
 *  - Creación de pagos (tarjeta con token del Brick, OXXO, SPEI).
 *  - Verificación de webhooks y consulta de pagos.
 * Docs: https://www.mercadopago.com.mx/developers/es/reference/payments/_payments/post
 */
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { siteConfig } from "@/config/site";
import { orderNumber } from "@/lib/format";
import type { OrderRecord, PaymentInstructions } from "@/lib/orders";
import type { MercadoPagoSubmission, PaymentMethod } from "@/lib/validation/checkout";
import type { PaymentResult } from "@/server/services/payments";

/** Permite apuntar a un servidor simulado en pruebas locales. */
const API_URL = process.env.MERCADOPAGO_API_URL ?? "https://api.mercadopago.com";

/** Vigencia de fichas OXXO / SPEI (el pedido queda apartado hasta entonces). */
const DEFERRED_PAYMENT_HOURS = 48;

// ─────────────────────────────────────────────────────────────
// Webhooks
// ─────────────────────────────────────────────────────────────

/**
 * Valida la cabecera `x-signature` ("ts=…,v1=…").
 * Plantilla firmada: `id:{data.id};request-id:{x-request-id};ts:{ts};`
 */
export function verifyMercadoPagoSignature(params: {
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | null;
  secret: string;
  toleranceS?: number;
  nowS?: number;
}): boolean {
  const { signatureHeader, requestId, dataId, secret, toleranceS = 300, nowS = Math.floor(Date.now() / 1000) } = params;
  if (!signatureHeader || !dataId || !secret) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [k, ...v] = p.trim().split("=");
      return [k, v.join("=")];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1 || !/^[0-9a-f]+$/i.test(v1)) return false;

  // Rechaza notificaciones viejas (ataques de repetición). ts puede venir en s o ms.
  const tsS = ts.length > 10 ? Math.floor(Number(ts) / 1000) : Number(ts);
  if (!Number.isFinite(tsS) || Math.abs(nowS - tsS) > toleranceS) return false;

  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  let manifest = `id:${id};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${ts};`;

  const expected = createHmac("sha256", secret).update(manifest).digest();
  const received = Buffer.from(v1, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

// ─────────────────────────────────────────────────────────────
// API de pagos
// ─────────────────────────────────────────────────────────────

export interface MercadoPagoPayment {
  id: number;
  status: string; // approved | authorized | pending | in_process | rejected | cancelled | refunded | charged_back
  status_detail: string | null;
  external_reference: string | null; // = id de nuestro pedido
  transaction_amount: number; // pesos
  payment_method_id: string | null;
  payment_type_id: string | null; // credit_card | debit_card | ticket | atm | bank_transfer
  date_of_expiration: string | null;
  transaction_details?: {
    external_resource_url?: string | null; // ficha OXXO / instrucciones
    payment_method_reference_id?: string | null; // referencia de pago en efectivo
    financial_institution?: string | null;
  } | null;
  /** SPEI (`clabe`): referencia e instrucciones de la transferencia. */
  payment_method?: {
    data?: { reference_id?: string | null; external_reference_id?: string | null; external_resource_url?: string | null } | null;
  } | null;
}

async function mpFetch<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<{ status: number; body: T }> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN no configurado");
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.idempotencyKey ? { "X-Idempotency-Key": init.idempotencyKey } : {}),
      ...init.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const body = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, body };
}

export async function fetchMercadoPagoPayment(paymentId: string): Promise<MercadoPagoPayment> {
  const { status, body } = await mpFetch<MercadoPagoPayment>(`/v1/payments/${encodeURIComponent(paymentId)}`);
  if (status !== 200) throw new Error(`Mercado Pago respondió ${status}`);
  return body;
}

export function mapMercadoPagoStatus(status: string): PaymentResult {
  if (status === "approved") return "approved";
  if (status === "rejected" || status === "cancelled") return "rejected";
  return "pending";
}

/** Fecha con zona horaria explícita, formato que acepta la API (ISO 8601 con offset). */
function mexicoCityIso(date: Date) {
  // Desde 2022 la CDMX no cambia de horario: UTC−06:00 todo el año.
  const shifted = new Date(date.getTime() - 6 * 3600_000);
  return shifted.toISOString().replace("Z", "-06:00");
}

function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  return { first: parts[0] ?? full, last: parts.slice(1).join(" ") || parts[0] || full };
}

/**
 * Crea un pago para un pedido ya creado (y con inventario apartado).
 * El MONTO, la referencia y la URL de notificación siempre salen del servidor.
 * `idempotencyKey` es único por intento: un reintento de red no cobra dos veces.
 */
export async function createMercadoPagoPayment(params: {
  order: OrderRecord;
  submission: MercadoPagoSubmission;
  idempotencyKey: string;
}): Promise<{ ok: true; payment: MercadoPagoPayment } | { ok: false; status: number; message: string }> {
  const { order, submission, idempotencyKey } = params;
  const f = submission.formData;
  const name = splitName(order.customerName);
  const isSpei = f.payment_method_id === "clabe";
  const isCash = submission.selectedPaymentMethod === "ticket" || submission.selectedPaymentMethod === "atm";
  const deferred = isCash || isSpei;

  const body = {
    transaction_amount: order.total / 100,
    description: `Pedido ${orderNumber(order.number)} · ${siteConfig.name}`,
    external_reference: order.id,
    notification_url: `${siteConfig.url}/api/webhooks/mercadopago`,
    statement_descriptor: "SLEEPONADREAM",
    payment_method_id: f.payment_method_id,
    ...(f.token ? { token: f.token } : {}),
    ...(f.issuer_id != null && f.issuer_id !== "" ? { issuer_id: f.issuer_id } : {}),
    ...(f.installments ? { installments: f.installments } : deferred ? {} : { installments: 1 }),
    ...(f.transaction_details ? { transaction_details: f.transaction_details } : {}),
    ...(f.metadata ? { metadata: f.metadata } : {}),
    // Vigencia de la ficha en efectivo (documentada para OXXO/ticket). SPEI usa la vigencia de Mercado Pago.
    ...(isCash ? { date_of_expiration: mexicoCityIso(new Date(Date.now() + DEFERRED_PAYMENT_HOURS * 3600_000)) } : {}),
    payer: {
      email: order.email,
      ...(isSpei ? { entity_type: "individual" } : {}),
      first_name: f.payer?.first_name || name.first,
      last_name: f.payer?.last_name || name.last,
      ...(f.payer?.identification?.number ? { identification: f.payer.identification } : {}),
    },
    additional_info: {
      items: order.items.map((i) => ({
        id: i.variantId,
        title: i.productName,
        description: i.variantLabel || i.productName,
        quantity: i.quantity,
        unit_price: i.unitPrice / 100,
        category_id: "fashion",
      })),
      payer: { first_name: name.first, last_name: name.last, phone: { number: order.phone } },
      shipments: {
        receiver_address: {
          zip_code: order.address.postalCode,
          state_name: order.address.state,
          city_name: order.address.city,
          street_name: order.address.street,
          street_number: Number.parseInt(order.address.extNumber, 10) || undefined,
        },
      },
    },
  };

  const { status, body: resBody } = await mpFetch<MercadoPagoPayment & { message?: string }>("/v1/payments", {
    method: "POST",
    body: JSON.stringify(body),
    idempotencyKey,
  });
  if (status === 200 || status === 201) return { ok: true, payment: resBody };
  console.error("[mercadopago] error al crear pago", status, resBody?.message);
  return { ok: false, status, message: resBody?.message ?? "error" };
}

/** Método de nuestro catálogo a partir de la respuesta de Mercado Pago. */
export function resolvePaymentMethod(p: MercadoPagoPayment): PaymentMethod {
  if (p.payment_type_id === "bank_transfer") return "spei";
  if (p.payment_type_id === "ticket" || p.payment_type_id === "atm") return "oxxo";
  return "card";
}

/** Extrae lo necesario para que el comprador termine un pago diferido. */
export function extractInstructions(p: MercadoPagoPayment, amount: number): PaymentInstructions | null {
  const td = p.transaction_details ?? {};
  if (p.payment_type_id === "bank_transfer") {
    const data = p.payment_method?.data ?? {};
    return {
      kind: "spei",
      clabe: null, // la API de pagos no expone la CLABE: viene en las instrucciones
      bank: td.financial_institution ?? null,
      beneficiary: null,
      reference: data.reference_id ?? td.payment_method_reference_id ?? null,
      voucherUrl: data.external_resource_url ?? td.external_resource_url ?? null,
      amount,
      expiresAt: p.date_of_expiration,
    };
  }
  if (p.payment_type_id === "ticket" || p.payment_type_id === "atm") {
    return {
      kind: p.payment_method_id === "oxxo" ? "oxxo" : "cash",
      reference: td.payment_method_reference_id ?? null,
      voucherUrl: td.external_resource_url ?? null,
      amount,
      expiresAt: p.date_of_expiration,
    };
  }
  if (p.status === "in_process" || p.status === "pending") {
    return { kind: "review", message: "Tu pago está en revisión. Te avisaremos por correo en cuanto Mercado Pago lo confirme (normalmente en minutos)." };
  }
  return null;
}

/** Mensaje claro para el comprador según `status_detail` de un pago rechazado. */
export function rejectionMessage(detail: string | null): string {
  const map: Record<string, string> = {
    cc_rejected_insufficient_amount: "Tu tarjeta no tiene fondos suficientes.",
    cc_rejected_bad_filled_security_code: "Revisa el código de seguridad de tu tarjeta.",
    cc_rejected_bad_filled_date: "Revisa la fecha de vencimiento de tu tarjeta.",
    cc_rejected_bad_filled_card_number: "Revisa el número de tu tarjeta.",
    cc_rejected_bad_filled_other: "Revisa los datos de tu tarjeta.",
    cc_rejected_call_for_authorize: "Tu banco requiere que autorices el pago. Llama a tu banco o usa otra tarjeta.",
    cc_rejected_card_disabled: "Tu tarjeta está inactiva. Actívala con tu banco o usa otra.",
    cc_rejected_duplicated_payment: "Ya hiciste un pago por este monto. Si necesitas pagar de nuevo, usa otra tarjeta.",
    cc_rejected_high_risk: "El pago fue rechazado por seguridad. Prueba con otro medio de pago.",
    cc_rejected_max_attempts: "Llegaste al límite de intentos. Usa otra tarjeta.",
    cc_rejected_blacklist: "No pudimos procesar el pago con esta tarjeta. Usa otro medio de pago.",
  };
  return (detail && map[detail]) ?? "Tu banco rechazó el pago. Prueba con otra tarjeta u otro medio de pago.";
}
