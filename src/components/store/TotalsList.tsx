import { cn } from "@/lib/cn";
import { formatMXN } from "@/lib/format";
import type { Totals } from "@/lib/commerce/pricing";

export function TotalsList({ totals, loading, className }: { totals: Totals | null | undefined; loading?: boolean; className?: string }) {
  const t = totals;
  return (
    <dl className={cn("space-y-3 text-sm transition-opacity", loading && "opacity-60", className)} aria-busy={loading}>
      <div className="flex justify-between"><dt className="text-mist">Subtotal</dt><dd className="tabular-nums">{t ? formatMXN(t.subtotal) : "—"}</dd></div>
      {t && t.discountTotal > 0 && (
        <div className="flex justify-between text-ember"><dt>Descuento</dt><dd className="tabular-nums">−{formatMXN(t.discountTotal)}</dd></div>
      )}
      <div className="flex justify-between">
        <dt className="text-mist">Envío</dt>
        <dd className="tabular-nums">
          {t?.shippingTotal == null ? <span className="text-fog">Elige tu estado</span> : t.shippingTotal === 0 ? "Gratis" : formatMXN(t.shippingTotal)}
        </dd>
      </div>
      {t?.amountToFreeShipping ? <p className="text-xs text-fog">Agrega {formatMXN(t.amountToFreeShipping)} más para envío gratis.</p> : null}
      <div className="flex items-baseline justify-between border-t border-smoke pt-4">
        <dt className="font-semibold">Total</dt>
        <dd className="text-2xl font-semibold tabular-nums">{t ? formatMXN(t.total) : "—"}</dd>
      </div>
      <p className="text-xs text-fog">Precios en MXN con IVA incluido.</p>
    </dl>
  );
}
