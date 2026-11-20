"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Play, Headphones } from "lucide-react";
import { useEffect, useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { useI18n } from "@/i18n/client";

/** Fondo de la portada: teaser oficial sin audio (720p en teléfono, 1080p en pantallas grandes). */
const HERO_VIDEO = {
  poster: "/images/portada-poster.jpg",
  small: "/video/portada-720.mp4",
  large: "/video/portada-1080.mp4",
};

/**
 * Portada inmersiva con el teaser en loop (sin audio). Con "reducir movimiento" activado
 * o con ahorro de datos, se queda en la imagen fija.
 */
export function Hero({ latestTitle, isSample }: { latestTitle: string; isSample: boolean }) {
  const { t } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "25%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    // `muted` como propiedad: algunos navegadores (iOS) no reproducen solos si solo viene en el HTML.
    v.muted = true;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduce || saveData) v.pause();
    else v.play().catch(() => {});
  }, [reduce]);

  const intro = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 30 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 1, delay, ease: [0.2, 0.8, 0.2, 1] as const },
        };

  return (
    <section ref={ref} className="relative isolate flex min-h-[100svh] items-end overflow-hidden" aria-label={t.home.hero}>
      {/* Escena de fondo */}
      <motion.div style={{ y }} className="absolute inset-0 -z-10 bg-ink" aria-hidden>
        <video
          ref={video}
          className="absolute inset-0 h-full w-full object-cover"
          poster={HERO_VIDEO.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
        >
          <source src={HERO_VIDEO.large} type="video/mp4" media="(min-width: 768px)" />
          <source src={HERO_VIDEO.small} type="video/mp4" />
        </video>
        {/* Oscurece el video para que el logo y los botones se lean bien */}
        <div className="absolute inset-0 bg-ink/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
        <div className="absolute inset-0 shadow-[inset_0_0_200px_80px_#070708]" />
      </motion.div>

      <motion.div style={{ opacity: fade }} className="container-site pt-28 pb-16 md:pt-36 md:pb-24">
        <motion.div {...intro(0.1)} className="mb-6 flex flex-wrap items-center gap-3">
          <p className="eyebrow flex items-center gap-3 text-mist">
            <span className="h-px w-10 bg-ember" aria-hidden />
            {t.home.newRelease} · {latestTitle}
          </p>
          {isSample && <SampleBadge />}
        </motion.div>

        <motion.h1 {...intro(0.25)}>
          <Logo
            priority
            sizes="(min-width: 768px) 46rem, 88vw"
            className="h-auto w-[min(88vw,46rem,72svh)] drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
          />
        </motion.h1>

        <motion.div {...intro(0.5)} className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/music#ultimo-lanzamiento" size="lg">
            <Headphones className="h-4 w-4" /> {t.home.listenNow}
          </ButtonLink>
          <ButtonLink href="/videos" size="lg" variant="outline">
            <Play className="h-4 w-4" /> {t.home.watchVideo}
          </ButtonLink>
          <ButtonLink href="/store" size="lg" variant="ghost" className="underline decoration-ember decoration-2 underline-offset-8">
            {t.home.officialStore}
          </ButtonLink>
        </motion.div>
      </motion.div>

      <div className="absolute right-6 bottom-8 hidden flex-col items-center gap-3 md:flex" aria-hidden>
        <span className="eyebrow [writing-mode:vertical-rl]">Scroll</span>
        <span className="relative h-16 w-px overflow-hidden bg-smoke">
          <span className="absolute inset-x-0 h-1/2 animate-scroll-cue bg-ember" />
        </span>
      </div>
    </section>
  );
}
