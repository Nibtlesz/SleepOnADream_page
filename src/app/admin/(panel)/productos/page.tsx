import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { btn, EmptyState, PageTitle, Pill, tableCls } from "@/components/admin/ui";
import { getDb } from "@/lib/db";
import { formatMXN } from "@/lib/format";
import { requireAdmin } from "@/server/auth/dal";
import { LOW_STOCK } from "@/server/admin/stats";

export const metadata: Metadata = { title: "Productos" };

/** Página privada que depende de la sesión: la navegación espera al servidor. */
export const instant = false;

const STATUS: Record<string, { label: string; tone: "ok" | "default" | "muted" | "warn" }> = {
  ACTIVE: { label: "Activo", tone: "ok" },
  COMING_SOON: { label: "Próximamente", tone: "default" },
  DRAFT: { label: "Borrador", tone: "muted" },
  ARCHIVED: { label: "Archivado", tone: "muted" },
};

export default async function ProductsPage() {
  await requireAdmin("products");
  const products = await getDb().product.findMany({
    include: { category: true, variants: { select: { stock: true } } },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  return (
    <>
      <PageTitle title="Productos" eyebrow="Tienda" action={<Link href="/admin/productos/nuevo" className={btn.primary}><Plus className="h-4 w-4" /> Nuevo producto</Link>} />
      {products.length === 0 ? (
        <EmptyState>Aún no hay productos.</EmptyState>
      ) : (
        <div className={tableCls.wrap}>
          <table className={tableCls.table}>
            <thead>
              <tr>
                <th className={tableCls.th}>Producto</th>
                <th className={tableCls.th}>Categoría</th>
                <th className={tableCls.th}>Estado</th>
                <th className={`${tableCls.th} text-right`}>Precio</th>
                <th className={`${tableCls.th} text-right`}>Inventario</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const stock = p.variants.reduce((a, v) => a + v.stock, 0);
                const low = p.variants.filter((v) => v.stock <= LOW_STOCK).length;
                return (
                  <tr key={p.id} className={tableCls.row}>
                    <td className={tableCls.td}>
                      <Link href={`/admin/productos/${p.id}`} className="font-semibold hover:text-ember">{p.name}</Link>
                      {p.isSample && <span className="ml-2 text-[0.6rem] uppercase tracking-[0.14em] text-ember/80">ejemplo</span>}
                    </td>
                    <td className={`${tableCls.td} text-mist`}>{p.category.name}</td>
                    <td className={tableCls.td}><Pill tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Pill></td>
                    <td className={`${tableCls.td} text-right tabular-nums`}>{formatMXN(p.basePrice)}</td>
                    <td className={`${tableCls.td} text-right tabular-nums`}>
                      {stock} <span className="text-fog">pzs</span>
                      {low > 0 && <span className="ml-2 text-xs text-ember">({low} bajas)</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
