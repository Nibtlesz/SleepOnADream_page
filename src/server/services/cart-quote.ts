/**
 * Cotización autoritativa del carrito (servidor).
 * Recalcula precios, valida inventario y estado del producto, aplica descuentos
 * y calcula el envío por zona. El checkout (Fase 3/5) reutilizará esta función
 * dentro de una transacción antes de crear el pedido.
 */
import "server-only";
import { SHIPPING_ZONES, storeConfig } from "@/config/store";
import { sampleDiscounts } from "@/data/sample/discounts";
import { computeTotals, type DiscountRule } from "@/lib/commerce/pricing";
import type { CartQuoteInput } from "@/lib/validation/schemas";
import { findVariantsForQuote } from "@/server/queries/catalog";

export type LineIssue = "unavailable" | "out_of_stock" | "insufficient_stock";

export interface CartQuote {
  lines: Array<{
    variantId: string;
    quantity: number;
    unitPrice: number;
    available: number;
    issue: LineIssue | null;
  }>;
  discount: { code: string; status: "applied" | "invalid" | "min_not_met"; label?: string } | null;
  shipping: {
    zone: string | null;
    options: Array<{ id: string; name: string; price: number; eta: string }>;
    selectedId: string | null;
  };
  totals: ReturnType<typeof computeTotals>;
}

function findDiscount(code: string): DiscountRule | null {
  // Fase 4: db.discountCode.findUnique + vigencia + límite de usos.
  const found = sampleDiscounts.find((d) => d.code === code && d.active);
  return found ?? null;
}

function discountLabel(d: DiscountRule) {
  if (d.type === "PERCENT") return `${d.value}% de descuento`;
  if (d.type === "FREE_SHIPPING") return "Envío gratis";
  return "Descuento aplicado";
}

export async function quoteCart(input: CartQuoteInput): Promise<CartQuote> {
  const variants = await findVariantsForQuote(input.items.map((i) => i.variantId));

  const lines = input.items.map((item) => {
    const found = variants.get(item.variantId);
    if (!found || found.product.status !== "ACTIVE") {
      return { variantId: item.variantId, quantity: 0, unitPrice: 0, available: 0, issue: "unavailable" as const };
    }
    const unitPrice = found.variant.price ?? found.product.basePrice;
    const available = found.variant.stock;
    const quantity = Math.min(item.quantity, available, storeConfig.maxQtyPerItem);
    const issue: LineIssue | null =
      available === 0 ? "out_of_stock" : quantity < item.quantity ? "insufficient_stock" : null;
    return { variantId: item.variantId, quantity, unitPrice, available, issue };
  });

  const purchasable = lines.filter((l) => l.quantity > 0);
  const subtotal = purchasable.reduce((a, l) => a + l.unitPrice * l.quantity, 0);

  let discount: CartQuote["discount"] = null;
  let rule: DiscountRule | null = null;
  if (input.code) {
    rule = findDiscount(input.code);
    if (!rule) discount = { code: input.code, status: "invalid" };
    else if (subtotal < (rule.minSubtotal ?? 0)) {
      discount = { code: input.code, status: "min_not_met" };
      rule = null;
    } else discount = { code: rule.code, status: "applied", label: discountLabel(rule) };
  }

  const zone = input.state ? SHIPPING_ZONES.find((z) => z.states.includes(input.state!)) ?? null : null;
  const options = (zone?.rates ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    price: r.price,
    eta: `${r.etaDaysMin}–${r.etaDaysMax} días hábiles`,
  }));
  const selected = options.find((o) => o.id === input.rateId) ?? options[0] ?? null;

  const totals = computeTotals({
    lines: purchasable,
    discount: rule,
    shippingPrice: selected?.price ?? null,
    freeShippingOver: storeConfig.freeShippingOver,
  });

  return {
    lines,
    discount,
    shipping: { zone: zone?.name ?? null, options, selectedId: selected?.id ?? null },
    totals,
  };
}
