/**
 * Lectura del catálogo de la tienda.
 * Fase 1–3: DATOS DE EJEMPLO. Fase 4: Prisma (Product, ProductVariant, Category).
 */
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { sampleCategories, sampleProducts } from "@/data/sample/catalog";
import { committedQty } from "@/server/orders/memory-state";
import type { Product } from "@/lib/types";

export const CATALOG_TAG = "catalog";

export async function getCategories() {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  return sampleCategories;
}

export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("minutes"); // el inventario cambia con cada venta
  cacheTag(CATALOG_TAG);
  return sampleProducts;
}

export async function getProductBySlug(slug: string) {
  const products = await getProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getRelatedProducts(product: Product, limit = 4) {
  const products = await getProducts();
  const explicit = product.relatedSlugs
    .map((s) => products.find((p) => p.slug === s))
    .filter((p): p is Product => Boolean(p));
  const sameCategory = products.filter(
    (p) => p.category.slug === product.category.slug && p.slug !== product.slug && !explicit.includes(p),
  );
  return [...explicit, ...sameCategory].slice(0, limit);
}

export async function getFeaturedProducts(limit = 4) {
  const products = await getProducts();
  return products.filter((p) => p.status === "ACTIVE").slice(0, limit);
}

/** Inventario total disponible del producto (suma de variantes). */
export function totalStock(product: Product) {
  return product.variants.reduce((acc, v) => acc + v.stock, 0);
}

/**
 * Búsqueda de variantes SIN caché, para cotizar el carrito con inventario al día.
 * Con datos de ejemplo descuenta las unidades ya comprometidas en pedidos en memoria.
 * En Fase 4: `db.productVariant.findMany({ where: { id: { in: ids } }, include: { product: true } })`.
 */
export async function findVariantsForQuote(variantIds: string[]) {
  const map = new Map<string, { product: Product; variant: Product["variants"][number] }>();
  for (const product of sampleProducts) {
    for (const variant of product.variants) {
      if (variantIds.includes(variant.id)) {
        const stock = Math.max(variant.stock - committedQty(variant.id), 0);
        map.set(variant.id, { product, variant: { ...variant, stock } });
      }
    }
  }
  return map;
}
