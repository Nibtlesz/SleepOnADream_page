import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";

/** Enlaces a redes. Los que aún no tienen URL oficial se muestran deshabilitados. */
export function SocialLinks({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {siteConfig.socials.map((s) => {
        const cls = cn(
          "grid place-items-center border border-smoke font-semibold tracking-[0.12em] transition-colors",
          size === "lg" ? "h-14 min-w-14 px-4 text-xs" : "h-10 min-w-10 px-3 text-[0.65rem]",
        );
        return (
          <li key={s.key}>
            {s.url ? (
              <a href={s.url} target="_blank" rel="noopener noreferrer" className={cn(cls, "text-mist hover:border-ember hover:text-bone")} aria-label={s.label}>
                {size === "lg" ? s.label : s.short}
              </a>
            ) : (
              <span className={cn(cls, "cursor-not-allowed text-iron")} title={`${s.label}: enlace pendiente`} aria-label={`${s.label} (enlace pendiente)`}>
                {size === "lg" ? s.label : s.short}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
