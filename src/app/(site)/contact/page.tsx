import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/ContactForm";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { PageHeader } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contacto, contrataciones y prensa de Sleep On a Dream.",
};

const CHANNELS = [
  ["Contrataciones", siteConfig.contact.booking],
  ["Prensa", siteConfig.contact.press],
  ["Tienda / pedidos", siteConfig.contact.store],
] as const;

export default function ContactPage() {
  return (
    <>
      <PageHeader eyebrow="Comunidad" title="Contact" intro="Escríbenos para contrataciones, prensa o dudas sobre tu pedido." />
      <div className="container-site grid gap-16 py-16 md:py-24 lg:grid-cols-12">
        <section className="lg:col-span-7" aria-label="Formulario de contacto">
          <ContactForm />
        </section>
        <aside className="space-y-12 lg:col-span-4 lg:col-start-9">
          <dl className="space-y-6">
            {CHANNELS.map(([label, email]) => (
              <div key={label} className="border-b border-smoke pb-6">
                <dt className="eyebrow">{label}</dt>
                <dd className="mt-2">
                  {email ? <a className="text-lg hover:text-ember" href={`mailto:${email}`}>{email}</a> : <span className="text-iron">Correo pendiente</span>}
                </dd>
              </div>
            ))}
          </dl>
          <div>
            <p className="eyebrow mb-4">Redes</p>
            <SocialLinks size="lg" />
          </div>
          <div>
            <p className="eyebrow mb-4">Newsletter</p>
            <NewsletterForm />
          </div>
        </aside>
      </div>
    </>
  );
}
