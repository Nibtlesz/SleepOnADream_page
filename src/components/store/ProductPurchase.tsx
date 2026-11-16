"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductArt } from "@/components/ui/Art";
import { Button } from "@/components/ui/Button";
import { storeConfig } from "@/config/store";
import { cn } from "@/lib/cn";
import { formatMXN } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCart } from "@/store/cart";
import { QuantityStepper } from "./QuantityStepper";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "Única"];

/** Galería + selector de variantes (color / talla) + agregar al carrito. */
export function ProductPurchase({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const colors = useMemo(() => [...new Set(product.variants.map((v) => v.color).filter(Boolean))] as string[], [product]);
  const sizes = useMemo(
    () =>
      ([...new Set(product.variants.map((v) => v.size).filter(Boolean))] as string[]).sort(
        (a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b),
      ),
    [product],
  );

  const firstInStock = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const [color, setColor] = useState<string | null>(firstInStock?.color ?? null);
  const [size, setSize] = useState<string | null>(sizes.length > 1 ? null : (firstInStock?.size ?? null));
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const variant = product.variants.find((v) => (v.color ?? null) === color && (v.size ?? null) === size) ?? null;
  const stockFor = (c: string | null, s: string | null) =>
    product.variants.find((v) => (v.color ?? null) === c && (v.size ?? null) === s)?.stock ?? 0;
  const price = variant?.price ?? product.basePrice;
  const purchasable = product.status === "ACTIVE";
  const needsSize = sizes.length > 1 && !size;

  function handleAdd() {
    if (needsSize) return setError("Elige una talla.");
    if (!variant || variant.stock === 0) return setError("Esta combinación está agotada.");
    setError(null);
    add(
      {
        variantId: variant.id,
        productSlug: product.slug,
        name: product.name,
        variantLabel: [variant.color, variant.size].filter(Boolean).join(" / "),
        unitPrice: price,
        art: product.art,
        maxStock: variant.stock,
      },
      qty,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
      {/* Galería */}
      <div className="lg:col-span-7">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border border-smoke sm:col-span-2">
            <ProductArt kind={product.art} color={color} className="aspect-square" />
          </div>
          {colors.filter((c) => c !== color).slice(0, 2).map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)} className="border border-smoke transition-colors hover:border-iron" aria-label={`Ver en ${c}`}>
              <ProductArt kind={product.art} color={c} className="aspect-square" />
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-fog">Ilustración provisional. Se reemplaza por fotografías reales del producto.</p>
      </div>

      {/* Compra */}
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-28">
          <p className="eyebrow">{product.category.name}</p>
          <h1 className="display mt-3 text-5xl md:text-6xl">{product.name}</h1>
          <p className="mt-5 flex items-baseline gap-3 text-2xl tabular-nums">
            {formatMXN(price)}
            {product.compareAt && <span className="text-base text-fog line-through">{formatMXN(product.compareAt)}</span>}
            <span className="text-xs text-fog">MXN · IVA incluido</span>
          </p>

          {colors.length > 0 && (
            <fieldset className="mt-8">
              <legend className="eyebrow mb-3">Color: <span className="text-bone">{color}</span></legend>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={c === color}
                    onClick={() => { setColor(c); setQty(1); }}
                    className={cn("h-10 border px-4 text-xs transition-colors", c === color ? "border-bone text-bone" : "border-smoke text-mist hover:border-iron")}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {sizes.length > 1 && (
            <fieldset className="mt-6">
              <legend className="eyebrow mb-3 flex w-full justify-between">
                <span>Talla{size && <>: <span className="text-bone">{size}</span></>}</span>
              </legend>
              <div className="grid grid-cols-5 gap-2">
                {sizes.map((s) => {
                  const stock = stockFor(color, s);
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={stock === 0}
                      aria-pressed={s === size}
                      aria-label={`Talla ${s}${stock === 0 ? " (agotada)" : ""}`}
                      onClick={() => { setSize(s); setQty(1); setError(null); }}
                      className={cn(
                        "relative h-11 border text-sm transition-colors disabled:cursor-not-allowed disabled:text-iron",
                        s === size ? "border-ember bg-blood/15 text-bone" : "border-smoke text-mist enabled:hover:border-iron",
                      )}
                    >
                      {s}
                      {stock === 0 && <span className="absolute inset-0 m-auto h-px w-3/4 -rotate-12 bg-iron" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <p className="mt-4 h-5 text-xs" aria-live="polite">
            {variant && purchasable && (variant.stock === 0 ? (
              <span className="text-ember">Agotado</span>
            ) : variant.stock <= 3 ? (
              <span className="text-ember">¡Últimas {variant.stock} piezas!</span>
            ) : (
              <span className="text-fog">Disponible</span>
            ))}
          </p>

          {purchasable ? (
            <div className="mt-4 flex gap-3">
              <div className="[&>div]:h-14">
                <QuantityStepper value={qty} max={Math.min(variant?.stock || 1, storeConfig.maxQtyPerItem)} onChange={setQty} label={product.name} />
              </div>
              <Button type="button" size="lg" className="flex-1" onClick={handleAdd} disabled={Boolean(variant && variant.stock === 0)}>
                {added ? <><Check className="h-4 w-4" /> Agregado</> : <><ShoppingBag className="h-4 w-4" /> Agregar al carrito</>}
              </Button>
            </div>
          ) : (
            <p className="mt-4 border border-smoke px-5 py-4 text-sm text-mist">
              {product.status === "COMING_SOON" ? "Próximamente. Suscríbete al newsletter para la preventa." : "No disponible por ahora."}
            </p>
          )}
          {error && <p role="alert" className="mt-3 text-sm text-ember">{error}</p>}

          <div className="mt-10 space-y-4 border-t border-smoke pt-8 text-sm leading-relaxed text-mist">
            <p>{product.description}</p>
            <details className="border-t border-smoke pt-4">
              <summary className="cursor-pointer font-semibold text-bone">Envíos</summary>
              <p className="mt-2 text-fog">Envíos a todo México. Gratis en pedidos desde {formatMXN(storeConfig.freeShippingOver)}. El costo exacto se calcula por estado en el carrito.</p>
            </details>
            <details className="border-t border-smoke pt-4">
              <summary className="cursor-pointer font-semibold text-bone">Guía de tallas</summary>
              <p className="mt-2 text-fog">Tabla de medidas pendiente (se cargará desde el panel).</p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
