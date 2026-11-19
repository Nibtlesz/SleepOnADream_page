import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { SpotifyArtistPlayer } from "@/components/music/SpotifyArtistPlayer";
import { StreamingLinks } from "@/components/music/StreamingLinks";
import { CoverArt } from "@/components/ui/Art";
import { Reveal } from "@/components/ui/Reveal";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { PageHeader } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";
import { INTL_LOCALE } from "@/i18n/config";
import { getI18n, pageAlternates } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { formatDate, formatDuration } from "@/lib/format";
import type { Release } from "@/lib/types";
import { getReleases } from "@/server/queries/content";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.music.title, description: t.meta.music.description, alternates: await pageAlternates("/music") };
}

function Player({ release, t }: { release: Release; t: Dictionary }) {
  if (release.embedUrl) {
    return (
      <iframe
        src={release.embedUrl}
        title={`${t.music.player}: ${release.title}`}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="h-[152px] w-full border-0"
      />
    );
  }
  return (
    <div className="flex h-20 items-center justify-center border border-dashed border-smoke px-4 text-center text-xs text-fog">
      {t.music.playerPending}
    </div>
  );
}

export default async function MusicPage() {
  const { lang, t } = await getI18n();
  const releases = await getReleases();
  const spotify = siteConfig.socials.find((s) => s.key === "spotify")?.url;

  return (
    <>
      <PageHeader eyebrow={t.music.eyebrow} title={t.nav.music} intro={t.music.intro} />

      <section className="container-site py-16 md:py-24" aria-labelledby="spotify-title">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 id="spotify-title" className="display text-4xl md:text-5xl">{t.music.spotifyTitle}</h2>
          {spotify && (
            <a
              href={spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-mist hover:text-bone"
            >
              Spotify <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
        </div>
        <SpotifyArtistPlayer title={t.music.spotifyFrame} />
      </section>

      <div className="container-site divide-y divide-smoke border-t border-smoke">
        {releases.map((r, i) => (
          <article
            key={r.slug}
            id={i === 0 ? "ultimo-lanzamiento" : r.slug}
            className="grid scroll-mt-24 gap-10 py-16 md:grid-cols-12 md:gap-14 md:py-24"
            aria-labelledby={`${r.slug}-title`}
          >
            <Reveal className="md:col-span-5">
              <div className="group relative overflow-hidden">
                <CoverArt seed={r.slug} title={r.title} src={r.coverImageUrl} className="transition-transform duration-700 group-hover:scale-[1.03]" />
              </div>
            </Reveal>
            <Reveal delay={0.1} className="md:col-span-7">
              <div className="flex flex-wrap items-center gap-3">
                <p className="eyebrow">{t.common.releaseType[r.type]} · {formatDate(r.releaseDate, {}, INTL_LOCALE[lang])}</p>
                {i === 0 && <span className="bg-blood px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em]">{t.common.new}</span>}
                {r.isSample && <SampleBadge />}
              </div>
              <h2 id={`${r.slug}-title`} className="display mt-4 text-5xl md:text-7xl">{r.title}</h2>
              <p className="mt-5 max-w-xl leading-relaxed text-mist">{r.description}</p>
              <StreamingLinks links={r.links} className="mt-7" />
              <div className="mt-7"><Player release={r} t={t} /></div>
              {r.tracks.length > 1 && (
                <ol className="mt-8 border-t border-smoke">
                  {r.tracks.map((track) => (
                    <li key={track.position} className="flex items-center gap-5 border-b border-smoke py-3 text-sm">
                      <span className="w-6 text-right tabular-nums text-fog">{track.position}</span>
                      <span className="flex-1 truncate">{track.title}</span>
                      {track.durationS && <span className="tabular-nums text-fog">{formatDuration(track.durationS)}</span>}
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
