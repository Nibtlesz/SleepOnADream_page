"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { categoryName } from "@/i18n";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";
import type { Category, Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";

type Sort = "featured" | "price-asc" | "price-desc";

export function CatalogGrid({ products, categories }: { products: Product[]; categories: Category[] }) {
  const { t } = useI18n();
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("featured");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const visible = useMemo(() => {
    let list = category === "all" ? products : products.filter((p) => p.category.slug === category);
    if (onlyAvailable) list = list.filter((p) => p.status === "ACTIVE" && p.variants.some((v) => v.stock > 0));
    if (sort === "price-asc") list = [...list].sort((a, b) => a.basePrice - b.basePrice);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.basePrice - a.basePrice);
    return list;
  }, [products, category, sort, onlyAvailable]);

  // Solo categorías que tienen productos a la venta (sin pestañas vacías).
  const used = new Set(products.map((p) => p.category.slug));
  const tabs = [
    { slug: "all", name: t.store.all },
    ...categories.filter((c) => used.has(c.slug)).map((c) => ({ ...c, name: categoryName(t, c.slug, c.name) })),
  ];

  return (
    <>
      <div className="sticky top-16 z-30 -mx-5 mb-10 border-y border-smoke bg-ink/90 px-5 backdrop-blur-md md:top-20 md:-mx-10 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4 py-3">
          <div className="-mx-1 flex gap-1 overflow-x-auto" role="tablist" aria-label={t.store.categories}>
            {tabs.map((c) => (
              <button
                key={c.slug}
                type="button"
                role="tab"
                aria-selected={category === c.slug}
                onClick={() => setCategory(c.slug)}
                className={cn(
                  "h-9 shrink-0 px-4 text-[0.68rem] font-semibold uppercase tracking-[0.18em] transition-colors",
                  category === c.slug ? "bg-bone text-ink" : "text-mist hover:text-bone",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-5 text-xs text-mist">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" className="accent-ember" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
              {t.store.onlyAvailable}
            </label>
            <label className="flex items-center gap-2">
              <span className="sr-only sm:not-sr-only">{t.store.sort}</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-9 border border-smoke bg-coal px-2 text-xs text-bone">
                <option value="featured">{t.store.sortFeatured}</option>
                <option value="price-asc">{t.store.sortAsc}</option>
                <option value="price-desc">{t.store.sortDesc}</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{visible.length} {t.store.products}</p>
      <motion.ul layout className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {visible.map((p) => (
            <motion.li
              key={p.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35 }}
            >
              <ProductCard product={p} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
      {visible.length === 0 && <p className="py-20 text-center text-mist">{t.store.emptyFilter}</p>}
    </>
  );
}
