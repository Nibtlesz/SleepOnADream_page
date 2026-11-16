"use client";

import { Plus, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { saveProduct } from "@/app/admin/actions/products";
import { Field, FormMessage, SubmitButton, type ActionState } from "./forms";

export interface ProductFormData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  basePrice: number;
  compareAt: number | null;
  status: "DRAFT" | "ACTIVE" | "COMING_SOON" | "ARCHIVED";
  art: string | null;
  isExclusive: boolean;
  isBundle: boolean;
  images: Array<{ url: string; alt: string }>;
  related: string[];
  variants: Array<{ id?: string; sku: string; size: string | null; color: string | null; price: number | null; stock: number }>;
}

interface Row {
  key: string;
  id?: string;
  sku: string;
  size: string;
  color: string;
  price: string;
  stock: string;
  originalStock?: number;
}

const ART = ["tee", "hoodie", "cap", "vinyl", "cd", "patch", "tote", "bundle"];
const STATUS = [
  ["ACTIVE", "Activo (a la venta)"],
  ["COMING_SOON", "Próximamente"],
  ["DRAFT", "Borrador (oculto)"],
  ["ARCHIVED", "Archivado (oculto)"],
] as const;
const toPesos = (c: number | null) => (c == null ? "" : String(c / 100));

export function ProductForm({
  product,
  categories,
  allProducts,
}: {
  product: ProductFormData;
  categories: Array<{ id: string; name: string }>;
  allProducts: Array<{ id: string; name: string }>;
}) {
  const [state, action] = useActionState<ActionState, FormData>(saveProduct, {});
  const e = state.errors ?? {};
  const [rows, setRows] = useState<Row[]>(() =>
    product.variants.map((v, i) => ({
      key: v.id ?? `n${i}`,
      id: v.id,
      sku: v.sku,
      size: v.size ?? "",
      color: v.color ?? "",
      price: toPesos(v.price),
      stock: String(v.stock),
      originalStock: v.id ? v.stock : undefined,
    })),
  );
  const update = (key: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const variantsJson = JSON.stringify(
    rows.map((r) => ({
      id: r.id,
      sku: r.sku,
      size: r.size || null,
      color: r.color || null,
      price: r.price ? Math.round(Number(r.price) * 100) : null,
      stock: Math.max(0, Number.parseInt(r.stock || "0", 10) || 0),
      originalStock: r.originalStock,
    })),
  );

  return (
    <form action={action} className="space-y-8">
      {product.id && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="variants" value={variantsJson} />
      <FormMessage state={state} />

      <section className="grid gap-5 border border-smoke bg-coal p-5 md:grid-cols-2">
        <Field label="Nombre" name="name" error={e.name}>
          <input id="name" name="name" defaultValue={product.name} required className="field" />
        </Field>
        <Field label="URL (slug)" name="slug" error={e.slug} hint="Se genera del nombre si lo dejas vacío.">
          <input id="slug" name="slug" defaultValue={product.slug} className="field" placeholder="playera-logo" />
        </Field>
        <Field label="Descripción" name="description" error={e.description} className="md:col-span-2">
          <textarea id="description" name="description" defaultValue={product.description} rows={4} className="field" />
        </Field>
        <Field label="Categoría" name="categoryId" error={e.categoryId}>
          <select id="categoryId" name="categoryId" defaultValue={product.categoryId} className="field">
            <option value="">Selecciona</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Estado" name="status">
          <select id="status" name="status" defaultValue={product.status} className="field">
            {STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Precio (MXN, IVA incluido)" name="basePrice" error={e.basePrice}>
          <input id="basePrice" name="basePrice" inputMode="decimal" defaultValue={toPesos(product.basePrice)} className="field" />
        </Field>
        <Field label="Precio anterior (opcional)" name="compareAt" hint="Se muestra tachado como oferta.">
          <input id="compareAt" name="compareAt" inputMode="decimal" defaultValue={toPesos(product.compareAt)} className="field" />
        </Field>
        <div className="flex flex-wrap gap-6 text-sm md:col-span-2">
          <label className="flex items-center gap-2"><input type="checkbox" name="isExclusive" defaultChecked={product.isExclusive} className="accent-ember" /> Exclusivo</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="isBundle" defaultChecked={product.isBundle} className="accent-ember" /> Paquete</label>
        </div>
      </section>

      <section className="border border-smoke bg-coal p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="eyebrow text-mist">Variantes e inventario</h2>
          <button
            type="button"
            onClick={() => setRows((rs) => [...rs, { key: crypto.randomUUID(), sku: "", size: "", color: "", price: "", stock: "0" }])}
            className="inline-flex items-center gap-1 text-xs text-mist hover:text-bone"
          >
            <Plus className="h-3.5 w-3.5" /> Agregar variante
          </button>
        </div>
        {e.variants && <p className="mb-3 text-xs text-ember">{e.variants}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-[0.65rem] uppercase tracking-[0.14em] text-fog">
                <th className="pb-2 font-semibold">SKU</th>
                <th className="pb-2 font-semibold">Talla</th>
                <th className="pb-2 font-semibold">Color</th>
                <th className="pb-2 font-semibold">Precio especial</th>
                <th className="pb-2 font-semibold">Inventario</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.key}>
                  <td className="pr-2 pb-2"><input aria-label={`SKU variante ${i + 1}`} value={r.sku} onChange={(ev) => update(r.key, { sku: ev.target.value })} className="field py-2 uppercase" /></td>
                  <td className="pr-2 pb-2"><input aria-label={`Talla variante ${i + 1}`} value={r.size} onChange={(ev) => update(r.key, { size: ev.target.value })} className="field py-2" placeholder="M" /></td>
                  <td className="pr-2 pb-2"><input aria-label={`Color variante ${i + 1}`} value={r.color} onChange={(ev) => update(r.key, { color: ev.target.value })} className="field py-2" placeholder="Negro" /></td>
                  <td className="pr-2 pb-2"><input aria-label={`Precio variante ${i + 1}`} inputMode="decimal" value={r.price} onChange={(ev) => update(r.key, { price: ev.target.value })} className="field py-2" placeholder="—" /></td>
                  <td className="pr-2 pb-2">
                    <input aria-label={`Inventario variante ${i + 1}`} type="number" min={0} value={r.stock} onChange={(ev) => update(r.key, { stock: ev.target.value })} className={`field py-2 tabular-nums ${Number(r.stock) <= 3 ? "border-ember/60" : ""}`} />
                  </td>
                  <td className="pb-2">
                    <button type="button" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} className="grid h-9 w-9 place-items-center text-fog hover:text-ember" aria-label={`Quitar variante ${i + 1}`} disabled={rows.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-fog">El inventario se ajusta por diferencia: si hay ventas mientras editas, no se pierden.</p>
      </section>

      <section className="grid gap-5 border border-smoke bg-coal p-5 md:grid-cols-2">
        <Field label="Fotografías" name="images" hint="Una por línea: https://url-de-la-imagen | texto alternativo" className="md:col-span-2">
          <textarea id="images" name="images" rows={3} defaultValue={product.images.map((i) => `${i.url} | ${i.alt}`).join("\n")} className="field font-mono text-xs" />
        </Field>
        <Field label="Ilustración provisional (sin fotos)" name="art">
          <select id="art" name="art" defaultValue={product.art ?? "tee"} className="field">
            {ART.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
        <fieldset>
          <legend className="eyebrow mb-2">Productos relacionados</legend>
          <div className="max-h-40 space-y-1 overflow-y-auto border border-smoke p-3 text-sm">
            {allProducts.filter((p) => p.id !== product.id).map((p) => (
              <label key={p.id} className="flex items-center gap-2">
                <input type="checkbox" name="related" value={p.id} defaultChecked={product.related.includes(p.id)} className="accent-ember" /> {p.name}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <div className="flex justify-end">
        <SubmitButton>{product.id ? "Guardar cambios" : "Crear producto"}</SubmitButton>
      </div>
    </form>
  );
}
