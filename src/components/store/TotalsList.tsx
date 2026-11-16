"use client";

import { fill } from "@/i18n";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { formatMXN } from "@/lib/format";
import type { Totals } from "@/lib/commerce/pricing";

export function TotalsList({ totals, loading, className }: { totals: Totals | null | undefined; loading?: boolean; className?: string }) {
  const { t: d } = useI18n();
  const t = totals;
  return (
    <dl className={cn("space-y-3 text-sm transition-opacity", loading && "opacity-60", className)} aria-busy={loading}>
      <div className="flex justify-between"><dt className="text-mist">{d.cart.subtotal}</dt><dd className="tabular-nums">{t ? formatMXN(t.subtotal) : "—"}</dd></div>
      {t && t.discountTotal > 0 && (
        <div className="flex justify-between text-ember"><dt>{d.cart.discount}</dt><dd className="tabular-nums">−{formatMXN(t.discountTotal)}</dd></div>
      )}
      <div className="flex justify-between">
        <dt className="text-mist">{d.cart.shipping}</dt>
        <dd className="tabular-nums">
          {t?.shippingTotal == null ? <span className="text-fog">{d.cart.chooseState}</span> : t.shippingTotal === 0 ? d.cart.free : formatMXN(t.shippingTotal)}
        </dd>
      </div>
      {t?.amountToFreeShipping ? <p className="text-xs text-fog">{fill(d.cart.addForFree, { amount: formatMXN(t.amountToFreeShipping) })}</p> : null}
      <div className="flex items-baseline justify-between border-t border-smoke pt-4">
        <dt className="font-semibold">{d.cart.total}</dt>
        <dd className="text-2xl font-semibold tabular-nums">{t ? formatMXN(t.total) : "—"}</dd>
      </div>
      <p className="text-xs text-fog">{d.cart.taxNote}</p>
    </dl>
  );
}
