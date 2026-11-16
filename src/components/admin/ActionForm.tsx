"use client";

import { useActionState, type ReactNode } from "react";
import type { ActionState } from "./forms";

const FIELD_LABEL: Record<string, string> = {};

/**
 * Formulario genérico del panel: los campos llegan como children (renderizados en el
 * servidor con sus valores) y aquí solo se muestran los errores de validación.
 */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const errors = Object.entries(state.errors ?? {});
  return (
    <form action={formAction} className={className}>
      {state.message && (
        <div role="alert" className="mb-6 border border-ember/50 px-4 py-3 text-sm text-ember md:col-span-full">
          <p>{state.message}</p>
          {errors.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-xs">
              {errors.map(([k, v]) => <li key={k}>{FIELD_LABEL[k] ?? k}: {v}</li>)}
            </ul>
          )}
        </div>
      )}
      {children}
    </form>
  );
}
