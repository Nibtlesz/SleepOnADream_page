/**
 * Idioma en componentes de servidor. Usa `next/root-params`: cualquier componente o
 * utilidad bajo app/[lang] obtiene el idioma sin recibirlo por props.
 */
import { lang as rootLang } from "next/root-params";
import { notFound } from "next/navigation";
import { isLocale, localizePath, type Locale } from "./config";
import { dictionaries } from "./index";

export async function getLocale(): Promise<Locale> {
  const l = await rootLang();
  if (!l || !isLocale(l)) notFound();
  return l;
}

export async function getI18n() {
  const lang = await getLocale();
  return { lang, t: dictionaries[lang], href: (path: string) => localizePath(lang, path) };
}
