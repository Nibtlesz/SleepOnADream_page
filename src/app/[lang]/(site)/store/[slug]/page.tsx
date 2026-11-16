import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductPurchase } from "@/components/store/ProductPurchase";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { siteConfig } from "@/config/site";
import { categoryName } from "@/i18n";
import { localizePath } from "@/i18n/config";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import { getI18n, pageAlternates } from "@/i18n/server";
import { getProductBySlug, getProducts, getRelatedProducts } from "@/server/queries/catalog";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/store/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: (await getI18n()).t.meta.productNotFound };
  return {
    title: product.name,
    description: product.description.slice(0, 155),
    alternates: await pageAlternates(`/store/${product.slug}`),
  };
}

export default function ProductPage({ params }: PageProps<"/[lang]/store/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

function ProductSkeleton() {
  return (
    <div className="container-site grid gap-10 pt-24 pb-24 md:pt-32 lg:grid-cols-12" aria-busy>
      <div className="aspect-square animate-pulse bg-coal lg:col-span-7" />
      <div className="space-y-4 lg:col-span-5">
        <div className="h-4 w-24 animate-pulse bg-coal" />
        <div className="h-14 w-3/4 animate-pulse bg-coal" />
        <div className="h-8 w-32 animate-pulse bg-coal" />
      </div>
    </div>
  );
}

async function ProductContent({ params }: { params: PageProps<"/[lang]/store/[slug]">["params"] }) {
  const { slug } = await params;
  const { lang, t } = await getI18n();
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product);
  const inStock = product.variants.some((v) => v.stock > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: {
      "@type": "Offer",
      priceCurrency: "MXN",
      price: (product.basePrice / 100).toFixed(2),
      availability: inStock && product.status === "ACTIVE" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${siteConfig.url}${localizePath(lang, `/store/${product.slug}`)}`,
    },
  };

  return (
    <>
      {!product.isSample && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      )}
      <div className="container-site pt-24 pb-24 md:pt-32">
        <nav aria-label={t.product.breadcrumb} className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link href="/store" className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-fog hover:text-bone">
            <ChevronLeft className="h-4 w-4" /> Store / {categoryName(t, product.category.slug, product.category.name)}
          </Link>
          {product.isSample && <SampleBadge label={t.common.sampleProduct} />}
        </nav>
        <ProductPurchase product={product} />
      </div>

      {related.length > 0 && (
        <section className="border-t border-smoke bg-coal py-20" aria-labelledby="related">
          <div className="container-site">
            <h2 id="related" className="display mb-10 text-4xl md:text-5xl">{t.product.related}</h2>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
              {related.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
