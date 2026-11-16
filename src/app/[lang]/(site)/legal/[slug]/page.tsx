import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";
import { getI18n } from "@/i18n/server";

type LegalSlug = (typeof siteConfig.legal)[number]["slug"];
const isLegalSlug = (s: string): s is LegalSlug => siteConfig.legal.some((l) => l.slug === s);

export function generateStaticParams() {
  return siteConfig.legal.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/legal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { t } = await getI18n();
  return { title: isLegalSlug(slug) ? t.legal[slug] : t.legal.eyebrow };
}

/**
 * Documentos legales requeridos para comercio electrónico en México
 * (LFPDPPP, Ley Federal de Protección al Consumidor / NOM-247-SE).
 * El texto definitivo debe redactarlo o validarlo un asesor legal.
 */
export default function LegalPage({ params }: PageProps<"/[lang]/legal/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy />}>
      <LegalContent params={params} />
    </Suspense>
  );
}

async function LegalContent({ params }: { params: PageProps<"/[lang]/legal/[slug]">["params"] }) {
  const { slug } = await params;
  if (!isLegalSlug(slug)) notFound();
  const { t } = await getI18n();
  return (
    <>
      <PageHeader eyebrow={t.legal.eyebrow} title={t.legal[slug]} />
      <div className="container-site max-w-3xl py-16 md:py-24">
        <p className="border-l-2 border-dashed border-ember/60 pl-4 text-mist italic">{t.legal.pending}</p>
      </div>
    </>
  );
}
