import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/ProductForm";
import { AdminLink, PageTitle } from "@/components/admin/ui";
import { getProductFormOptions } from "@/server/admin/products";
import { requireAdmin } from "@/server/auth/dal";

export const metadata: Metadata = { title: "Nuevo producto" };

/** Página privada que depende de la sesión: la navegación espera al servidor. */
export const instant = false;

export default async function NewProductPage() {
  await requireAdmin("products");
  const { categories, allProducts } = await getProductFormOptions();
  return (
    <>
      <AdminLink href="/admin/productos" className="text-xs">← Productos</AdminLink>
      <div className="mt-4"><PageTitle title="Nuevo producto" /></div>
      <ProductForm
        categories={categories}
        allProducts={allProducts}
        product={{ name: "", slug: "", description: "", categoryId: "", basePrice: 0, compareAt: null, status: "DRAFT", art: "tee", isExclusive: false, isBundle: false, images: [], related: [], variants: [{ sku: "", size: null, color: null, price: null, stock: 0 }] }}
      />
    </>
  );
}
