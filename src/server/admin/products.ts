import "server-only";
import { getDb } from "@/lib/db";
import type { ProductFormData } from "@/components/admin/ProductForm";

export async function getProductFormOptions() {
  const db = getDb();
  const [categories, allProducts] = await Promise.all([
    db.category.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
    db.product.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { categories, allProducts };
}

export async function getProductForEdit(id: string): Promise<(ProductFormData & { updatedAt: string; sold: number }) | null> {
  const db = getDb();
  const p = await db.product.findUnique({
    where: { id },
    include: { images: { orderBy: { position: "asc" } }, variants: { orderBy: { sku: "asc" } }, related: { select: { id: true } } },
  });
  if (!p) return null;
  const sold = await db.orderItem.aggregate({ where: { variant: { productId: id }, order: { status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] } } }, _sum: { quantity: true } });
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    categoryId: p.categoryId,
    basePrice: p.basePrice,
    compareAt: p.compareAt,
    status: p.status,
    art: p.art,
    isExclusive: p.isExclusive,
    isBundle: p.isBundle,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
    related: p.related.map((r) => r.id),
    variants: p.variants.map((v) => ({ id: v.id, sku: v.sku, size: v.size, color: v.color, price: v.price, stock: v.stock })),
    updatedAt: p.updatedAt.toISOString(),
    sold: sold._sum.quantity ?? 0,
  };
}
