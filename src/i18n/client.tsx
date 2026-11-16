"use client";

import { createContext, use, type ReactNode } from "react";
import { DEFAULT_LOCALE, localizePath, type Locale } from "./config";
import type { Dictionary } from "./index";

const I18nContext = createContext<{ lang: Locale; dict: Dictionary | null }>({ lang: DEFAULT_LOCALE, dict: null });

/**
 * Expone idioma y diccionario a los componentes de cliente. El layout pasa solo el
 * diccionario del idioma activo, así el bundle del navegador no incluye ambos idiomas.
 */
export function I18nProvider({ lang, dict, children }: { lang: Locale; dict: Dictionary; children: ReactNode }) {
  return <I18nContext value={{ lang, dict }}>{children}</I18nContext>;
}

export function useI18n(): { lang: Locale; t: Dictionary; href: (path: string) => string } {
  const { lang, dict } = use(I18nContext);
  if (!dict) throw new Error("useI18n() requiere <I18nProvider> (solo existe en el sitio público).");
  return { lang, t: dict, href: (path) => localizePath(lang, path) };
}
