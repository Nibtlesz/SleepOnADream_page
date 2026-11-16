/** ⚠️ CÓDIGOS DE DESCUENTO DE EJEMPLO para probar el carrito. */
import type { DiscountRule } from "@/lib/commerce/pricing";

export const sampleDiscounts: Array<DiscountRule & { active: boolean }> = [
  { code: "EJEMPLO10", type: "PERCENT", value: 10, minSubtotal: null, active: true },
  { code: "ENVIOGRATIS", type: "FREE_SHIPPING", value: 0, minSubtotal: 80_000, active: true },
];
