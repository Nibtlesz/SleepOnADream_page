import type { Metadata } from "next";
import { StreamingLinks } from "@/components/music/StreamingLinks";
import { CoverArt } from "@/components/ui/Art";
import { Reveal } from "@/components/ui/Reveal";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { PageHeader } from "@/components/ui/SectionHeading";
import { formatDate, formatDuration } from "@/lib/format";
import type { Release } from "@/lib/types";
import { getReleases } from "@/server/queries/content";

export const metadata: Metadata = {
  title: "Music",
  description: "Discografía de Sleep On a Dream: álbumes, EPs y sencillos.",
};

const TYPE_LABEL = { ALBUM: "Álbum", EP: "EP", SINGLE: "Sencillo" } as const;

function Player({ release }: { release: Release }) {
  if (release.embedUrl) {
    return (
      <iframe
        src={release.embedUrl}
        title={`Reproductor: ${release.title}`}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="h-[152px] w-full border-0"
      />
    );
  }
  return (
    <div className="flex h-20 items-center justify-center border border-dashed border-smoke text-xs text-fog">
      Reproductor integrado (Spotify / YouTube) — se activa al cargar el enlace oficial desde el panel.
    </div>
  );
}

export default async function MusicPage() {
  const releases = await getReleases();
  return (
    <>
      <PageHeader eyebrow="Discografía" title="Music" intro="Álbumes, EPs y sencillos. Escúchalos aquí o en tu plataforma favorita." />
      <div className="container-site divide-y divide-smoke">
        {releases.map((r, i) => (
          <article
            key={r.slug}
            id={i === 0 ? "ultimo-lanzamiento" : r.slug}
            className="grid scroll-mt-24 gap-10 py-16 md:grid-cols-12 md:gap-14 md:py-24"
            aria-labelledby={`${r.slug}-title`}
          >
            <Reveal className="md:col-span-5">
              <div className="group relative overflow-hidden">
                <CoverArt seed={r.slug} title={r.title} className="transition-transform duration-700 group-hover:scale-[1.03]" />
              </div>
            </Reveal>
            <Reveal delay={0.1} className="md:col-span-7">
              <div className="flex flex-wrap items-center gap-3">
                <p className="eyebrow">{TYPE_LABEL[r.type]} · {formatDate(r.releaseDate)}</p>
                {i === 0 && <span className="bg-blood px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em]">Nuevo</span>}
                {r.isSample && <SampleBadge />}
              </div>
              <h2 id={`${r.slug}-title`} className="display mt-4 text-5xl md:text-7xl">{r.title}</h2>
              <p className="mt-5 max-w-xl leading-relaxed text-mist">{r.description}</p>
              <StreamingLinks links={r.links} className="mt-7" />
              <div className="mt-7"><Player release={r} /></div>
              {r.tracks.length > 1 && (
                <ol className="mt-8 border-t border-smoke">
                  {r.tracks.map((t) => (
                    <li key={t.position} className="flex items-center gap-5 border-b border-smoke py-3 text-sm">
                      <span className="w-6 text-right tabular-nums text-fog">{t.position}</span>
                      <span className="flex-1 truncate">{t.title}</span>
                      {t.durationS && <span className="tabular-nums text-fog">{formatDuration(t.durationS)}</span>}
                    </li>
                  ))}
                </ol>
              )}
            </Reveal>
          </article>
        ))}
      </div>
    </>
  );
}
