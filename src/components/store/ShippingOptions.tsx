"use client";

import { fill } from "@/i18n";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { formatMXN } from "@/lib/format";
import type { CartQuote } from "@/server/services/cart-quote";

export function ShippingOptions({
  quote,
  onSelect,
}: {
  quote: CartQuote;
  onSelect: (rateId: string) => void;
}) {
  const { t } = useI18n();
  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">{t.cart.shippingMethod}</legend>
      {quote.shipping.options.map((o) => {
        const checked = quote.shipping.selectedId === o.id;
        return (
          <label
            key={o.id}
            className={cn(
              "flex cursor-pointer items-center justify-between gap-4 border px-4 py-3 text-sm transition-colors",
              checked ? "border-ember bg-blood/10" : "border-smoke hover:border-iron",
            )}
          >
            <span className="flex items-center gap-3">
              <input type="radio" name="rate" className="accent-ember" checked={checked} onChange={() => onSelect(o.id)} />
              <span>
                {t.cart.rateNames[o.name] ?? o.name}
                <span className="block text-xs text-fog">{fill(t.cart.eta, { min: o.etaMin, max: o.etaMax })} · {t.cart.zone} {quote.shipping.zone}</span>
              </span>
            </span>
            <span className="tabular-nums">{quote.totals.freeShipping ? t.cart.free : formatMXN(o.price)}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
