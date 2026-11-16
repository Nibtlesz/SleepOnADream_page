"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useState } from "react";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { Video } from "@/lib/types";

function Thumb({ video, className }: { video: Video; className?: string }) {
  const src = video.thumbnailUrl ?? (video.youtubeId ? `https://i.ytimg.com/vi/${video.youtubeId}/maxresdefault.jpg` : null);
  return (
    <div className={cn("relative aspect-video overflow-hidden bg-[radial-gradient(ellipse_at_30%_30%,#3a050b_0%,#0e0e10_70%)]", className)}>
      {src ? (
        <Image src={src} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
      ) : (
        <span className="display absolute inset-0 grid place-items-center text-3xl text-bone/10 md:text-5xl" aria-hidden>
          SOAD
        </span>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
    </div>
  );
}

/**
 * Reproductor "ligero": muestra la miniatura y solo carga el iframe de YouTube
 * (youtube-nocookie) cuando el usuario da clic. Ahorra ~1 MB por video.
 */
function Player({ video }: { video: Video }) {
  const [playing, setPlaying] = useState(false);
  if (playing && video.youtubeId) {
    return (
      <iframe
        className="aspect-video w-full"
        src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
        title={video.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return (
    <button
      type="button"
      className="group relative block w-full text-left"
      onClick={() => setPlaying(true)}
      disabled={!video.youtubeId}
      aria-label={video.youtubeId ? `Reproducir ${video.title}` : `${video.title} (video pendiente)`}
    >
      <Thumb video={video} />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid h-20 w-20 place-items-center rounded-full border border-bone/40 bg-ink/40 backdrop-blur transition-all duration-500 group-enabled:group-hover:scale-110 group-enabled:group-hover:border-ember group-enabled:group-hover:bg-blood">
          <Play className="ml-1 h-7 w-7" fill="currentColor" />
        </span>
      </span>
      {!video.youtubeId && (
        <span className="absolute bottom-4 left-4 text-xs text-mist">Agrega el ID de YouTube desde el panel para activar el reproductor.</span>
      )}
    </button>
  );
}

export function VideoGallery({ videos }: { videos: Video[] }) {
  const initial = videos.find((v) => v.isFeatured) ?? videos[0];
  const [current, setCurrent] = useState(initial);
  if (!current) return <p className="text-mist">Pronto habrá videos aquí.</p>;

  return (
    <div>
      <section aria-label="Video destacado" className="mb-16">
        <div className="border border-smoke bg-coal">
          <Player key={current.slug} video={current} />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <h2 className="display text-3xl md:text-5xl">{current.title}</h2>
          {current.isSample && <SampleBadge />}
        </div>
        <p className="mt-2 text-sm text-fog">{formatDate(current.publishedAt)}</p>
      </section>

      <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          <li key={v.slug}>
            <button
              type="button"
              onClick={() => {
                setCurrent(v);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              aria-pressed={v.slug === current.slug}
              className="group block w-full text-left"
            >
              <div className={cn("relative border transition-colors", v.slug === current.slug ? "border-ember" : "border-smoke group-hover:border-iron")}>
                <Thumb video={v} />
                <Play className="absolute bottom-3 left-3 h-4 w-4 text-bone" fill="currentColor" aria-hidden />
                {v.slug === current.slug && (
                  <span className="absolute top-3 left-3 bg-blood px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em]">Reproduciendo</span>
                )}
              </div>
              <p className="mt-3 font-semibold transition-colors group-hover:text-ember">{v.title}</p>
              <p className="mt-1 text-xs text-fog">{formatDate(v.publishedAt)}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
