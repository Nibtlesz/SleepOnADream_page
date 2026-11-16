import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { btn, EmptyState, Flash, PageTitle, Pill, tableCls } from "@/components/admin/ui";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireAdmin } from "@/server/auth/dal";

export const metadata: Metadata = { title: "Música" };

/** Página privada que depende de la sesión: la navegación espera al servidor. */
export const instant = false;
const TYPE = { ALBUM: "Álbum", EP: "EP", SINGLE: "Sencillo" } as const;

export default async function MusicAdminPage({ searchParams }: PageProps<"/admin/musica">) {
  await requireAdmin("content");
  const sp = await searchParams;
  const releases = await getDb().release.findMany({ orderBy: { releaseDate: "desc" }, include: { _count: { select: { tracks: true } } } });
  return (
    <>
      <PageTitle title="Música" eyebrow="Contenido" action={<Link href="/admin/musica/nuevo" className={btn.primary}><Plus className="h-4 w-4" /> Nuevo lanzamiento</Link>} />
      <Flash sp={sp} />
      {releases.length === 0 ? <EmptyState>No hay lanzamientos.</EmptyState> : (
        <div className={tableCls.wrap}>
          <table className={tableCls.table}>
            <thead><tr><th className={tableCls.th}>Título</th><th className={tableCls.th}>Tipo</th><th className={tableCls.th}>Fecha</th><th className={tableCls.th}>Pistas</th><th className={tableCls.th}>Visible</th></tr></thead>
            <tbody>
              {releases.map((r) => (
                <tr key={r.id} className={tableCls.row}>
                  <td className={tableCls.td}>
                    <Link href={`/admin/musica/${r.id}`} className="font-semibold hover:text-ember">{r.title}</Link>
                    {r.isFeatured && <span className="ml-2"><Pill tone="warn">Destacado</Pill></span>}
                    {r.isSample && <span className="ml-2 text-[0.6rem] uppercase tracking-[0.14em] text-ember/80">ejemplo</span>}
                  </td>
                  <td className={`${tableCls.td} text-mist`}>{TYPE[r.type]}</td>
                  <td className={`${tableCls.td} text-mist`}>{formatDate(r.releaseDate.toISOString())}</td>
                  <td className={`${tableCls.td} tabular-nums`}>{r._count.tracks}</td>
                  <td className={tableCls.td}>{r.published ? "Sí" : <span className="text-fog">Borrador</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
