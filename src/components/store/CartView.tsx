"use client";

import { ArrowRight, ShoppingBag, Tag } from "lucide-react";
import { useState } from "react";
import { Button, ButtonLink, buttonClass } from "@/components/ui/Button";
import { MX_STATES } from "@/config/store";
import { describeDiscount } from "@/i18n";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { useCart, useHydrated } from "@/store/cart";
import { CartLine } from "./CartLine";
import { ShippingOptions } from "./ShippingOptions";
import { TotalsList } from "./TotalsList";
import { useCartQuote } from "./useCartQuote";

/** Carrito completo con cotización del servidor (precios, inventario, descuento y envío). */
export function CartView() {
  const { t } = useI18n();
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const code = useCart((s) => s.code);
  const setCode = useCart((s) => s.setCode);
  const shipState = useCart((s) => s.shipState);
  const setShipping = useCart((s) => s.setShipping);
  const [codeInput, setCodeInput] = useState("");
  const { quote, loading, failed } = useCartQuote();

  if (!hydrated) return <div className="h-96 animate-pulse bg-coal" aria-busy />;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 border border-smoke bg-coal py-24 text-center">
        <ShoppingBag className="h-12 w-12 text-iron" strokeWidth={1.2} />
        <p className="display text-4xl">{t.cart.emptyTitle}</p>
        <ButtonLink href="/store">{t.common.goToStore}</ButtonLink>
      </div>
    );
  }

  const issueFor = (id: string) => {
    const issue = quote?.lines.find((l) => l.variantId === id)?.issue;
    return issue ? t.cart.issues[issue] : null;
  };
  const blocking = quote?.lines.some((l) => l.issue === "unavailable" || l.issue === "out_of_stock") ?? false;

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <section className="lg:col-span-7" aria-label={t.cart.products}>
        <ul className="divide-y divide-smoke border-y border-smoke">
          {items.map((item) => <CartLine key={item.variantId} item={item} notice={issueFor(item.variantId)} />)}
        </ul>
      </section>

      <aside className="lg:col-span-5" aria-label={t.cart.summary}>
        <div className="space-y-8 border border-smoke bg-coal p-6 md:p-8 lg:sticky lg:top-28">
          <div>
            <label htmlFor="ship-state" className="eyebrow mb-3 block">{t.cart.shipState}</label>
            <select id="ship-state" value={shipState ?? ""} onChange={(e) => setShipping(e.target.value || null, null)} className="field">
              <option value="">{t.cart.selectState}</option>
              {MX_STATES.map(([k, name]) => <option key={k} value={k}>{name}</option>)}
            </select>
            {quote && quote.shipping.options.length > 0 && (
              <div className="mt-4">
                <ShippingOptions quote={quote} onSelect={(id) => setShipping(shipState, id)} />
              </div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); setCode(codeInput.trim().toUpperCase() || null); }}>
            <label htmlFor="promo" className="eyebrow mb-3 block">{t.cart.discountCode}</label>
            <div className="flex">
              <input id="promo" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder={code ?? "EJEMPLO10"} className="field min-w-0 flex-1 uppercase" autoComplete="off" />
              <Button type="submit" variant="outline" className="shrink-0 border-l-0">{t.common.apply}</Button>
            </div>
            {quote?.discount && (
              <p className={cn("mt-2 flex items-center gap-2 text-xs", quote.discount.status === "applied" ? "text-bone" : "text-ember")}>
                <Tag className="h-3.5 w-3.5" />
                {quote.discount.status === "applied" && <>{quote.discount.code}: {describeDiscount(t, quote.discount)}</>}
                {quote.discount.status === "invalid" && t.cart.discountInvalid}
                {quote.discount.status === "min_not_met" && t.cart.discountMin}
                {code && <button type="button" className="ml-auto underline" onClick={() => { setCode(null); setCodeInput(""); }}>{t.common.remove}</button>}
              </p>
            )}
          </form>

          <TotalsList totals={quote?.totals} loading={loading} className="border-t border-smoke pt-6" />

          {failed && <p role="alert" className="text-xs text-ember">{t.cart.quoteFailed}</p>}

          <div>
            {blocking ? (
              <span className={buttonClass("primary", "lg", "pointer-events-none w-full opacity-40")} aria-disabled>
                {t.cart.continueToPay}
              </span>
            ) : (
              <ButtonLink href="/checkout" size="lg" className="w-full">
                {t.cart.continueToPay} <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            )}
            <p className="mt-3 text-center text-xs text-fog">
              {blocking ? t.cart.removeUnavailable : t.cart.securePayment}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
