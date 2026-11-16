import type { Metadata, Viewport } from "next";
import { lang as rootLang } from "next/root-params";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { HTML_LANG, isLocale, LOCALES, localizePath, OG_LOCALE } from "@/i18n/config";
import { I18nProvider } from "@/i18n/client";
import { dictionaries } from "@/i18n";
import { fontClasses } from "../fonts";
import "../globals.css";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = await rootLang();
  if (!lang || !isLocale(lang)) return {};
  const t = dictionaries[lang];
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: t.meta.title, template: `%s · ${siteConfig.name}` },
    description: t.meta.description,
    applicationName: siteConfig.name,
    alternates: {
      canonical: localizePath(lang, "/"),
      languages: { "es-MX": "/", en: "/en", "x-default": "/" },
    },
    openGraph: {
      type: "website",
      locale: OG_LOCALE[lang],
      siteName: siteConfig.name,
      title: siteConfig.name,
      description: t.meta.description,
    },
    twitter: { card: "summary_large_image" },
    // Mientras se usan datos de ejemplo, no indexar. Cambiar a true al publicar.
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#070708",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const lang = await rootLang();
  if (!lang || !isLocale(lang)) notFound();
  return (
    <html lang={HTML_LANG[lang]} data-scroll-behavior="smooth" className={fontClasses}>
      <body className="min-h-dvh">
        <I18nProvider lang={lang}>{children}</I18nProvider>
      </body>
    </html>
  );
}
