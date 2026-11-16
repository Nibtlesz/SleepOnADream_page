import Link from "next/link";
import { ProductArt } from "@/components/ui/Art";
import { formatMXN } from "@/lib/format";
import type { Product } from "@/lib/types";

function badge(product: Product) {
  const stock = product.variants.reduce((a, v) => a + v.stock, 0);
  if (product.status === "COMING_SOON") return "Próximamente";
  if (stock === 0) return "Agotado";
  if (product.compareAt) return "Oferta";
  if (product.isExclusive) return "Exclusivo";
  return null;
}

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const label = badge(product);
  const colors = [...new Set(product.variants.map((v) => v.color).filter(Boolean))] as string[];
  return (
    <Link href={`/store/${product.slug}`} className="group block" prefetch={priority ? true : undefined}>
      <div className="relative overflow-hidden border border-smoke bg-ash transition-colors duration-500 group-hover:border-iron">
        <div className="transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.04]">
          <ProductArt kind={product.art} color={colors[0]} />
        </div>
        {colors[1] && (
          <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden>
            <ProductArt kind={product.art} color={colors[1]} />
          </div>
        )}
        {label && (
          <span className="absolute top-3 left-3 bg-ink/80 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-bone backdrop-blur">
            {label}
          </span>
        )}
        {product.isSample && (
          <span className="absolute right-3 bottom-3 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-ember/80">
            Ejemplo
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 translate-y-full bg-blood py-3 text-center text-[0.65rem] font-semibold uppercase tracking-[0.2em] transition-transform duration-500 group-hover:translate-y-0">
          Ver producto
        </span>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold transition-colors group-hover:text-ember">{product.name}</p>
          <p className="mt-0.5 text-xs text-fog">{product.category.name}</p>
        </div>
        <p className="shrink-0 text-right text-sm tabular-nums">
          {product.compareAt && <span className="mr-2 text-xs text-fog line-through">{formatMXN(product.compareAt)}</span>}
          {formatMXN(product.basePrice)}
        </p>
      </div>
    </Link>
  );
}
