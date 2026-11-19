import type { Metadata } from "next";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";
import { syncBandsintown } from "@/app/admin/actions/content";
import { btn, EmptyState, Flash, PageTitle, Pill, tableCls } from "@/components/admin/ui";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireAdmin } from "@/server/auth/dal";
import { isBandsintownConfigured } from "@/server/services/bandsintown";

export const metadata: Metadata = { title: "Conciertos" };

/** Página privada que depende de la sesión: la navegación espera al servidor. */
export const instant = false;

/** Mensaje tras sincronizar: ?sync=creados-actualizados-ocultos | error | sin-clave */
function syncMessage(raw: string | string[] | undefined): { ok: boolean; text: string } | null {
  if (typeof raw !== "string") return null;
  if (raw === "error") return { ok: false, text: "No se pudo sincronizar con Bandsintown. Revisa la clave (BANDSINTOWN_APP_ID) e inténtalo de nuevo." };
  if (raw === "sin-clave") return { ok: false, text: "Falta configurar BANDSINTOWN_APP_ID en el servidor." };
  const [created, updated, hidden] = raw.split("-").map(Number);
  if ([created, updated, hidden].some(Number.isNaN)) return null;
  if (!created && !updated && !hidden) return { ok: true, text: "Sincronizado: no hubo cambios en Bandsintown." };
  return { ok: true, text: `Sincronizado con Bandsintown: ${created} nuevo(s), ${updated} actualizado(s), ${hidden} oculto(s).` };
}

const STATUS = { SCHEDULED: "Programado", SOLD_OUT: "Agotado", CANCELLED: "Cancelado", POSTPONED: "Pospuesto" } as const;

export default async function ShowsAdminPage({ searchParams }: PageProps<"/admin/conciertos">) {
  await requireAdmin("content");
  const sp = await searchParams;
  const shows = await getDb().show.findMany({ orderBy: { startsAt: "desc" } });
  const now = new Date();
  const sync = syncMessage(sp.sync);
  const canSync = isBandsintownConfigured();
  return (
    <>
      <PageTitle
        title="Conciertos"
        eyebrow="Contenido"
        action={
          <div className="flex flex-wrap gap-2">
            {canSync && (
              <form action={syncBandsintown}>
                <button type="submit" className={btn.outline}><RefreshCw className="h-4 w-4" /> Sincronizar con Bandsintown</button>
              </form>
            )}
            <Link href="/admin/conciertos/nuevo" className={btn.primary}><Plus className="h-4 w-4" /> Nuevo concierto</Link>
          </div>
        }
      />
      <Flash sp={sp} />
      {sync && (
        <p role="status" className={`mb-6 border px-4 py-3 text-sm ${sync.ok ? "border-emerald-500/40 text-emerald-300" : "border-ember/50 text-ember"}`}>{sync.text}</p>
      )}
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
                  <td className={tableCls.td}>{s.city}, {s.state}{s.isSample && <span className="ml-2 text-[0.6rem] uppercase tracking-[0.14em] text-ember/80">ejemplo</span>}{s.bandsintownId && <span className="ml-2 text-[0.6rem] uppercase tracking-[0.14em] text-fog">Bandsintown</span>}</td>
                  <td className={`${tableCls.td} text-mist`}>{s.venue}</td>
                  <td className={tableCls.td}><Pill tone={s.status === "CANCELLED" ? "muted" : s.status === "SCHEDULED" ? "ok" : "default"}>{STATUS[s.status]}</Pill></td>
                  <td className={tableCls.td}>{s.published ? "Sí" : <span className="text-fog">Borrador</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-fog">
        Las fechas pasadas aparecen solas en el historial del sitio.{" "}
        {canSync
          ? "Los conciertos de Bandsintown se sincronizan solos cada hora; con el botón se traen al momento."
          : "Para traer los conciertos de Bandsintown automáticamente, configura BANDSINTOWN_APP_ID (ver README)."}
      </p>
    </>
  );
}
