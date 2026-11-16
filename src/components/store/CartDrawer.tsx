"use client";

import { AnimatePresence, motion } from "motion/react";
import { ShoppingBag, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { storeConfig } from "@/config/store";
import { fillNodes } from "@/i18n";
import { useI18n } from "@/i18n/client";
import { formatMXN } from "@/lib/format";
import { selectSubtotal, useCart, useHydrated } from "@/store/cart";
import { CartLine } from "./CartLine";

export function CartDrawer() {
  const { t } = useI18n();
  const { items, isOpen, close } = useCart();
  const subtotal = useCart(selectSubtotal);
  const hydrated = useHydrated();
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [isOpen, close]);

  const remaining = Math.max(storeConfig.freeShippingOver - subtotal, 0);
  const progress = Math.min(subtotal / storeConfig.freeShippingOver, 1);

  return (
    <AnimatePresence>
      {hydrated && isOpen && (
        <div className="fixed inset-0 z-[70]">
          <motion.div
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            aria-hidden
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={t.cart.dialog}
            tabIndex={-1}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-smoke bg-coal outline-none"
          >
            <div className="flex items-center justify-between border-b border-smoke px-6 py-5">
              <p className="display text-2xl">{t.cart.drawerTitle}</p>
              <button type="button" onClick={close} className="grid h-10 w-10 place-items-center text-mist hover:text-bone" aria-label={t.cart.close}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
                <ShoppingBag className="h-10 w-10 text-iron" strokeWidth={1.2} />
                <p className="text-mist">{t.cart.empty}</p>
                <ButtonLink href="/store" variant="outline">{t.common.goToStore}</ButtonLink>
              </div>
            ) : (
              <>
                <div className="border-b border-smoke px-6 py-4">
                  <p className="text-xs text-mist">
                    {remaining > 0 ? (
                      fillNodes(t.cart.toFree, { amount: <strong className="text-bone">{formatMXN(remaining)}</strong> })
                    ) : (
                      <strong className="text-bone">{t.cart.freeShipping}</strong>
                    )}
                  </p>
                  <div className="mt-2 h-1 bg-smoke" aria-hidden>
                    <div className="h-full bg-ember transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
                  </div>
                </div>
                <ul className="flex-1 divide-y divide-smoke overflow-y-auto px-6">
                  {items.map((item) => (
                    <CartLine key={item.variantId} item={item} />
                  ))}
                </ul>
                <div className="space-y-4 border-t border-smoke px-6 py-6">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-mist">{t.cart.subtotal}</span>
                    <span className="text-lg font-semibold tabular-nums">{formatMXN(subtotal)}</span>
                  </div>
                  <p className="text-xs text-fog">{t.cart.calcNext}</p>
                  <ButtonLink href="/cart" size="lg" className="w-full">{t.cart.viewAndPay}</ButtonLink>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
