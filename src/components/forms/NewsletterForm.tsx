"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { ArrowRight, Check } from "lucide-react";
import { subscribeNewsletter } from "@/app/actions";
import type { FormState } from "@/lib/validation/schemas";
import { cn } from "@/lib/cn";
import { AntiSpamFields } from "./AntiSpamFields";

const initial: FormState = { status: "idle" };

export function NewsletterForm({ className, compact = false }: { className?: string; compact?: boolean }) {
  const [state, action, pending] = useActionState(subscribeNewsletter, initial);
  const id = useId();
  const emailError = state.fieldErrors?.email?.[0];
  const consentError = state.fieldErrors?.consent?.[0];

  if (state.status === "success") {
    return (
      <p role="status" className={cn("flex items-center gap-3 text-sm text-bone", className)}>
        <Check className="h-5 w-5 text-ember" aria-hidden /> {state.message}
      </p>
    );
  }

  return (
    <form action={action} noValidate className={cn("relative", className)}>
      <AntiSpamFields />
      <label htmlFor={`${id}-email`} className="sr-only">
        Correo electrónico
      </label>
      <div className="flex">
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@correo.com"
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? `${id}-err` : undefined}
          className="field min-w-0 flex-1"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex shrink-0 items-center gap-2 bg-blood px-5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] transition-colors hover:bg-ember disabled:opacity-50"
        >
          {pending ? "Enviando…" : compact ? <ArrowRight className="h-4 w-4" aria-label="Suscribirme" /> : "Suscribirme"}
        </button>
      </div>
      <label className="mt-3 flex items-start gap-2.5 text-xs leading-relaxed text-fog">
        <input type="checkbox" name="consent" required className="mt-0.5 accent-ember" aria-invalid={Boolean(consentError)} />
        <span>
          Acepto recibir noticias de la banda y el{" "}
          <Link href="/legal/privacidad" className="underline decoration-iron underline-offset-2 hover:text-bone">
            aviso de privacidad
          </Link>
          .
        </span>
      </label>
      {(state.status === "error" || emailError || consentError) && (
        <p id={`${id}-err`} role="alert" className="mt-2 text-xs text-ember">
          {emailError ?? consentError ?? state.message}
        </p>
      )}
    </form>
  );
}
