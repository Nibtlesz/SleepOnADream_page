/** Tipos de pedido compartidos entre servidor y la página de confirmación. */
import type { PaymentMethod, ShippingAddress } from "@/lib/validation/checkout";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pendiente de pago",
  PAID: "Pago confirmado",
  PREPARING: "En preparación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  mercadopago: "Mercado Pago",
  card: "Tarjeta de crédito o débito",
  oxxo: "Efectivo en OXXO",
  spei: "Transferencia SPEI",
  test: "Pago de prueba (simulado)",
};

/** Datos para completar un pago diferido. Se muestran en la confirmación. */
export type PaymentInstructions =
  | {
      kind: "oxxo" | "cash";
      reference: string | null;
      voucherUrl: string | null;
      amount: number;
      expiresAt: string | null;
    }
  | {
      kind: "spei";
      clabe: string | null;
      bank: string | null;
      beneficiary: string | null;
      reference: string | null;
      voucherUrl: string | null;
      amount: number;
      expiresAt: string | null;
    }
  | { kind: "review"; message: string };

export interface OrderRecord {
  id: string;
  number: number;
  accessToken: string;
  idempotencyKey: string;
  status: OrderStatus;
  email: string;
  customerName: string;
  phone: string;
  address: ShippingAddress;
  shippingRateName: string;
  paymentMethod: PaymentMethod;
  items: Array<{ variantId: string; productName: string; variantLabel: string; unitPrice: number; quantity: number }>;
  subtotal: number;
  discountTotal: number;
  discountCode: string | null;
  shippingTotal: number;
  total: number;
  reservedUntil: string | null;
  paymentInstructions: PaymentInstructions | null;
  createdAt: string;
}
