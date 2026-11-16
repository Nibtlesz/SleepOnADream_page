/** Utilidades de idioma comunes (cliente y servidor). */
import en from "./dictionaries/en";
import es, { type Dictionary } from "./dictionaries/es";
import type { Locale } from "./config";

export type { Dictionary };
export const dictionaries: Record<Locale, Dictionary> = { es, en };

/** Reemplaza {clave} en un texto: fill("Pagar {amount}", { amount: "$499" }). */
export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

/** Traduce una clave de mensaje (validación / servidor); si no existe, devuelve el texto tal cual. */
export function msg(dict: Dictionary, key: string | undefined): string | undefined {
  if (!key) return undefined;
  return dict.messages[key] ?? key;
}

/** Nombre de categoría en el idioma activo (los nombres guardados en la base están en español). */
export function categoryName(dict: Dictionary, slug: string, fallback: string): string {
  return dict.store.categoryNames[slug] ?? fallback;
}

/** Descripción de un descuento aplicado (la cotización trae tipo y valor, no texto). */
export function describeDiscount(dict: Dictionary, d: { type?: string; value?: number; label?: string }): string {
  if (d.type === "PERCENT") return fill(dict.cart.discountPercent, { n: d.value ?? 0 });
  if (d.type === "FREE_SHIPPING") return dict.cart.discountFreeShipping;
  if (d.type === "FIXED") return dict.cart.discountApplied;
  return d.label ?? "";
}
