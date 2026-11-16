import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";

export function generateStaticParams() {
  return siteConfig.legal.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const doc = siteConfig.legal.find((l) => l.slug === slug);
  return { title: doc?.label ?? "Legal" };
}

/**
 * Documentos legales requeridos para comercio electrónico en México
 * (LFPDPPP, Ley Federal de Protección al Consumidor / NOM-247-SE).
 * El texto definitivo debe redactarlo o validarlo un asesor legal.
 */
export default function LegalPage({ params }: PageProps<"/legal/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy />}>
      <LegalContent params={params} />
    </Suspense>
  );
}

async function LegalContent({ params }: { params: PageProps<"/legal/[slug]">["params"] }) {
  const { slug } = await params;
  const doc = siteConfig.legal.find((l) => l.slug === slug);
  if (!doc) notFound();
  return (
    <>
      <PageHeader eyebrow="Legal" title={doc.label} />
      <div className="container-site max-w-3xl py-16 md:py-24">
        <p className="border-l-2 border-dashed border-ember/60 pl-4 text-mist italic">
          Documento pendiente de redacción y validación por un asesor legal. Debe incluir, entre otros:
          identidad y domicilio del responsable, finalidades del tratamiento de datos, derechos ARCO,
          políticas de cambios, devoluciones y garantías, costos y tiempos de envío, y medios de contacto.
        </p>
      </div>
    </>
  );
}
