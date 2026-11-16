import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { btn, EmptyState, Flash, PageTitle, Pill, tableCls } from "@/components/admin/ui";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireAdmin } from "@/server/auth/dal";

export const metadata: Metadata = { title: "Conciertos" };

/** Página privada que depende de la sesión: la navegación espera al servidor. */
export const instant = false;

const STATUS = { SCHEDULED: "Programado", SOLD_OUT: "Agotado", CANCELLED: "Cancelado", POSTPONED: "Pospuesto" } as const;

export default async function ShowsAdminPage({ searchParams }: PageProps<"/admin/conciertos">) {
  await requireAdmin("content");
  const sp = await searchParams;
  const shows = await getDb().show.findMany({ orderBy: { startsAt: "desc" } });
  const now = new Date();
  return (
    <>
      <PageTitle title="Conciertos" eyebrow="Contenido" action={<Link href="/admin/conciertos/nuevo" className={btn.primary}><Plus className="h-4 w-4" /> Nuevo concierto</Link>} />
      <Flash sp={sp} />
      {shows.length === 0 ? <EmptyState>No hay conciertos.</EmptyState> : (
        <div className={tableCls.wrap}>
          <table className={tableCls.table}>
            <thead><tr><th className={tableCls.th}>Fecha</th><th className={tableCls.th}>Ciudad</th><th className={tableCls.th}>Recinto</th><th className={tableCls.th}>Estado</th><th className={tableCls.th}>Visible</th></tr></thead>
            <tbody>
              {shows.map((s) => (
                <tr key={s.id} className={tableCls.row}>
                  <td className={tableCls.td}>
                    <Link href={`/admin/conciertos/${s.id}`} className="hover:text-ember">{formatDate(s.startsAt.toISOString(), { hour: "2-digit", minute: "2-digit" })}</Link>
                    {s.startsAt < now && <span className="ml-2 text-xs text-fog">(historial)</span>}
                  </td>
                  <td className={tableCls.td}>{s.city}, {s.state}{s.isSample && <span className="ml-2 text-[0.6rem] uppercase tracking-[0.14em] text-ember/80">ejemplo</span>}</td>
                  <td className={`${tableCls.td} text-mist`}>{s.venue}</td>
                  <td className={tableCls.td}><Pill tone={s.status === "CANCELLED" ? "muted" : s.status === "SCHEDULED" ? "ok" : "default"}>{STATUS[s.status]}</Pill></td>
                  <td className={tableCls.td}>{s.published ? "Sí" : <span className="text-fog">Borrador</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-fog">Las fechas pasadas aparecen solas en el historial del sitio.</p>
    </>
  );
}
