import { hasSocialIcon, SocialIcon } from "@/components/icons/SocialIcon";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";

/**
 * Enlaces a redes con su ícono. "md": solo íconos (pie de página, portada); "lg": ícono + nombre
 * (contacto). Los que aún no tienen URL oficial se muestran apagados y sin enlace.
 */
export function SocialLinks({
  className,
  size = "md",
  pendingLabel = "enlace pendiente",
}: {
  className?: string;
  size?: "md" | "lg";
  pendingLabel?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {siteConfig.socials.map((s) => {
        const cls = cn(
          "flex items-center justify-center gap-3 border border-smoke transition-colors",
          size === "lg" ? "h-14 min-w-14 px-4 text-xs font-semibold uppercase tracking-[0.12em]" : "h-10 w-10",
        );
        const content = (
          <>
            {hasSocialIcon(s.key) ? (
              <SocialIcon name={s.key} className={size === "lg" ? "h-5 w-5" : "h-[18px] w-[18px]"} />
            ) : (
              size === "md" && <span className="text-[0.65rem] font-semibold tracking-[0.12em]">{s.short}</span>
            )}
            {size === "lg" && <span>{s.label}</span>}
          </>
        );
        return (
          <li key={s.key}>
            {s.url ? (
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(cls, "text-mist hover:border-ember hover:text-ember")}
                aria-label={s.label}
                title={s.label}
              >
                {content}
              </a>
            ) : (
              <span className={cn(cls, "cursor-not-allowed text-iron")} title={`${s.label}: ${pendingLabel}`} aria-label={`${s.label} (${pendingLabel})`}>
                {content}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
