"use client";

import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";

/** Etiqueta visible para contenido provisional: evita confundirlo con información oficial. */
export function SampleBadge({ className, label }: { className?: string; label?: string }) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border border-dashed border-ember/60 bg-ink/70 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-ember backdrop-blur",
        className,
      )}
    >
      <span className="h-1 w-1 rounded-full bg-ember" aria-hidden />
      {label ?? t.common.sample}
    </span>
  );
}
