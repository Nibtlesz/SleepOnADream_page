/**
 * Cálculo de totales del carrito. Función pura compartida por cliente y servidor.
 * El servidor SIEMPRE recalcula con precios e inventario de la base de datos;
 * el cliente solo la usa para mostrar estimaciones instantáneas.
 * Montos en centavos de MXN.
 */

export type DiscountType = "PERCENT" | "FIXED" | "FREE_SHIPPING";

export interface DiscountRule {
  code: string;
  type: DiscountType;
  value: number; // % (0-100) o centavos
  minSubtotal?: number | null;
}

export interface TotalsInput {
  lines: Array<{ unitPrice: number; quantity: number }>;
  discount?: DiscountRule | null;
  shippingPrice?: number | null; // null = aún no se elige dirección / método
  freeShippingOver?: number | null;
}

export interface Totals {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number | null;
  total: number;
  freeShipping: boolean;
  amountToFreeShipping: number | null;
}

export function computeTotals({ lines, discount, shippingPrice = null, freeShippingOver = null }: TotalsInput): Totals {
  const subtotal = lines.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0);

  const discountApplies = discount && subtotal >= (discount.minSubtotal ?? 0);
  let discountTotal = 0;
  if (discountApplies && discount.type === "PERCENT") {
    discountTotal = Math.round((subtotal * Math.min(Math.max(discount.value, 0), 100)) / 100);
  } else if (discountApplies && discount.type === "FIXED") {
    discountTotal = Math.min(discount.value, subtotal);
  }

  const afterDiscount = subtotal - discountTotal;
  const reachesFree = freeShippingOver != null && afterDiscount >= freeShippingOver;
  const freeShipping = Boolean(reachesFree || (discountApplies && discount.type === "FREE_SHIPPING"));

  const shippingTotal = shippingPrice == null ? null : freeShipping ? 0 : shippingPrice;
  const amountToFreeShipping =
    freeShippingOver == null || freeShipping ? null : Math.max(freeShippingOver - afterDiscount, 0);

  return {
    subtotal,
    discountTotal,
    shippingTotal,
    total: afterDiscount + (shippingTotal ?? 0),
    freeShipping,
    amountToFreeShipping,
  };
}
