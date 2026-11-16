"use client";

import { Minus, Plus } from "lucide-react";
import { storeConfig } from "@/config/store";
import { useI18n } from "@/i18n/client";

export function QuantityStepper({
  value,
  max,
  onChange,
  label,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
  label: string;
}) {
  const { t } = useI18n();
  const limit = Math.min(max, storeConfig.maxQtyPerItem);
  return (
    <div className="inline-flex h-9 items-center border border-smoke" role="group" aria-label={`${t.product.quantityOf} ${label}`}>
      <button type="button" className="grid h-full w-9 place-items-center text-mist hover:text-bone disabled:opacity-30" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label={t.product.decrease}>
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">{value}</span>
      <button type="button" className="grid h-full w-9 place-items-center text-mist hover:text-bone disabled:opacity-30" onClick={() => onChange(value + 1)} disabled={value >= limit} aria-label={t.product.increase}>
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
