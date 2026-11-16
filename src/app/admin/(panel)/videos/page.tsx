import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { btn, EmptyState, Flash, PageTitle, Pill, tableCls } from "@/components/admin/ui";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireAdmin } from "@/server/auth/dal";

export const metadata: Metadata = { title: "Videos" };

/** Página privada que depende de la sesión: la navegación espera al servidor. */
export const instant = false;

export default async function VideosAdminPage({ searchParams }: PageProps<"/admin/videos">) {
  await requireAdmin("content");
  const sp = await searchParams;
  const videos = await getDb().video.findMany({ orderBy: { publishedAt: "desc" } });
  return (
    <>
      <PageTitle title="Videos" eyebrow="Contenido" action={<Link href="/admin/videos/nuevo" className={btn.primary}><Plus className="h-4 w-4" /> Nuevo video</Link>} />
      <Flash sp={sp} />
      {videos.length === 0 ? <EmptyState>No hay videos.</EmptyState> : (
        <div className={tableCls.wrap}>
          <table className={tableCls.table}>
            <thead><tr><th className={tableCls.th}>Título</th><th className={tableCls.th}>Publicación</th><th className={tableCls.th}>YouTube</th><th className={tableCls.th}>Visible</th></tr></thead>
            <tbody>
              {videos.map((v) => (
                <tr key={v.id} className={tableCls.row}>
                  <td className={tableCls.td}>
                    <Link href={`/admin/videos/${v.id}`} className="font-semibold hover:text-ember">{v.title}</Link>
                    {v.isFeatured && <span className="ml-2"><Pill tone="warn">Destacado</Pill></span>}
                    {v.isSample && <span className="ml-2 text-[0.6rem] uppercase tracking-[0.14em] text-ember/80">ejemplo</span>}
                  </td>
                  <td className={`${tableCls.td} text-mist`}>{formatDate(v.publishedAt.toISOString())}</td>
                  <td className={`${tableCls.td} font-mono text-xs`}>{v.youtubeId ?? <span className="text-ember">pendiente</span>}</td>
                  <td className={tableCls.td}>{v.published ? "Sí" : <span className="text-fog">Borrador</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
