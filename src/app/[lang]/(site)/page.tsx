import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { Hero } from "@/components/home/Hero";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { StreamingLinks } from "@/components/music/StreamingLinks";
import { ProductCard } from "@/components/store/ProductCard";
import { ShowRow } from "@/components/tour/ShowRow";
import { CoverArt, PhotoPlaceholder } from "@/components/ui/Art";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { INTL_LOCALE } from "@/i18n/config";
import { siteConfig } from "@/config/site";
import { getI18n, pageAlternates } from "@/i18n/server";
import { formatDate } from "@/lib/format";
import { getFeaturedProducts } from "@/server/queries/catalog";
import { getLatestRelease, getNews, getShows } from "@/server/queries/content";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: await pageAlternates("/") };
}

export default async function HomePage() {
  const { lang, t } = await getI18n();
  const locale = INTL_LOCALE[lang];
  const [latest, shows, products, news] = await Promise.all([
    getLatestRelease(),
    getShows(),
    getFeaturedProducts(4),
    siteConfig.features.news ? getNews(3) : Promise.resolve([]),
  ]);

  return (
    <>
      <Hero latestTitle={latest?.title ?? t.home.comingSoon} isSample={latest?.isSample ?? false} />

      {/* ── Último lanzamiento ─────────────────────────────── */}
      {latest && (
        <section className="relative border-t border-smoke py-24 md:py-36" aria-labelledby="latest-title">
          <div className="container-site grid items-center gap-12 md:grid-cols-12 md:gap-16">
            <Reveal className="md:col-span-6 lg:col-span-5">
              <div className="relative">
                <div className="absolute -inset-6 -z-10 bg-blood/25 blur-3xl" aria-hidden />
                <CoverArt seed={latest.slug} title={latest.title} src={latest.coverImageUrl} className="shadow-2xl shadow-black" />
              </div>
            </Reveal>
            <Reveal delay={0.1} className="md:col-span-6 lg:col-span-6 lg:col-start-7">
              <p className="eyebrow mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-blood" aria-hidden />
                {t.home.latestRelease} · {t.common.releaseType[latest.type]}
              </p>
              <h2 id="latest-title" className="display text-6xl md:text-8xl">{latest.title}</h2>
              <p className="mt-3 text-sm text-fog">{formatDate(latest.releaseDate, {}, locale)}</p>
              {latest.isSample && <SampleBadge className="mt-4" />}
              <p className="mt-6 max-w-lg leading-relaxed text-mist">{latest.description}</p>
              <StreamingLinks links={latest.links} className="mt-8" />
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/music#ultimo-lanzamiento">{t.home.listen}</ButtonLink>
                <ButtonLink href="/videos#destacado" variant="outline">{t.home.watchVideo}</ButtonLink>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Próximos conciertos ────────────────────────────── */}
      <section className="border-t border-smoke bg-coal py-24 md:py-32" aria-labelledby="tour-title">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={t.home.live}
              title={<span id="tour-title">{t.home.upcomingShows}</span>}
              action={<ButtonLink href="/tour" variant="outline" size="sm">{t.home.allDates}</ButtonLink>}
            />
          </Reveal>
          {shows.upcoming.length ? (
            <ul className="border-t border-smoke">
              {shows.upcoming.slice(0, 4).map((show) => (
                <ShowRow key={show.id} show={show} />
              ))}
            </ul>
          ) : (
            <p className="text-mist">{t.home.noShows}</p>
          )}
        </div>
      </section>

      {/* ── Tienda destacada ───────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-smoke py-24 md:py-32" aria-labelledby="store-title">
        <div className="container-site">
          <Reveal>
            <div className="relative mb-16 grid overflow-hidden border border-smoke md:grid-cols-2">
              <PhotoPlaceholder tone="red" label={t.home.campaignImage} className="min-h-72 md:min-h-[28rem]" />
              <div className="flex flex-col justify-center bg-ash p-8 md:p-14">
                <p className="eyebrow mb-4">{t.home.storeEyebrow}</p>
                <h2 id="store-title" className="display font-script pt-[0.15em] leading-[1.05] text-5xl md:text-7xl">
                  {t.home.storeTitle[0]} <span className="text-ember">{t.home.storeTitle[1]}</span>
                </h2>
                <p className="mt-5 max-w-md text-mist">
                  {t.home.storePitch}
                </p>
                <div className="mt-8">
                  <ButtonLink href="/store" size="lg">{t.home.shopNow}</ButtonLink>
                </div>
              </div>
            </div>
          </Reveal>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
            {products.map((p, i) => (
              <li key={p.id}>
                <Reveal delay={i * 0.08}>
                  <ProductCard product={p} />
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Novedades (oculta con siteConfig.features.news) ─── */}
      {siteConfig.features.news && news.length > 0 && (
      <section className="border-t border-smoke bg-coal py-24 md:py-32" aria-labelledby="news-title">
        <div className="container-site">
          <Reveal>
            <SectionHeading eyebrow={t.home.newsEyebrow} title={<span id="news-title">{t.home.newsTitle}</span>} />
          </Reveal>
          <ul className="grid gap-px border border-smoke bg-smoke md:grid-cols-3">
            {news.map((post, i) => (
              <li key={post.slug} className="bg-coal">
                <Reveal delay={i * 0.08} className="h-full">
                  <article className="group flex h-full flex-col p-8 transition-colors hover:bg-ash md:p-10">
                    <time dateTime={post.publishedAt} className="eyebrow">
                      {formatDate(post.publishedAt, {}, locale)}
                    </time>
                    <h3 className="mt-6 text-2xl font-semibold leading-tight">{post.title}</h3>
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-fog">{post.excerpt}</p>
                    <div className="mt-8 flex items-center justify-between">
                      {post.isSample ? <SampleBadge /> : <span />}
                      <ArrowUpRight className="h-5 w-5 text-iron transition-all group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-ember" aria-hidden />
                    </div>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>
      )}

      {/* ── Newsletter + redes ─────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-smoke py-24 md:py-36" aria-labelledby="nl-title">
        <div aria-hidden className="pointer-events-none absolute -bottom-40 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-blood/20 blur-[120px]" />
        <div className="container-site relative grid gap-12 md:grid-cols-2 md:items-end">
          <Reveal>
            <p className="eyebrow mb-4">{t.home.community}</p>
            <h2 id="nl-title" className="display text-6xl md:text-8xl">
              {t.home.dontMiss[0]}
              <br />
              <span className="text-stroke">{t.home.dontMiss[1]}</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mb-6 max-w-md text-mist">
              {t.home.newsletterPitch}
            </p>
            <NewsletterForm className="max-w-md" />
            <div className="mt-10">
              <p className="eyebrow mb-4">{t.footer.follow}</p>
              <SocialLinks pendingLabel={t.social.pending} />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
