"use client";

/**
 * Borrador del checkout en sessionStorage: sobrevive a recargas pero se borra al
 * cerrar la pestaña y al completar la compra. Nunca contiene datos de pago.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AddressInput, CustomerInput } from "@/lib/validation/checkout";

export const EMPTY_CUSTOMER: CustomerInput = { email: "", name: "", phone: "" };
export const EMPTY_ADDRESS: AddressInput = {
  recipient: "",
  street: "",
  extNumber: "",
  intNumber: "",
  neighborhood: "",
  postalCode: "",
  city: "",
  state: "",
  references: "",
};

interface CheckoutDraft {
  step: number; // 0..4 (el paso 6, confirmación, es su propia página)
  customer: CustomerInput;
  address: AddressInput;
  /** Clave de idempotencia ligada a una "huella" del pedido (carrito + datos). */
  idempotencyKey: string | null;
  keyFingerprint: string | null;
  setStep: (step: number) => void;
  setCustomer: (c: CustomerInput) => void;
  setAddress: (a: AddressInput) => void;
  keyFor: (fingerprint: string) => string;
  /** Olvida la clave actual (p. ej. si el pedido anterior expiró). */
  clearKey: () => void;
  reset: () => void;
}

export const useCheckout = create<CheckoutDraft>()(
  persist(
    (set, get) => ({
      step: 0,
      customer: EMPTY_CUSTOMER,
      address: EMPTY_ADDRESS,
      idempotencyKey: null,
      keyFingerprint: null,
      setStep: (step) => set({ step }),
      setCustomer: (customer) => set({ customer }),
      setAddress: (address) => set({ address }),
      // Misma huella → misma clave (reintentos seguros). Si el pedido cambió → clave nueva.
      keyFor: (fingerprint) => {
        const { idempotencyKey, keyFingerprint } = get();
        if (idempotencyKey && keyFingerprint === fingerprint) return idempotencyKey;
        const key = crypto.randomUUID();
        set({ idempotencyKey: key, keyFingerprint: fingerprint });
        return key;
      },
      clearKey: () => set({ idempotencyKey: null, keyFingerprint: null }),
      reset: () => set({ step: 0, customer: EMPTY_CUSTOMER, address: EMPTY_ADDRESS, idempotencyKey: null, keyFingerprint: null }),
    }),
    { name: "soad-checkout-v1", storage: createJSONStorage(() => sessionStorage) },
  ),
);
