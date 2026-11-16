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
  const channels = [
    [t.contact.channels.booking, siteConfig.contact.booking],
    [t.contact.channels.press, siteConfig.contact.press],
    [t.contact.channels.store, siteConfig.contact.store],
  ] as const;

  return (
    <>
      <PageHeader eyebrow={t.contact.eyebrow} title={t.nav.contact} intro={t.contact.intro} />
      <div className="container-site grid gap-16 py-16 md:py-24 lg:grid-cols-12">
        <section className="lg:col-span-7" aria-label={t.contact.form}>
          <ContactForm />
        </section>
        <aside className="space-y-12 lg:col-span-4 lg:col-start-9">
          <dl className="space-y-6">
            {channels.map(([label, email]) => (
              <div key={label} className="border-b border-smoke pb-6">
                <dt className="eyebrow">{label}</dt>
                <dd className="mt-2">
                  {email ? <a className="text-lg hover:text-ember" href={`mailto:${email}`}>{email}</a> : <span className="text-iron">{t.common.pendingEmail}</span>}
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
