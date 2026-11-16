import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { saveShow } from "@/app/admin/actions/content";
import { ActionForm } from "@/components/admin/ActionForm";
import { DeleteContent } from "@/components/admin/DeleteContent";
import { SubmitButton } from "@/components/admin/forms";
import { AdminLink, Check, Input, mxDateInput, mxTimeInput, PageTitle } from "@/components/admin/ui";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/server/auth/dal";

export const metadata: Metadata = { title: "Concierto" };

/** Página privada que depende de la sesión: la navegación espera al servidor. */
export const instant = false;

export default async function ShowEditPage({ params }: PageProps<"/admin/conciertos/[id]">) {
  await requireAdmin("content");
  const { id } = await params;
  const show = id === "nuevo" ? null : await getDb().show.findUnique({ where: { id } });
  if (id !== "nuevo" && !show) notFound();

  return (
    <>
      <AdminLink href="/admin/conciertos" className="text-xs">← Conciertos</AdminLink>
      <div className="mt-4"><PageTitle title={show ? `${show.city}` : "Nuevo concierto"} /></div>
      <ActionForm action={saveShow} className="grid gap-5 border border-smoke bg-coal p-5 md:grid-cols-2">
        {show && <input type="hidden" name="id" value={show.id} />}
        <Input label="Fecha" name="date" type="date" required defaultValue={mxDateInput(show?.startsAt ?? null)} />
        <Input label="Hora (centro de México)" name="time" type="time" required defaultValue={mxTimeInput(show?.startsAt ?? null)} />
        <Input label="Ciudad" name="city" required defaultValue={show?.city} />
        <Input label="Estado" name="state" required defaultValue={show?.state} />
        <Input label="Recinto" name="venue" required defaultValue={show?.venue} className="md:col-span-2" />
        <Input label="Enlace de boletos" name="ticketUrl" type="url" placeholder="https://" defaultValue={show?.ticketUrl ?? ""} />
        <Input label="Cartel (URL de imagen)" name="posterUrl" type="url" placeholder="https://" defaultValue={show?.posterUrl ?? ""} />
        <div className="md:col-span-2">
          <label htmlFor="notes" className="eyebrow mb-2 block">Información adicional</label>
          <textarea id="notes" name="notes" rows={3} className="field" defaultValue={show?.notes ?? ""} placeholder="Puertas, clasificación, teloneros…" />
        </div>
        <div>
          <label htmlFor="status" className="eyebrow mb-2 block">Estado</label>
          <select id="status" name="status" className="field" defaultValue={show?.status ?? "SCHEDULED"}>
            <option value="SCHEDULED">Programado</option>
            <option value="SOLD_OUT">Agotado</option>
            <option value="POSTPONED">Pospuesto</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>
        <div className="flex flex-col justify-end gap-2">
          <Check name="published" label="Publicado en el sitio" defaultChecked={show?.published ?? true} />
          <Check name="isSample" label="Contenido de ejemplo (muestra etiqueta)" defaultChecked={show?.isSample ?? false} />
        </div>
        <div className="flex justify-end md:col-span-2"><SubmitButton>Guardar</SubmitButton></div>
      </ActionForm>
      {show && <DeleteContent kind="show" id={show.id} label={`${show.city} · ${show.venue}`} />}
    </>
  );
}
