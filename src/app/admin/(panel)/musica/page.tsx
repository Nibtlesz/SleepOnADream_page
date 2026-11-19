import type { Metadata } from "next";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";
import { syncMusic } from "@/app/admin/actions/content";
import { btn, EmptyState, Flash, PageTitle, Pill, tableCls } from "@/components/admin/ui";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireAdmin } from "@/server/auth/dal";
import { isSpotifyConfigured } from "@/server/services/music-sync";

export const metadata: Metadata = { title: "Música" };

/** Página privada que depende de la sesión: la navegación espera al servidor. */
export const instant = false;
/** Mensaje tras sincronizar: ?sync=nuevos-actualizados-spotify&spotify=ok|sin-clave|error&destacado=Título */
function syncMessage(sp: Record<string, string | string[] | undefined>): { ok: boolean; text: string } | null {
  const raw = sp.sync;
  if (typeof raw !== "string") return null;
  if (raw === "error") return { ok: false, text: "No se pudo consultar Apple Music. Inténtalo de nuevo en unos minutos." };
  const [created, updated, linked] = raw.split("-").map(Number);
  if ([created, updated, linked].some(Number.isNaN)) return null;
  const parts = [
    created || updated ? `${created} nuevo(s) y ${updated} actualizado(s) desde Apple Music` : "sin cambios en Apple Music",
    linked ? `${linked} enlace(s) de Spotify agregado(s)` : null,
    typeof sp.destacado === "string" ? `"${sp.destacado}" es ahora el nuevo lanzamiento de la portada` : null,
    sp.spotify === "error" ? "Spotify no respondió (revisa SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET)" : null,
  ].filter(Boolean);
  return { ok: sp.spotify !== "error", text: `Sincronizado: ${parts.join("; ")}.` };
}

const TYPE = { ALBUM: "Álbum", EP: "EP", SINGLE: "Sencillo" } as const;

export default async function MusicAdminPage({ searchParams }: PageProps<"/admin/musica">) {
  await requireAdmin("content");
  const sp = await searchParams;
  const releases = await getDb().release.findMany({ orderBy: { releaseDate: "desc" }, include: { _count: { select: { tracks: true } } } });
  const sync = syncMessage(sp);
  return (
    <>
      <PageTitle
        title="Música"
        eyebrow="Contenido"
        action={
          <div className="flex flex-wrap gap-2">
            <form action={syncMusic}>
              <button type="submit" className={btn.outline}><RefreshCw className="h-4 w-4" /> Sincronizar con Apple Music{isSpotifyConfigured() ? " y Spotify" : ""}</button>
            </form>
            <Link href="/admin/musica/nuevo" className={btn.primary}><Plus className="h-4 w-4" /> Nuevo lanzamiento</Link>
          </div>
        }
      />
      <Flash sp={sp} />
      {sync && (
        <p role="status" className={`mb-6 border px-4 py-3 text-sm ${sync.ok ? "border-emerald-500/40 text-emerald-300" : "border-ember/50 text-ember"}`}>{sync.text}</p>
      )}
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
                    {r.appleMusicId && <span className="ml-2 text-[0.6rem] uppercase tracking-[0.14em] text-fog">Apple Music</span>}
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
      <p className="mt-3 text-xs text-fog">
        Los lanzamientos nuevos de la banda llegan solos desde Apple Music cada hora (con el botón, al momento).{" "}
        {isSpotifyConfigured()
          ? "Los enlaces de Spotify se agregan solos cuando el lanzamiento aparece allá."
          : "Para agregar también los enlaces de Spotify, configura SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET (ver README)."}{" "}
        Lo que edites aquí no se sobrescribe.
      </p>
    </>
  );
}
