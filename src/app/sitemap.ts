import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getProducts } from "@/server/queries/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  const pages = ["", "/music", "/videos", "/tour", "/store", "/about", "/contact"];
  return [
    ...pages.map((p) => ({ url: `${siteConfig.url}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.8 })),
    ...products.map((p) => ({ url: `${siteConfig.url}/store/${p.slug}`, changeFrequency: "daily" as const, priority: 0.6 })),
  ];
}
