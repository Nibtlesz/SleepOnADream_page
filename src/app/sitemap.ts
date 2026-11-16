import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { localizePath } from "@/i18n/config";
import { getProducts } from "@/server/queries/catalog";

/** Cada página aparece una vez, con su versión en inglés como alternativa (hreflang). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  const entry = (path: string, changeFrequency: "weekly" | "daily", priority: number) => ({
    url: `${siteConfig.url}${localizePath("es", path)}`,
    changeFrequency,
    priority,
    alternates: {
      languages: {
        "es-MX": `${siteConfig.url}${localizePath("es", path)}`,
        en: `${siteConfig.url}${localizePath("en", path)}`,
      },
    },
  });
  const pages = ["/", "/music", "/videos", "/tour", "/store", "/about", "/contact"];
  return [
    ...pages.map((p) => entry(p, "weekly", p === "/" ? 1 : 0.8)),
    ...products.map((p) => entry(`/store/${p.slug}`, "daily", 0.6)),
  ];
}
