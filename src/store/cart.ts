"use client";

/**
 * Carrito persistente (localStorage). Guarda solo lo necesario para mostrarlo;
 * precios e inventario definitivos se recalculan en el servidor (/api/cart/quote).
 */
import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storeConfig } from "@/config/store";
import type { ArtKind } from "@/lib/types";

export interface CartItem {
  variantId: string;
  productSlug: string;
  name: string;
  variantLabel: string;
  unitPrice: number;
  art: ArtKind;
  quantity: number;
  maxStock: number;
}

interface CartState {
  items: CartItem[];
  code: string | null;
  /** Estado de envío y tarifa elegidos (compartidos entre carrito y checkout). */
  shipState: string | null;
  rateId: string | null;
  isOpen: boolean;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  setCode: (code: string | null) => void;
  setShipping: (shipState: string | null, rateId: string | null) => void;
  open: () => void;
  close: () => void;
}

const clampQty = (qty: number, max: number) =>
  Math.max(1, Math.min(qty, max, storeConfig.maxQtyPerItem));

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      code: null,
      shipState: null,
      rateId: null,
      isOpen: false,
      add: (item, quantity = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.variantId === item.variantId);
          const items = existing
            ? s.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, ...item, quantity: clampQty(i.quantity + quantity, item.maxStock) }
                  : i,
              )
            : [...s.items, { ...item, quantity: clampQty(quantity, item.maxStock) }];
          return { items, isOpen: true };
        }),
      setQuantity: (variantId, quantity) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity: clampQty(quantity, i.maxStock) } : i,
          ),
        })),
      remove: (variantId) => set((s) => ({ items: s.items.filter((i) => i.variantId !== variantId) })),
      clear: () => set({ items: [], code: null }),
      setCode: (code) => set({ code }),
      setShipping: (shipState, rateId) => set({ shipState, rateId }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: "soad-cart-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, code: s.code, shipState: s.shipState, rateId: s.rateId }),
    },
  ),
);

export const selectCount = (s: CartState) => s.items.reduce((a, i) => a + i.quantity, 0);
export const selectSubtotal = (s: CartState) => s.items.reduce((a, i) => a + i.unitPrice * i.quantity, 0);

const noop = () => () => {};
/** `true` solo en el cliente después de hidratar: evita desajustes SSR con localStorage. */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}
