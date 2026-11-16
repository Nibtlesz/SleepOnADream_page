/** Utilidades de idioma comunes (cliente y servidor). */
import { createElement, Fragment, type ReactNode } from "react";
import type { Dictionary } from "./dictionaries/es";

export type { Dictionary };

/** Reemplaza {clave} en un texto: fill("Pagar {amount}", { amount: "$499" }). */
export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

/** Claves de mensajes de validación y de servidor (definidas en el diccionario). */
export type MessageKey = keyof Dictionary["messages"];

/**
 * Marca una clave de mensaje. TypeScript rechaza claves que no existan en el diccionario,
 * así un error de dedo en un esquema falla al compilar en vez de mostrarse al usuario.
 */
export const k = <K extends MessageKey>(key: K): K => key;

/**
 * Como `fill`, pero los valores pueden ser elementos de React:
 * fillNodes("Te faltan {amount} para…", { amount: <strong>$501</strong> }).
 * Si la traducción no trae el marcador, el valor se agrega al final para no perderlo.
 */
export function fillNodes(text: string, vars: Record<string, ReactNode>): ReactNode[] {
  const used = new Set<string>();
  const parts = text.split(/\{(\w+)\}/).map((part, i) => {
    if (i % 2 === 0) return part;
    used.add(part);
    return createElement(Fragment, { key: `${part}-${i}` }, vars[part] ?? `{${part}}`);
  });
  for (const [key, value] of Object.entries(vars)) {
    if (!used.has(key)) parts.push(" ", createElement(Fragment, { key }, value));
  }
  return parts;
}

/** Traduce una clave de mensaje (validación / servidor). Si no es una clave conocida, la devuelve tal cual. */
export function msg(dict: Dictionary, key: string | undefined): string | undefined {
  if (!key) return undefined;
  const text = (dict.messages as Record<string, string>)[key];
  if (text === undefined && process.env.NODE_ENV !== "production" && /^[a-z]+\.[A-Za-z]+$/.test(key)) {
    console.warn(`[i18n] Falta el mensaje "${key}" en el diccionario.`);
  }
  return text ?? key;
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
