"use client";

import { useEffect, useMemo, useState } from "react";
import type { CartQuote } from "@/server/services/cart-quote";
import { useCart, useHydrated } from "@/store/cart";

/**
 * Cotiza el carrito en el servidor cada vez que cambian productos, código,
 * estado o tarifa (con debounce). Sincroniza cantidades si el inventario bajó.
 */
export function useCartQuote() {
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const code = useCart((s) => s.code);
  const shipState = useCart((s) => s.shipState);
  const rateId = useCart((s) => s.rateId);
  const setQuantity = useCart((s) => s.setQuantity);

  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [nonce, setNonce] = useState(0);

  const payload = useMemo(
    () =>
      JSON.stringify({
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        code,
        state: shipState,
        rateId,
      }),
    [items, code, shipState, rateId],
  );

  useEffect(() => {
    if (!hydrated || items.length === 0) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/cart/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const q: CartQuote = await res.json();
        setQuote(q);
        setFailed(false);
        q.lines.forEach((l) => {
          if (l.issue === "insufficient_stock" && l.quantity > 0) setQuantity(l.variantId, l.quantity);
        });
      } catch (e) {
        if ((e as Error).name !== "AbortError") setFailed(true);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [payload, hydrated, items.length, setQuantity, nonce]);

  return { quote, loading, failed, refresh: () => setNonce((n) => n + 1) };
}
