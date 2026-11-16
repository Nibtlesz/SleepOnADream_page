import type { Metadata } from "next";
import { EmptyState, PageTitle, tableCls } from "@/components/admin/ui";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireAdmin } from "@/server/auth/dal";

export const metadata: Metadata = { title: "Bitácora" };

/** Página privada que depende de la sesión: la navegación espera al servidor. */
export const instant = false;

export default async function AuditPage() {
  await requireAdmin("audit");
  const logs = await getDb().adminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { user: { select: { email: true } } } });
  return (
    <>
      <PageTitle title="Bitácora" eyebrow="Seguridad" />
      {logs.length === 0 ? <EmptyState>Sin registros.</EmptyState> : (
        <div className={tableCls.wrap}>
          <table className={tableCls.table}>
            <thead><tr><th className={tableCls.th}>Fecha</th><th className={tableCls.th}>Usuario</th><th className={tableCls.th}>Acción</th><th className={tableCls.th}>Detalle</th><th className={tableCls.th}>IP</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className={tableCls.row}>
                  <td className={`${tableCls.td} whitespace-nowrap text-xs text-fog`}>{formatDate(l.createdAt.toISOString(), { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</td>
                  <td className={tableCls.td}>{l.user.email}</td>
                  <td className={`${tableCls.td} font-mono text-xs`}>{l.action}</td>
                  <td className={`${tableCls.td} max-w-xs truncate text-xs text-mist`} title={JSON.stringify(l.metadata)}>{l.metadata ? JSON.stringify(l.metadata) : `${l.entityType} ${l.entityId}`}</td>
                  <td className={`${tableCls.td} font-mono text-xs text-fog`}>{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-fog">Últimos 200 registros. La bitácora no se puede editar desde el panel.</p>
    </>
  );
}
