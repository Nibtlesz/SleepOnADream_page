import type { Metadata } from "next";
import { ShowRow } from "@/components/tour/ShowRow";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { PageHeader } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";
import { getI18n, pageAlternates } from "@/i18n/server";
import { getShows } from "@/server/queries/content";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.tour.title, description: t.meta.tour.description, alternates: await pageAlternates("/tour") };
}

export default async function TourPage() {
  const { t } = await getI18n();
  const { upcoming, past } = await getShows();

  // Datos estructurados para que los buscadores muestren los eventos.
  const jsonLd = upcoming
    .filter((s) => !s.isSample)
    .map((s) => ({
      "@context": "https://schema.org",
      "@type": "MusicEvent",
      name: `${siteConfig.name} ${t.tour.in} ${s.city}`,
      startDate: s.startsAt,
      eventStatus: s.status === "CANCELLED" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
      location: { "@type": "Place", name: s.venue, address: `${s.city}, ${s.state}, MX` },
      performer: { "@type": "MusicGroup", name: siteConfig.name },
      ...(s.ticketUrl ? { offers: { "@type": "Offer", url: s.ticketUrl } } : {}),
    }));

  return (
    <>
      {jsonLd.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      )}
      <PageHeader eyebrow={t.tour.eyebrow} title="Tour" intro={t.tour.intro} />
      <section className="container-site py-16 md:py-24" aria-labelledby="upcoming">
        <h2 id="upcoming" className="eyebrow mb-6">{t.tour.upcoming} ({upcoming.length})</h2>
        {upcoming.length ? (
          <ul className="border-t border-smoke">
            {upcoming.map((s) => <ShowRow key={s.id} show={s} detailed />)}
          </ul>
        ) : (
          <p className="text-mist">{t.tour.none}</p>
        )}
        <div className="mt-16 grid gap-6 border border-smoke bg-coal p-8 md:grid-cols-2 md:items-center md:p-12">
          <div>
            <p className="display text-3xl md:text-4xl">{t.tour.presaleTitle}</p>
            <p className="mt-2 text-sm text-fog">{t.tour.presaleText}</p>
          </div>
          <NewsletterForm />
        </div>
      </section>

      {past.length > 0 && (
        <section className="border-t border-smoke bg-coal py-16 md:py-24" aria-labelledby="history">
          <div className="container-site">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between">
                <h2 id="history" className="display text-4xl md:text-5xl">{t.tour.history}</h2>
                <span className="eyebrow group-open:hidden">{t.tour.show} ({past.length})</span>
                <span className="eyebrow hidden group-open:inline">{t.tour.hide}</span>
              </summary>
              <ul className="mt-8 border-t border-smoke">
                {past.map((s) => <ShowRow key={s.id} show={s} past />)}
              </ul>
            </details>
          </div>
        </section>
      )}
    </>
  );
}
