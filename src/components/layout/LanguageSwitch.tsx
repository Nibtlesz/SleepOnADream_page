"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, stripLocale } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";

/**
 * Switch ES / EN. Lleva a la misma página en el otro idioma; el proxy recuerda la elección
 * en una cookie. Sin prefetch: precargar el enlace no debe cambiar el idioma guardado.
 */
export function LanguageSwitch({ className }: { className?: string }) {
  const { lang, t } = useI18n();
  const path = stripLocale(usePathname());
  return (
    <div role="group" aria-label={t.header.language} className={cn("flex items-center border border-smoke text-[0.65rem] font-semibold tracking-[0.16em]", className)}>
      {LOCALES.map((l) => {
        const active = l === lang;
        // /es/... redirige a la URL canónica sin prefijo y guarda "es".
        const href = path === "/" ? `/${l}` : `/${l}${path}`;
        return active ? (
          <span key={l} aria-current="true" className="grid h-8 min-w-9 place-items-center bg-bone px-2 text-ink">
            {l.toUpperCase()}
          </span>
        ) : (
          <Link
            key={l}
            href={href}
            prefetch={false}
            hrefLang={l}
            lang={l}
            className="grid h-8 min-w-9 place-items-center px-2 text-mist transition-colors hover:text-bone"
            aria-label={`${t.header.switchTo} ${l === "es" ? "Español" : "English"}`}
          >
            {l.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
