"use client";

import { createContext, use, type ReactNode } from "react";
import { DEFAULT_LOCALE, localizePath, type Locale } from "./config";
import { dictionaries, type Dictionary } from "./index";

const I18nContext = createContext<Locale>(DEFAULT_LOCALE);

/** Expone el idioma a los componentes de cliente (el diccionario se toma del bundle). */
export function I18nProvider({ lang, children }: { lang: Locale; children: ReactNode }) {
  return <I18nContext value={lang}>{children}</I18nContext>;
}

export function useI18n(): { lang: Locale; t: Dictionary; href: (path: string) => string } {
  const lang = use(I18nContext);
  return { lang, t: dictionaries[lang], href: (path) => localizePath(lang, path) };
}
