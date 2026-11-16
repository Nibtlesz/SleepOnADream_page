"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/components/admin/forms";
import { getDb } from "@/lib/db";
import { firstErrors } from "@/lib/validation/checkout";
import { audit } from "@/server/audit";
import { assertAdmin } from "@/server/auth/dal";
import { CATALOG_TAG } from "@/server/queries/catalog";

const pesosToCents = (v: string) => Math.round(Number(v.replace(/[^\d.]/g, "")) * 100);
const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

const variantSchema = z.object({
  id: z.string().max(64).optional(), // vacío = variante nueva
  sku: z.string().trim().min(1, "SKU requerido").max(60),
  size: z.string().trim().max(20).nullable(),
  color: z.string().trim().max(40).nullable(),
  price: z.number().int().min(0).nullable(),
  stock: z.number().int().min(0, "El inventario no puede ser negativo").max(100_000),
  /** Inventario que se mostró al abrir el formulario: se aplica la DIFERENCIA. */
  originalStock: z.number().int().min(0).optional(),
});

const productSchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().trim().min(2, "Escribe el nombre").max(120),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().min(10, "Describe el producto (mín. 10 caracteres)").max(5000),
  categoryId: z.string().min(1, "Elige una categoría"),
  basePrice: z.string().refine((v) => pesosToCents(v) > 0, "Precio inválido"),
  compareAt: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "COMING_SOON", "ARCHIVED"]),
  art: z.string().max(20).optional(),
  isExclusive: z.literal("on").optional(),
  isBundle: z.literal("on").optional(),
  images: z.string().max(5000).optional(),
  related: z.array(z.string()).max(12),
  variants: z.array(variantSchema).min(1, "Agrega al menos una variante").max(80),
});

function parseImages(raw: string | undefined) {
  return (raw ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, position) => {
      const [url, alt] = line.split("|").map((s) => s.trim());
      return { url, alt: alt || "", position };
    })
    .filter((i) => /^https:\/\//.test(i.url) || i.url.startsWith("/"));
}

export async function saveProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await assertAdmin("products");

  let variants: unknown = [];
  try {
    variants = JSON.parse(String(formData.get("variants") ?? "[]"));
  } catch {
    return { message: "Variantes inválidas." };
  }
  const parsed = productSchema.safeParse({
    ...Object.fromEntries(formData),
    related: formData.getAll("related").map(String),
    variants,
  });
  if (!parsed.success) return { message: "Revisa los campos marcados.", errors: firstErrors(parsed.error) };
  const d = parsed.data;

  const skus = d.variants.map((v) => v.sku.toUpperCase());
  if (new Set(skus).size !== skus.length) return { message: "Hay SKUs repetidos.", errors: { variants: "SKUs repetidos" } };

  const db = getDb();
  const slug = slugify(d.slug || d.name);
  const clash = await db.product.findFirst({ where: { slug, NOT: d.id ? { id: d.id } : undefined }, select: { id: true } });
  if (clash) return { message: "Ya existe un producto con esa URL.", errors: { slug: "En uso" } };

  const data = {
    name: d.name,
    slug,
    description: d.description,
    categoryId: d.categoryId,
    basePrice: pesosToCents(d.basePrice),
    compareAt: d.compareAt ? pesosToCents(d.compareAt) || null : null,
    status: d.status,
    art: d.art || null,
    isExclusive: d.isExclusive === "on",
    isBundle: d.isBundle === "on",
  };
  const images = parseImages(d.images);

  let productId: string;
  try {
    productId = await db.$transaction(async (tx) => {
      const product = d.id
        ? await tx.product.update({ where: { id: d.id }, data })
        : await tx.product.create({ data });

      await tx.productImage.deleteMany({ where: { productId: product.id } });
      if (images.length) await tx.productImage.createMany({ data: images.map((i) => ({ ...i, productId: product.id })) });

      await tx.product.update({
        where: { id: product.id },
        data: { related: { set: d.related.filter((r) => r !== product.id).map((id) => ({ id })) } },
      });

      // Variantes: las que ya no vienen se eliminan (si nunca se vendieron).
      const existing = await tx.productVariant.findMany({ where: { productId: product.id }, select: { id: true } });
      const keep = new Set(d.variants.map((v) => v.id).filter(Boolean));
      for (const v of existing) {
        if (!keep.has(v.id)) {
          const sold = await tx.orderItem.count({ where: { variantId: v.id } });
          if (sold) throw new Error("No puedes eliminar una variante que ya tiene ventas. Deja su inventario en 0.");
          await tx.productVariant.delete({ where: { id: v.id } });
        }
      }
      for (const v of d.variants) {
        const base = { sku: v.sku.toUpperCase(), size: v.size || null, color: v.color || null, price: v.price };
        if (v.id && existing.some((e) => e.id === v.id)) {
          // Ajuste por diferencia: si se vendieron piezas mientras se editaba, no se pierden.
          const delta = v.stock - (v.originalStock ?? v.stock);
          await tx.productVariant.update({ where: { id: v.id }, data: { ...base, ...(delta ? { stock: { increment: delta } } : {}) } });
          const after = await tx.productVariant.findUnique({ where: { id: v.id }, select: { stock: true } });
          if (after && after.stock < 0) throw new Error(`El ajuste dejaría el SKU ${base.sku} en negativo (se vendieron piezas mientras editabas). Recarga e intenta de nuevo.`);
        } else {
          await tx.productVariant.create({ data: { ...base, stock: v.stock, productId: product.id } });
        }
      }
      return product.id;
    });
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") return { message: "Un SKU ya existe en otro producto.", errors: { variants: "SKU duplicado" } };
    return { message: e instanceof Error ? e.message : "No se pudo guardar." };
  }

  await audit(user, d.id ? "product.update" : "product.create", "Product", productId, { name: d.name, status: d.status });
  updateTag(CATALOG_TAG);
  // Redirigir recarga el formulario con el inventario actualizado desde la base.
  redirect(`/admin/productos/${productId}?${d.id ? "guardado" : "creado"}=1`);
}

/** Productos con ventas no se borran: se archivan para conservar el historial. */
export async function deleteProduct(formData: FormData) {
  const user = await assertAdmin("products");
  const id = String(formData.get("id"));
  const db = getDb();
  const product = await db.product.findUnique({ where: { id }, select: { name: true } });
  if (!product) redirect("/admin/productos");
  const sold = await db.orderItem.count({ where: { variant: { productId: id } } });
  if (sold) {
    await db.product.update({ where: { id }, data: { status: "ARCHIVED" } });
    await audit(user, "product.archive", "Product", id, { name: product.name, reason: "tiene ventas" });
  } else {
    await db.product.delete({ where: { id } });
    await audit(user, "product.delete", "Product", id, { name: product.name });
  }
  updateTag(CATALOG_TAG);
  redirect("/admin/productos");
}
