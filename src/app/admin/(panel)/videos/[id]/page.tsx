import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { saveVideo } from "@/app/admin/actions/content";
import { ActionForm } from "@/components/admin/ActionForm";
import { DeleteContent } from "@/components/admin/DeleteContent";
import { SubmitButton } from "@/components/admin/forms";
import { AdminLink, Check, Input, mxDateInput, PageTitle } from "@/components/admin/ui";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/server/auth/dal";

export const metadata: Metadata = { title: "Video" };

/** Página privada que depende de la sesión: la navegación espera al servidor. */
export const instant = false;

export default async function VideoEditPage({ params }: PageProps<"/admin/videos/[id]">) {
  await requireAdmin("content");
  const { id } = await params;
  const video = id === "nuevo" ? null : await getDb().video.findUnique({ where: { id } });
  if (id !== "nuevo" && !video) notFound();
  return (
    <>
      <AdminLink href="/admin/videos" className="text-xs">← Videos</AdminLink>
      <div className="mt-4"><PageTitle title={video?.title ?? "Nuevo video"} /></div>
      <ActionForm action={saveVideo} className="grid gap-5 border border-smoke bg-coal p-5 md:grid-cols-2">
        {video && <input type="hidden" name="id" value={video.id} />}
        <Input label="Título" name="title" required defaultValue={video?.title} />
        <Input label="URL (slug)" name="slug" defaultValue={video?.slug} hint="Se genera del título si lo dejas vacío." />
        <Input label="Enlace o ID de YouTube" name="youtube" defaultValue={video?.youtubeId ?? ""} placeholder="https://www.youtube.com/watch?v=…" />
        <Input label="Fecha de publicación" name="publishedAt" type="date" required defaultValue={mxDateInput(video?.publishedAt ?? new Date())} />
        <Input label="Miniatura personalizada (opcional)" name="thumbnailUrl" type="url" placeholder="https://" defaultValue={video?.thumbnailUrl ?? ""} className="md:col-span-2" hint="Si se deja vacío se usa la miniatura de YouTube." />
        <div className="flex flex-col gap-2 md:col-span-2">
          <Check name="isFeatured" label="Destacar en la galería (solo uno a la vez)" defaultChecked={video?.isFeatured} />
          <Check name="published" label="Publicado en el sitio" defaultChecked={video?.published ?? true} />
          <Check name="isSample" label="Contenido de ejemplo (muestra etiqueta)" defaultChecked={video?.isSample ?? false} />
        </div>
        <div className="flex justify-end md:col-span-2"><SubmitButton>Guardar</SubmitButton></div>
      </ActionForm>
      {video && <DeleteContent kind="video" id={video.id} label={video.title} />}
    </>
  );
}
