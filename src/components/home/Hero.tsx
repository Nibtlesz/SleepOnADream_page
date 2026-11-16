"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Play, Headphones } from "lucide-react";
import { useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { useI18n } from "@/i18n/client";

/**
 * Portada inmersiva. El fondo es una escena CSS (niebla, luz roja, viñeta);
 * cuando exista material oficial se reemplaza por <video> en loop (muted,
 * playsInline, poster optimizado) o por una imagen con <Image priority>.
 */
export function Hero({ latestTitle, isSample }: { latestTitle: string; isSample: boolean }) {
  const { t } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "25%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

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
      <motion.div style={{ y }} className="absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_35%,#3a050b_0%,#120204_45%,#070708_80%)]" />
        <div className="absolute -inset-[20%] animate-drift bg-[radial-gradient(ellipse_40%_30%_at_30%_60%,rgba(236,235,232,0.07),transparent_70%),radial-gradient(ellipse_35%_25%_at_75%_70%,rgba(236,235,232,0.05),transparent_70%)] blur-2xl" />
        <div className="absolute -inset-[20%] animate-drift-slow bg-[radial-gradient(ellipse_30%_40%_at_60%_30%,rgba(224,38,47,0.22),transparent_70%)] blur-3xl" />
        <div className="absolute top-[18%] right-[12%] h-[38vmin] w-[38vmin] animate-flicker rounded-full bg-[radial-gradient(circle,rgba(224,38,47,0.5)_0%,rgba(165,15,26,0.15)_45%,transparent_70%)] blur-xl" />
        {/* Líneas verticales tipo luz de escenario */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0_120px,rgba(236,235,232,0.025)_120px_121px)]" />
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
