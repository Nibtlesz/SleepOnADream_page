import { ExternalLink } from "lucide-react";
import type { Release } from "@/lib/types";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/cn";

const PLATFORMS = [
  { key: "spotify", label: "Spotify" },
  { key: "appleMusic", label: "Apple Music" },
  { key: "youtubeMusic", label: "YouTube Music" },
] as const;

export async function StreamingLinks({ links, className }: { links: Release["links"]; className?: string }) {
  const { t } = await getI18n();
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {PLATFORMS.map((p) => {
        const url = links[p.key];
        return (
          <li key={p.key}>
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 border border-smoke px-4 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-mist transition-colors hover:border-ember hover:text-bone">
                {p.label} <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            ) : (
              <span className="inline-flex h-10 cursor-not-allowed items-center border border-dashed border-smoke px-4 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-iron" title={t.common.pendingLink}>
                {p.label}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
