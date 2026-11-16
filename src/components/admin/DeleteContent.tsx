import { deleteContent } from "@/app/admin/actions/content";
import { ConfirmButton } from "./forms";
import { btn } from "./ui";

export function DeleteContent({ kind, id, label }: { kind: "show" | "video" | "release"; id: string; label: string }) {
  return (
    <form action={deleteContent} className="mt-10 border-t border-smoke pt-6">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <ConfirmButton className={btn.danger} message={`¿Eliminar "${label}" de forma permanente? No se puede deshacer.`}>
        Eliminar
      </ConfirmButton>
    </form>
  );
}
