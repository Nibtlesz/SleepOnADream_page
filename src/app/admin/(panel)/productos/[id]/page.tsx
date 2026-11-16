import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { deleteProduct } from "@/app/admin/actions/products";
import { ConfirmButton } from "@/components/admin/forms";
import { ProductForm } from "@/components/admin/ProductForm";
import { AdminLink, btn, PageTitle } from "@/components/admin/ui";
import { getProductForEdit, getProductFormOptions } from "@/server/admin/products";
import { requireAdmin } from "@/server/auth/dal";

export const metadata: Metadata = { title: "Editar producto" };

/** Página privada que depende de la sesión: la navegación espera al servidor. */
export const instant = false;

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/productos/[id]">) {
  await requireAdmin("products");
  const { id } = await params;
  const sp = await searchParams;
  const [product, { categories, allProducts }] = await Promise.all([getProductForEdit(id), getProductFormOptions()]);
  if (!product) notFound();

  return (
    <>
      <AdminLink href="/admin/productos" className="text-xs">← Productos</AdminLink>
      <div className="mt-4">
        <PageTitle
          title={product.name}
          eyebrow={`${product.sold} piezas vendidas`}
          action={
            <Link href={`/store/${product.slug}`} target="_blank" className={btn.outline}>
              Ver en tienda <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          }
        />
      </div>
      {(sp.guardado || sp.creado) && (
        <p role="status" className="mb-6 border border-emerald-500/40 px-4 py-3 text-sm text-emerald-300">
          {sp.creado ? "Producto creado." : "Cambios guardados."} La tienda ya muestra la versión actualizada.
        </p>
      )}
      <ProductForm key={product.updatedAt} product={product} categories={categories} allProducts={allProducts} />

      <form action={deleteProduct} className="mt-12 border-t border-smoke pt-6">
        <input type="hidden" name="id" value={product.id} />
        <p className="mb-3 text-sm text-fog">
          {product.sold > 0 ? "Este producto tiene ventas: se archivará (deja de mostrarse) en lugar de borrarse." : "Eliminar borra el producto y sus variantes de forma permanente."}
        </p>
        <ConfirmButton
          className={btn.danger}
          message={product.sold > 0 ? `¿Archivar "${product.name}"? Dejará de mostrarse en la tienda.` : `¿Eliminar "${product.name}" de forma permanente? No se puede deshacer.`}
        >
          {product.sold > 0 ? "Archivar producto" : "Eliminar producto"}
        </ConfirmButton>
      </form>
    </>
  );
}
