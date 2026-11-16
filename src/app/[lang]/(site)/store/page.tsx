import type { Metadata } from "next";
import { Package, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { CatalogGrid } from "@/components/store/CatalogGrid";
import { PhotoPlaceholder } from "@/components/ui/Art";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { storeConfig } from "@/config/store";
import { fill } from "@/i18n";
import { getI18n, pageAlternates } from "@/i18n/server";
import { formatMXN } from "@/lib/format";
import { getCategories, getProducts } from "@/server/queries/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.store.title, description: t.meta.store.description, alternates: await pageAlternates("/store") };
}

const PERK_ICONS = [Truck, ShieldCheck, Package, RotateCcw];

export default async function StorePage() {
  const { t } = await getI18n();
  const PERKS = t.store.perks.map((p, i) => ({
    icon: PERK_ICONS[i],
    title: p.title,
    text: fill(p.text, { amount: formatMXN(storeConfig.freeShippingOver) }),
  }));
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const sample = products.some((p) => p.isSample);

  return (
    <>
      <header className="relative overflow-hidden">
        <PhotoPlaceholder tone="red" label={t.home.campaignImage} className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-transparent" />
        <div className="container-site relative pt-36 pb-16 md:pt-48 md:pb-24">
          <p className="eyebrow mb-5 flex items-center gap-3"><span className="h-px w-8 bg-blood" aria-hidden />{t.store.eyebrow}</p>
          <h1 className="display text-[clamp(3.5rem,12vw,10rem)]">{t.nav.store}</h1>
          <p className="mt-6 max-w-lg text-mist">{t.store.intro}</p>
          {sample && <SampleBadge className="mt-6" label={t.common.sampleCatalog} />}
        </div>
      </header>

      <div className="border-y border-smoke bg-coal">
        <ul className="container-site grid grid-cols-2 gap-x-6 lg:grid-cols-4">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-center gap-4 py-5">
              <Icon className="h-5 w-5 shrink-0 text-ember" strokeWidth={1.5} aria-hidden />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em]">{title}</p>
                <p className="mt-0.5 text-xs text-fog">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="container-site py-12 md:py-16">
        <CatalogGrid products={products} categories={categories} />
      </div>
    </>
  );
}
