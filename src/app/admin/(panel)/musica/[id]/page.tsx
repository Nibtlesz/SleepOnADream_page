import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { saveRelease } from "@/app/admin/actions/content";
import { ActionForm } from "@/components/admin/ActionForm";
import { DeleteContent } from "@/components/admin/DeleteContent";
import { SubmitButton } from "@/components/admin/forms";
import { AdminLink, Check, Input, mxDateInput, PageTitle } from "@/components/admin/ui";
import { getDb } from "@/lib/db";
import { formatDuration } from "@/lib/format";
import { requireAdmin } from "@/server/auth/dal";

export const metadata: Metadata = { title: "Lanzamiento" };

/** Página privada que depende de la sesión: la navegación espera al servidor. */
export const instant = false;

export default async function ReleaseEditPage({ params }: PageProps<"/admin/musica/[id]">) {
  await requireAdmin("content");
  const { id } = await params;
  const release = id === "nuevo" ? null : await getDb().release.findUnique({ where: { id }, include: { tracks: { orderBy: { position: "asc" } } } });
  if (id !== "nuevo" && !release) notFound();
  const tracks = release?.tracks.map((t) => (t.durationS ? `${t.title} | ${formatDuration(t.durationS)}` : t.title)).join("\n") ?? "";

  return (
    <>
      <AdminLink href="/admin/musica" className="text-xs">← Música</AdminLink>
      <div className="mt-4"><PageTitle title={release?.title ?? "Nuevo lanzamiento"} /></div>
      <ActionForm action={saveRelease} className="grid gap-5 border border-smoke bg-coal p-5 md:grid-cols-2">
        {release && <input type="hidden" name="id" value={release.id} />}
        <Input label="Título" name="title" required defaultValue={release?.title} />
        <Input label="URL (slug)" name="slug" defaultValue={release?.slug} hint="Se genera del título si lo dejas vacío." />
        <div>
          <label htmlFor="type" className="eyebrow mb-2 block">Tipo</label>
          <select id="type" name="type" className="field" defaultValue={release?.type ?? "SINGLE"}>
            <option value="SINGLE">Sencillo</option>
            <option value="EP">EP</option>
            <option value="ALBUM">Álbum</option>
          </select>
        </div>
        <Input label="Fecha de lanzamiento" name="releaseDate" type="date" required defaultValue={mxDateInput(release?.releaseDate ?? new Date())} />
        <div className="md:col-span-2">
          <label htmlFor="description" className="eyebrow mb-2 block">Descripción</label>
          <textarea id="description" name="description" rows={3} className="field" defaultValue={release?.description ?? ""} />
        </div>
        <Input label="Portada (URL de imagen)" name="coverImageUrl" type="url" placeholder="https://" defaultValue={release?.coverImageUrl ?? ""} className="md:col-span-2" />
        <Input label="Spotify" name="spotifyUrl" type="url" placeholder="https://open.spotify.com/…" defaultValue={release?.spotifyUrl ?? ""} />
        <Input label="Apple Music" name="appleMusicUrl" type="url" placeholder="https://music.apple.com/…" defaultValue={release?.appleMusicUrl ?? ""} />
        <Input label="YouTube Music" name="youtubeMusicUrl" type="url" placeholder="https://music.youtube.com/…" defaultValue={release?.youtubeMusicUrl ?? ""} />
        <Input label="Reproductor integrado (URL de embed)" name="embedUrl" type="url" placeholder="https://open.spotify.com/embed/…" defaultValue={release?.embedUrl ?? ""} hint="En Spotify: Compartir → Insertar → copiar el enlace src." />
        <div className="md:col-span-2">
          <label htmlFor="tracks" className="eyebrow mb-2 block">Lista de canciones</label>
          <textarea id="tracks" name="tracks" rows={6} className="field font-mono text-xs" defaultValue={tracks} placeholder={"Una por línea: Título | 3:45"} />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Check name="isFeatured" label="Lanzamiento más reciente / destacado (portada)" defaultChecked={release?.isFeatured} />
          <Check name="published" label="Publicado en el sitio" defaultChecked={release?.published ?? true} />
          <Check name="isSample" label="Contenido de ejemplo (muestra etiqueta)" defaultChecked={release?.isSample ?? false} />
        </div>
        <div className="flex justify-end md:col-span-2"><SubmitButton>Guardar</SubmitButton></div>
      </ActionForm>
      {release && <DeleteContent kind="release" id={release.id} label={release.title} />}
    </>
  );
}
