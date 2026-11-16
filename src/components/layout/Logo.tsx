import { cn } from "@/lib/cn";

/**
 * Logotipo TIPOGRÁFICO PROVISIONAL. Sustituir por el logotipo oficial en SVG
 * (public/brand/logo.svg) cuando la banda lo entregue.
 */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("display inline-flex select-none items-baseline gap-[0.18em] leading-none", className)}>
      {compact ? (
        <>
          S<span className="text-ember">·</span>O<span className="text-ember">·</span>A<span className="text-ember">·</span>D
        </>
      ) : (
        <>
          Sleep On <span className="text-ember">a</span> Dream
        </>
      )}
    </span>
  );
}
