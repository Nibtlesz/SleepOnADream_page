import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/ContactForm";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { PageHeader } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";
import { getI18n, pageAlternates } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.contact.title, description: t.meta.contact.description, alternates: await pageAlternates("/contact") };
}

export default async function ContactPage() {
  const { t } = await getI18n();
  // Solo se muestran los canales con correo (el de tienda está oculto mientras no exista).
  const channels = [
    { label: t.contact.channels.booking, email: siteConfig.contact.booking, person: siteConfig.contact.bookingContact },
    { label: t.contact.channels.press, email: siteConfig.contact.press, person: null },
    { label: t.contact.channels.store, email: siteConfig.contact.store, person: null },
  ].filter((c): c is typeof c & { email: string } => Boolean(c.email));

  return (
    <>
      <PageHeader eyebrow={t.contact.eyebrow} title={t.nav.contact} intro={t.contact.intro} />
      <div className="container-site grid gap-16 py-16 md:py-24 lg:grid-cols-12">
        <section className="lg:col-span-7" aria-label={t.contact.form}>
          <ContactForm />
        </section>
        <aside className="space-y-12 lg:col-span-4 lg:col-start-9">
          <dl className="space-y-6">
            {channels.map(({ label, email, person }) => (
              <div key={label} className="border-b border-smoke pb-6">
                <dt className="eyebrow">{label}</dt>
                <dd className="mt-2 [overflow-wrap:anywhere]">
                  <a className="text-lg hover:text-ember" href={`mailto:${email}`}>{email}</a>
                  {person && <span className="mt-1 block text-sm text-fog">{person} · {t.about.manager}</span>}
                </dd>
              </div>
            ))}
          </dl>
          <div>
            <p className="eyebrow mb-4">{t.contact.socials}</p>
            <SocialLinks size="lg" pendingLabel={t.social.pending} />
          </div>
          <div>
            <p className="eyebrow mb-4">{t.contact.newsletter}</p>
            <NewsletterForm />
          </div>
        </aside>
      </div>
    </>
  );
}
