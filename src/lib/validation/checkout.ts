/**
 * Validación del checkout. Los mensajes son claves traducibles (ver i18n/dictionaries → messages). Los mismos esquemas se usan en cada paso del
 * formulario (cliente) y en POST /api/checkout (servidor).
 */
import { z } from "zod";
import { MX_STATES } from "@/config/store";
import { cartQuoteSchema } from "./schemas";

const stateCodes = MX_STATES.map(([code]) => code) as [string, ...string[]];

export const customerSchema = z.object({
  email: z.email({ error: "v.email" }).trim().max(254),
  name: z.string().trim().min(3, "v.fullName").max(120),
  phone: z
    .string()
    .transform((s) => s.replace(/\D/g, ""))
    .pipe(z.string().regex(/^(52)?\d{10}$/, "v.phone")),
});

export const addressSchema = z.object({
  recipient: z.string().trim().min(3, "v.recipient").max(120),
  street: z.string().trim().min(2, "v.street").max(120),
  extNumber: z.string().trim().min(1, "v.extNumber").max(20),
  intNumber: z.string().trim().max(20).optional().default(""),
  neighborhood: z.string().trim().min(2, "v.neighborhood").max(120),
  postalCode: z.string().trim().regex(/^\d{5}$/, "v.postalCode"),
  city: z.string().trim().min(2, "v.city").max(120),
  state: z.enum(stateCodes, { error: "v.state" }),
  references: z.string().trim().max(240).optional().default(""),
});

export const shippingSchema = z.object({
  rateId: z.string({ error: "v.rate" }).min(1, "v.rate").max(32),
});

/** Cómo se cobra en el checkout. */
export const CHECKOUT_PAYMENT = ["mercadopago", "spei", "test"] as const;
export type CheckoutPayment = (typeof CHECKOUT_PAYMENT)[number];

/** Método real con el que quedó el pedido (se conoce después de elegirlo en Mercado Pago). */
export const PAYMENT_METHODS = ["mercadopago", "card", "oxxo", "spei", "test"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const paymentSchema = z.object({
  paymentMethod: z.enum(CHECKOUT_PAYMENT, { error: "v.paymentMethod" }),
  acceptTerms: z.literal(true, { error: "v.terms" }),
});

/**
 * Datos que entrega el Payment Brick de Mercado Pago en `onSubmit`.
 * Solo se aceptan los campos que reenviamos; el MONTO nunca se toma de aquí.
 * `token` es el token de un solo uso de la tarjeta (no contiene el número).
 */
export const mercadoPagoSubmissionSchema = z.object({
  attemptId: z.uuid(),
  selectedPaymentMethod: z.string().max(40),
  formData: z.object({
    token: z.string().max(200).optional(),
    issuer_id: z.union([z.string(), z.number()]).optional(),
    payment_method_id: z.string().min(1).max(60),
    installments: z.coerce.number().int().min(1).max(24).optional(),
    payer: z
      .object({
        email: z.string().max(254).optional(),
        identification: z.object({ type: z.string().max(20), number: z.string().max(40) }).optional(),
        first_name: z.string().max(120).optional(),
        last_name: z.string().max(120).optional(),
      })
      .optional(),
    transaction_details: z.object({ financial_institution: z.string().max(60) }).optional(),
    metadata: z.object({ payment_point: z.string().max(60).optional() }).optional(),
  }),
});
export type MercadoPagoSubmission = z.infer<typeof mercadoPagoSubmissionSchema>;

export const checkoutSchema = z.object({
  idempotencyKey: z.uuid(),
  customer: customerSchema,
  address: addressSchema,
  items: cartQuoteSchema.shape.items.min(1, "v.cartEmpty"),
  code: cartQuoteSchema.shape.code,
  rateId: shippingSchema.shape.rateId,
  paymentMethod: paymentSchema.shape.paymentMethod,
  acceptTerms: paymentSchema.shape.acceptTerms,
  mercadopago: mercadoPagoSubmissionSchema.optional(),
}).refine((d) => d.paymentMethod !== "mercadopago" || d.mercadopago, {
  error: "Faltan los datos de pago.",
  path: ["mercadopago"],
});

export type CustomerInput = z.input<typeof customerSchema>;
export type AddressInput = z.input<typeof addressSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ShippingAddress = z.infer<typeof addressSchema>;

/** Convierte un ZodError en { campo: "primer mensaje" } para el formulario. */
export function firstErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
