"use client";

import { X } from "lucide-react";
import { ProductArt } from "@/components/ui/Art";
import { fill } from "@/i18n";
import { useI18n } from "@/i18n/client";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import { formatMXN } from "@/lib/format";
import { useCart, type CartItem } from "@/store/cart";
import { QuantityStepper } from "./QuantityStepper";

export function CartLine({ item, notice }: { item: CartItem; notice?: string | null }) {
  const { t } = useI18n();
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const color = item.variantLabel.split(" / ").find((p) => !/^(XS|S|M|L|XL|2XL|Única)$/.test(p));
  return (
    <li className="flex gap-4 py-5">
      <Link href={`/store/${item.productSlug}`} className="w-20 shrink-0 border border-smoke sm:w-24">
        <ProductArt kind={item.art} color={color} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/store/${item.productSlug}`} className="block truncate text-sm font-semibold hover:text-ember">
              {item.name}
            </Link>
            {item.variantLabel && <p className="mt-0.5 text-xs text-fog">{item.variantLabel}</p>}
          </div>
          <button type="button" onClick={() => remove(item.variantId)} className="-mt-1 -mr-1 grid h-8 w-8 shrink-0 place-items-center text-fog hover:text-ember" aria-label={fill(t.cart.removeItem, { name: item.name })}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-auto flex items-end justify-between pt-3">
          <QuantityStepper value={item.quantity} max={item.maxStock} label={item.name} onChange={(n) => setQuantity(item.variantId, n)} />
          <p className="text-sm font-semibold tabular-nums">{formatMXN(item.unitPrice * item.quantity)}</p>
        </div>
        {notice && <p className="mt-2 text-xs text-ember">{notice}</p>}
      </div>
    </li>
  );
}
