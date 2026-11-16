/**
 * Métodos de pago disponibles. Se lee en el servidor y se pasa a la UI.
 *  - Mercado Pago (tarjeta, OXXO, SPEI): requiere PAYMENT_PROVIDER=mercadopago,
 *    MERCADOPAGO_ACCESS_TOKEN y NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY.
 *  - El "pago de prueba" SOLO existe fuera de producción y nunca cobra.
 */
import "server-only";
import type { CheckoutPayment } from "@/lib/validation/checkout";

export function mercadoPagoEnabled() {
  return (
    process.env.PAYMENT_PROVIDER === "mercadopago" &&
    Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN) &&
    Boolean(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY)
  );
}

export function testPaymentsAllowed() {
  return process.env.NODE_ENV !== "production";
}

export interface PaymentOptions {
  mercadopago: { enabled: boolean; publicKey: string | null };
  test: boolean;
}

export function paymentOptions(): PaymentOptions {
  const enabled = mercadoPagoEnabled();
  return {
    mercadopago: { enabled, publicKey: enabled ? (process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ?? null) : null },
    test: testPaymentsAllowed(),
  };
}

export function isMethodEnabled(method: CheckoutPayment) {
  return method === "test" ? testPaymentsAllowed() : mercadoPagoEnabled();
}
