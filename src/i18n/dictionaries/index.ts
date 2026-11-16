/**
 * Mapa de diccionarios. SOLO para el servidor (layouts, páginas, correos): los componentes
 * de cliente reciben únicamente el diccionario del idioma activo a través de I18nProvider,
 * así cada página descarga los textos de un solo idioma.
 */
import type { Locale } from "../config";
import en from "./en";
import es, { type Dictionary } from "./es";

export type { Dictionary };
export const dictionaries: Record<Locale, Dictionary> = { es, en };

export function getDictionary(lang: Locale): Dictionary {
  return dictionaries[lang] ?? es;
}
