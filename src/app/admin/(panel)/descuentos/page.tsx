import type { Metadata } from "next";
import { toggleDiscount } from "@/app/admin/actions/discounts";
import { DiscountForm } from "@/components/admin/DiscountForm";
import { btn, Card, EmptyState, PageTitle, Pill, tableCls } from "@/components/admin/ui";
import { getDb } from "@/lib/db";
import { formatDate, formatMXN } from "@/lib/format";
import { requireAdmin } from "@/server/auth/dal";

export const metadata: Metadata = { title: "Descuentos" };

/** Página privada que depende de la sesión: la navegación espera al servidor. */
export const instant = false;

export default async function DiscountsPage() {
  await requireAdmin("products");
  const codes = await getDb().discountCode.findMany({ orderBy: { code: "asc" } });
  const now = new Date();
  const describe = (c: (typeof codes)[number]) =>
    c.type === "PERCENT" ? `${c.value}%` : c.type === "FIXED" ? formatMXN(c.value) : "Envío gratis";

  return (
    <>
      <PageTitle title="Descuentos" eyebrow="Tienda" />
      <Card title="Nuevo código" className="mb-8"><DiscountForm /></Card>
      {codes.length === 0 ? <EmptyState>No hay códigos.</EmptyState> : (
        <div className={tableCls.wrap}>
          <table className={tableCls.table}>
            <thead><tr><th className={tableCls.th}>Código</th><th className={tableCls.th}>Beneficio</th><th className={tableCls.th}>Condiciones</th><th className={tableCls.th}>Usos</th><th className={tableCls.th}>Estado</th><th className={tableCls.th} /></tr></thead>
            <tbody>
              {codes.map((c) => {
                const expired = c.endsAt && c.endsAt < now;
                const exhausted = c.maxRedemptions != null && c.redemptions >= c.maxRedemptions;
                return (
                  <tr key={c.id} className={tableCls.row}>
                    <td className={`${tableCls.td} font-mono`}>{c.code}</td>
                    <td className={tableCls.td}>{describe(c)}</td>
                    <td className={`${tableCls.td} text-xs text-mist`}>
                      {c.minSubtotal ? `Mínimo ${formatMXN(c.minSubtotal)}` : "Sin mínimo"}
                      {c.endsAt && ` · vence ${formatDate(c.endsAt.toISOString())}`}
                    </td>
                    <td className={`${tableCls.td} tabular-nums`}>{c.redemptions}{c.maxRedemptions ? ` / ${c.maxRedemptions}` : ""}</td>
                    <td className={tableCls.td}>
                      <Pill tone={!c.active || expired || exhausted ? "muted" : "ok"}>{!c.active ? "Inactivo" : expired ? "Vencido" : exhausted ? "Agotado" : "Activo"}</Pill>
                    </td>
                    <td className={`${tableCls.td} text-right`}>
                      <form action={toggleDiscount}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className={`${btn.outline} h-8 px-3`}>{c.active ? "Desactivar" : "Activar"}</button>
                      </form>
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
