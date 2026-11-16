import type { Metadata } from "next";
import Link from "next/link";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { CoverArt, PhotoPlaceholder } from "@/components/ui/Art";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { siteConfig } from "@/config/site";
import { getBandMembers, getReleases } from "@/server/queries/content";

export const metadata: Metadata = {
  title: "About",
  description: "Historia, biografía e integrantes de Sleep On a Dream. Información para prensa y contrataciones.",
};

/** Bloque de texto pendiente: deja claro que el contenido oficial aún no se ha cargado. */
function Pending({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-l-2 border-dashed border-ember/60 pl-4 text-mist italic">{children}</p>
  );
}

export default async function AboutPage() {
  const [members, releases] = await Promise.all([getBandMembers(), getReleases()]);
  return (
    <>
      {/* Apertura editorial */}
      <header className="relative min-h-[80svh] overflow-hidden">
        <PhotoPlaceholder label="Fotografía promocional de ejemplo" className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="container-site relative flex min-h-[80svh] flex-col justify-end pb-16 md:pb-24">
          <p className="eyebrow mb-5 flex items-center gap-3"><span className="h-px w-8 bg-blood" aria-hidden />La banda</p>
          <h1 className="display text-[clamp(3.5rem,12vw,10rem)]">About</h1>
        </div>
      </header>

      {/* Historia */}
      <section className="container-site grid gap-12 py-24 md:grid-cols-12 md:py-32" aria-labelledby="historia">
        <Reveal className="md:col-span-4">
          <h2 id="historia" className="display text-5xl md:text-6xl">Historia</h2>
          <SampleBadge className="mt-4" label="Texto pendiente" />
        </Reveal>
        <Reveal delay={0.1} className="space-y-6 text-lg leading-relaxed md:col-span-7 md:col-start-6">
          <p className="display text-3xl leading-tight text-bone md:text-4xl">
            Aquí irá una frase de apertura de la banda, en sus propias palabras.
          </p>
          <Pending>
            Espacio reservado para la historia de Sleep On a Dream: origen, ciudad, año de formación e hitos.
            No se publica información sin confirmación de la banda.
          </Pending>
        </Reveal>
      </section>

      {/* Galería editorial */}
      <section aria-label="Fotografías promocionales" className="container-site grid grid-cols-2 gap-3 md:grid-cols-12 md:gap-4">
        <PhotoPlaceholder className="col-span-2 aspect-[16/10] md:col-span-8" />
        <PhotoPlaceholder tone="red" className="aspect-[3/4] md:col-span-4 md:aspect-auto" label="En vivo (ejemplo)" />
        <PhotoPlaceholder tone="red" className="aspect-[3/4] md:col-span-4" label="Retrato (ejemplo)" />
        <PhotoPlaceholder className="col-span-2 aspect-[16/10] md:col-span-8 md:aspect-auto" label="Estudio (ejemplo)" />
      </section>

      {/* Biografía oficial */}
      <section className="container-site grid gap-12 py-24 md:grid-cols-12 md:py-32" aria-labelledby="bio">
        <Reveal className="md:col-span-4">
          <h2 id="bio" className="display text-5xl md:text-6xl">Biografía oficial</h2>
        </Reveal>
        <Reveal delay={0.1} className="space-y-5 leading-relaxed md:col-span-7 md:col-start-6">
          <Pending>Biografía oficial pendiente de entrega por la banda o su representación.</Pending>
          <p className="text-sm text-fog">Se podrá editar desde el panel administrativo (Contenido → Banda).</p>
        </Reveal>
      </section>

      {/* Integrantes */}
      <section className="border-y border-smoke bg-coal py-24 md:py-32" aria-labelledby="integrantes">
        <div className="container-site">
          <h2 id="integrantes" className="display mb-12 text-5xl md:text-7xl">Integrantes</h2>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {members.map((m, i) => (
              <li key={m.id}>
                <Reveal delay={i * 0.06}>
                  <figure className="group">
                    <div className="overflow-hidden border border-smoke">
                      <PhotoPlaceholder label="Retrato pendiente" className="aspect-[3/4] grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0" />
                    </div>
                    <figcaption className="mt-4">
                      <p className="font-semibold">{m.name}</p>
                      <p className="eyebrow mt-1">{m.role}</p>
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
          <h2 id="disco" className="display text-5xl md:text-7xl">Discografía</h2>
          <ButtonLink href="/music" variant="outline" size="sm">Ver todo</ButtonLink>
        </div>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {releases.slice(0, 3).map((r) => (
            <li key={r.slug}>
              <Link href={`/music#${r.slug}`} className="group block">
                <div className="overflow-hidden"><CoverArt seed={r.slug} title={r.title} className="transition-transform duration-700 group-hover:scale-105" /></div>
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
            <h2 id="prensa" className="display text-5xl md:text-7xl">Prensa y<br />contrataciones</h2>
            <SocialLinks className="mt-10" />
          </div>
          <dl className="grid gap-px self-end border border-smoke bg-smoke">
            {[
              ["Contrataciones / booking", siteConfig.contact.booking],
              ["Prensa y medios", siteConfig.contact.press],
            ].map(([label, email]) => (
              <div key={label} className="bg-coal p-6">
                <dt className="eyebrow">{label}</dt>
                <dd className="mt-2 text-lg">
                  {email ? <a href={`mailto:${email}`} className="hover:text-ember">{email}</a> : <span className="text-iron">Correo pendiente</span>}
                </dd>
              </div>
            ))}
            <div className="bg-coal p-6">
              <dt className="eyebrow">Kit de prensa (EPK)</dt>
              <dd className="mt-2 text-sm text-iron">Descarga disponible cuando se cargue el material oficial.</dd>
            </div>
          </dl>
        </div>
      </section>
    </>
  );
}
