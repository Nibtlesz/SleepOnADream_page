"use client";

/** Campos y botones de formulario del panel (cliente). */
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { btn } from "./ui";

export type ActionState = { ok?: boolean; message?: string; errors?: Record<string, string> };

export function SubmitButton({ children, variant = "primary", className }: { children: ReactNode; variant?: keyof typeof btn; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn(btn[variant], className)} aria-busy={pending}>
      {pending ? "Guardando…" : children}
    </button>
  );
}

export function Field({
  label,
  name,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="eyebrow mb-2 block">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-fog">{hint}</p>}
      {error && <p className="mt-1 text-xs text-ember">{error}</p>}
    </div>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <p role={state.ok ? "status" : "alert"} className={cn("border px-4 py-3 text-sm", state.ok ? "border-emerald-500/40 text-emerald-300" : "border-ember/50 text-ember")}>
      {state.message}
    </p>
  );
}

/** Botón que pide confirmación antes de enviar una acción irreversible. */
export function ConfirmButton({ children, message, className }: { children: ReactNode; message: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {pending ? "Procesando…" : children}
    </button>
  );
}
