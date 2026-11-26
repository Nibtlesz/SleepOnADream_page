/**
 * Lectura del catálogo de la tienda.
 * Con DATABASE_URL: PostgreSQL (Prisma). Sin ella: datos de ejemplo en memoria.
 * El panel invalida la caché con `updateTag(CATALOG_TAG)` al guardar cambios.
 */
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { officialProducts } from "@/data/official/products";
import { sampleCategories } from "@/data/sample/catalog";
import { getDb, isDbConfigured } from "@/lib/db";
import type { ArtKind, Category, Product } from "@/lib/types";
import { committedQty } from "@/server/orders/memory-state";

export const CATALOG_TAG = "catalog";

const ART_KINDS: ArtKind[] = ["tee", "hoodie", "cap", "vinyl", "cd", "patch", "bundle", "tote"];

const productInclude = {
  category: true,
  images: { orderBy: { position: "asc" } },
  variants: { orderBy: { sku: "asc" } },
  related: { select: { slug: true } },
} as const;

type DbProduct = Awaited<ReturnType<typeof fetchDbProducts>>[number];

function fetchDbProducts(where: object = { status: { in: ["ACTIVE", "COMING_SOON"] } }) {
  return getDb().product.findMany({ where, include: productInclude, orderBy: [{ createdAt: "asc" }] });
}

export function toProduct(p: DbProduct): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    basePrice: p.basePrice,
    compareAt: p.compareAt,
    status: p.status === "COMING_SOON" ? "COMING_SOON" : "ACTIVE",
    category: { slug: p.category.slug, name: p.category.name },
    art: ART_KINDS.includes(p.art as ArtKind) ? (p.art as ArtKind) : "tee",
    images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
    variants: p.variants.map((v) => ({ id: v.id, sku: v.sku, size: v.size, color: v.color, price: v.price, stock: v.stock })),
    relatedSlugs: p.related.map((r) => r.slug),
    isExclusive: p.isExclusive,
    isBundle: p.isBundle,
    isSample: p.isSample,
  };
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  if (!isDbConfigured) return sampleCategories;
  const rows = await getDb().category.findMany({ orderBy: { position: "asc" } });
  return rows.map((c) => ({ slug: c.slug, name: c.name }));
}

export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("minutes"); // el inventario cambia con cada venta
  cacheTag(CATALOG_TAG);
  if (!isDbConfigured) return officialProducts;
  return (await fetchDbProducts()).map(toProduct);
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
 * Con datos de ejemplo descuenta las unidades comprometidas en pedidos en memoria;
 * en PostgreSQL el stock ya se descuenta al crear cada pedido.
 */
export async function findVariantsForQuote(variantIds: string[]) {
  const map = new Map<string, { product: Product; variant: Product["variants"][number] }>();
  if (isDbConfigured) {
    const rows = await fetchDbProducts({ variants: { some: { id: { in: variantIds } } } });
    for (const row of rows) {
      const product = toProduct(row);
      // Un producto en borrador o archivado no se puede comprar aunque siga en un carrito.
      if (row.status !== "ACTIVE") product.status = row.status === "COMING_SOON" ? "COMING_SOON" : "SOLD_OUT";
      for (const variant of product.variants) if (variantIds.includes(variant.id)) map.set(variant.id, { product, variant });
    }
    return map;
  }
  for (const product of officialProducts) {
    for (const variant of product.variants) {
      if (variantIds.includes(variant.id)) {
        const stock = Math.max(variant.stock - committedQty(variant.id), 0);
        map.set(variant.id, { product, variant: { ...variant, stock } });
      }
    }
  }
  return map;
}
