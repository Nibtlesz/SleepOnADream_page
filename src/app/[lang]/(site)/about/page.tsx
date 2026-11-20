import type { Metadata } from "next";
import Image from "next/image";
import { Download } from "lucide-react";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { CoverArt, PhotoPlaceholder } from "@/components/ui/Art";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { siteConfig } from "@/config/site";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import { memberRole } from "@/i18n";
import { getI18n, pageAlternates } from "@/i18n/server";
import { getBandMembers, getReleases } from "@/server/queries/content";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.about.title, description: t.meta.about.description, alternates: await pageAlternates("/about") };
}

/** Foto de la galería: ocupa la celda completa y se recorta según `focus`. */
function GalleryPhoto({ src, alt, className, sizes, focus = "50% 50%" }: { src: string; alt: string; className: string; sizes: string; focus?: string }) {
  return (
    <div className={`relative overflow-hidden bg-coal ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" style={{ objectPosition: focus }} />
    </div>
  );
}

export default async function AboutPage() {
  const { lang, t } = await getI18n();
  const a = t.about;
  const [members, releases] = await Promise.all([getBandMembers(), getReleases()]);
  return (
    <>
      {/* Apertura editorial */}
      <header className="relative min-h-[80svh] overflow-hidden">
        <Image
          src={siteConfig.groupPhoto}
          alt={siteConfig.name}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_35%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="container-site relative flex min-h-[80svh] flex-col justify-end pb-16 md:pb-24">
          <p className="eyebrow mb-5 flex items-center gap-3"><span className="h-px w-8 bg-blood" aria-hidden />{a.eyebrow}</p>
          <h1 className="display text-[clamp(3.5rem,12vw,10rem)]">{t.nav.about}</h1>
        </div>
      </header>

      {/* Historia */}
      <section className="container-site grid gap-12 py-24 md:grid-cols-12 md:py-32" aria-labelledby="historia">
        <Reveal className="md:col-span-4">
          <h2 id="historia" className="display text-5xl md:text-6xl">{a.history}</h2>
        </Reveal>
        <Reveal delay={0.1} className="space-y-6 text-lg leading-relaxed md:col-span-7 md:col-start-6">
          <p className="display text-3xl leading-tight text-bone md:text-4xl">
            {a.historyLead}
          </p>
          <p className="text-mist">{a.historyText}</p>
        </Reveal>
      </section>

      {/* Galería editorial */}
      <section aria-label={a.gallery} className="container-site grid gap-3 md:grid-cols-12 md:gap-4">
        <GalleryPhoto src="/images/band/promo.jpg" alt={a.promoPhoto} className="aspect-[3/2] md:col-span-8" sizes="(min-width: 768px) 66vw, 100vw" />
        <GalleryPhoto src="/images/band/retrato.jpg" alt={a.portrait} focus="50% 65%" className="aspect-[4/5] md:col-span-4 md:aspect-auto" sizes="(min-width: 768px) 33vw, 100vw" />
        <GalleryPhoto src="/images/band/en-vivo.jpg" alt={a.live} className="aspect-[3/2] md:col-span-6" sizes="(min-width: 768px) 50vw, 100vw" />
        <GalleryPhoto src="/images/band/grabacion.jpg" alt={a.studio} className="aspect-[3/2] md:col-span-6" sizes="(min-width: 768px) 50vw, 100vw" />
      </section>

      {/* Biografía oficial */}
      <section className="container-site grid gap-12 py-24 md:grid-cols-12 md:py-32" aria-labelledby="bio">
        <Reveal className="md:col-span-4">
          <h2 id="bio" className="display text-5xl md:text-6xl">{a.bio}</h2>
        </Reveal>
        <Reveal delay={0.1} className="space-y-5 leading-relaxed text-mist md:col-span-7 md:col-start-6">
          {a.bioText.map((paragraph) => <p key={paragraph.slice(0, 32)}>{paragraph}</p>)}
        </Reveal>
      </section>

      {/* Integrantes */}
      <section className="border-y border-smoke bg-coal py-24 md:py-32" aria-labelledby="integrantes">
        <div className="container-site">
          <h2 id="integrantes" className="display mb-12 text-5xl md:text-7xl">{a.members}</h2>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {members.map((m, i) => (
              <li key={m.id}>
                <Reveal delay={i * 0.06}>
                  <figure className="group">
                    <div className="overflow-hidden border border-smoke">
                      {m.photoUrl ? (
                        <div className="relative aspect-[3/4] grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0">
                          <Image src={m.photoUrl} alt={m.name} fill sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw" className="object-cover" />
                        </div>
                      ) : (
                        <PhotoPlaceholder label={a.portraitPending} className="aspect-[3/4] grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0" />
                      )}
                    </div>
                    <figcaption className="mt-4">
                      <p className="font-semibold">{m.name}</p>
                      <p className="eyebrow mt-1">{memberRole(lang, m.role)}</p>
                    </figcaption>
                  </figure>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Discografía destacada */}
      <section className="container-site py-24 md:py-32" aria-labelledby="disco">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <h2 id="disco" className="display text-5xl md:text-7xl">{a.discography}</h2>
          <ButtonLink href="/music" variant="outline" size="sm">{t.common.seeAll}</ButtonLink>
        </div>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {releases.slice(0, 3).map((r) => (
            <li key={r.slug}>
              <Link href={`/music#${r.slug}`} className="group block">
                <div className="overflow-hidden"><CoverArt seed={r.slug} title={r.title} src={r.coverImageUrl} className="transition-transform duration-700 group-hover:scale-105" /></div>
                <p className="mt-3 font-semibold group-hover:text-ember">{r.title}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Prensa y contrataciones */}
      <section className="border-t border-smoke bg-coal py-24 md:py-32" aria-labelledby="prensa">
        <div className="container-site grid gap-12 md:grid-cols-2">
          <div>
            <h2 id="prensa" className="display text-5xl md:text-7xl">{a.press[0]}<br />{a.press[1]}</h2>
            <SocialLinks className="mt-10" pendingLabel={t.social.pending} />
          </div>
          <dl className="grid gap-px self-end border border-smoke bg-smoke">
            {[
              { label: a.booking, email: siteConfig.contact.booking, person: siteConfig.contact.bookingContact },
              { label: a.pressMedia, email: siteConfig.contact.press, person: null },
            ].map(({ label, email, person }) => (
              <div key={label} className="bg-coal p-6">
                <dt className="eyebrow">{label}</dt>
                <dd className="mt-2 text-lg [overflow-wrap:anywhere]">
                  {email ? <a href={`mailto:${email}`} className="hover:text-ember">{email}</a> : <span className="text-iron">{t.common.pendingEmail}</span>}
                  {person && <span className="mt-1 block text-sm text-fog">{person} · {a.manager}</span>}
                </dd>
              </div>
            ))}
            <div className="bg-coal p-6">
              <dt className="eyebrow">{a.epk}</dt>
              <dd className="mt-3">
                <a href={siteConfig.epkUrl} download className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-bone hover:text-ember">
                  <Download className="h-4 w-4" aria-hidden /> {a.epkDownload}
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </>
  );
}
