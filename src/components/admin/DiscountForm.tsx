"use client";

import { useActionState, useState } from "react";
import { createDiscount } from "@/app/admin/actions/discounts";
import { Field, FormMessage, SubmitButton, type ActionState } from "./forms";

export function DiscountForm() {
  const [state, action] = useActionState<ActionState, FormData>(createDiscount, {});
  const [type, setType] = useState("PERCENT");
  const e = state.errors ?? {};
  return (
    <form action={action} className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-3"><FormMessage state={state} /></div>
      <Field label="Código" name="code" error={e.code}>
        <input id="code" name="code" className="field uppercase" placeholder="PREVENTA15" required />
      </Field>
      <Field label="Tipo" name="type">
        <select id="type" name="type" className="field" value={type} onChange={(ev) => setType(ev.target.value)}>
          <option value="PERCENT">Porcentaje</option>
          <option value="FIXED">Monto fijo (MXN)</option>
          <option value="FREE_SHIPPING">Envío gratis</option>
        </select>
      </Field>
      {type !== "FREE_SHIPPING" && (
        <Field label={type === "PERCENT" ? "Porcentaje" : "Monto (MXN)"} name="value" error={e.value}>
          <input id="value" name="value" inputMode="decimal" className="field" required />
        </Field>
      )}
      <Field label="Compra mínima (MXN, opcional)" name="minSubtotal" error={e.minSubtotal}>
        <input id="minSubtotal" name="minSubtotal" inputMode="decimal" className="field" />
      </Field>
      <Field label="Usos máximos (opcional)" name="maxRedemptions" error={e.maxRedemptions}>
        <input id="maxRedemptions" name="maxRedemptions" type="number" min={1} className="field" />
      </Field>
      <Field label="Vence el (opcional)" name="endsAt">
        <input id="endsAt" name="endsAt" type="date" className="field" />
      </Field>
      <div className="flex items-end md:col-span-3 md:justify-end"><SubmitButton>Crear código</SubmitButton></div>
    </form>
  );
}
