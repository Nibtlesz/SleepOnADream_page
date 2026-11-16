"use client";

import { useActionState, useState } from "react";
import { addShipment, changeOrderStatus } from "@/app/admin/actions/orders";
import { CARRIERS } from "@/lib/order-flow";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/orders";
import { Field, FormMessage, SubmitButton, type ActionState } from "./forms";

export function StatusForm({ orderId, options }: { orderId: string; options: OrderStatus[] }) {
  const [state, action] = useActionState<ActionState, FormData>(changeOrderStatus, {});
  const [to, setTo] = useState<OrderStatus | "">("");
  if (!options.length) return <p className="text-sm text-fog">Este pedido ya no admite cambios de estado.</p>;
  return (
    <form
      action={action}
      className="space-y-4"
      onSubmit={(e) => {
        if ((to === "CANCELLED" || to === "REFUNDED") && !window.confirm(`¿Marcar el pedido como "${ORDER_STATUS_LABEL[to]}"? No se puede deshacer.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <FormMessage state={state} />
      <Field label="Nuevo estado" name="to">
        <select id="to" name="to" value={to} onChange={(e) => setTo(e.target.value as OrderStatus)} className="field" required>
          <option value="">Selecciona</option>
          {options.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
        </select>
      </Field>
      {to === "REFUNDED" && (
        <div className="space-y-2 border border-ember/40 p-3 text-xs text-mist">
          <p>El reembolso del dinero se hace en Mercado Pago; aquí solo se registra.</p>
          <label className="flex items-center gap-2"><input type="checkbox" name="restock" className="accent-ember" /> Regresar las piezas al inventario</label>
        </div>
      )}
      <Field label="Nota interna (opcional)" name="note">
        <input id="note" name="note" className="field" maxLength={500} />
      </Field>
      <SubmitButton>Actualizar estado</SubmitButton>
    </form>
  );
}

export function ShipmentForm({ orderId }: { orderId: string }) {
  const [state, action] = useActionState<ActionState, FormData>(addShipment, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="orderId" value={orderId} />
      <FormMessage state={state} />
      <Field label="Paquetería" name="carrier" error={e.carrier}>
        <select id="carrier" name="carrier" className="field" defaultValue="">
          <option value="" disabled>Selecciona</option>
          {CARRIERS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Número de guía" name="trackingNumber" error={e.trackingNumber}>
        <input id="trackingNumber" name="trackingNumber" className="field font-mono" />
      </Field>
      <Field label="Enlace de rastreo (opcional)" name="trackingUrl" error={e.trackingUrl}>
        <input id="trackingUrl" name="trackingUrl" type="url" className="field" placeholder="https://" />
      </Field>
      <SubmitButton>Registrar envío y avisar al cliente</SubmitButton>
    </form>
  );
}
