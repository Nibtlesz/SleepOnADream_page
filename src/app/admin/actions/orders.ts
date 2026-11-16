"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/components/admin/forms";
import { getDb } from "@/lib/db";
import { orderNumber } from "@/lib/format";
import { CARRIERS, MANUAL_TRANSITIONS } from "@/lib/order-flow";
import type { OrderStatus } from "@/lib/orders";
import { firstErrors } from "@/lib/validation/checkout";
import { audit } from "@/server/audit";
import { assertAdmin } from "@/server/auth/dal";
import { orders } from "@/server/orders/repository";
import { CATALOG_TAG } from "@/server/queries/catalog";
import { fill } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { sendEmail } from "@/server/services/email";

const statusSchema = z.object({
  orderId: z.string().min(1),
  to: z.enum(["PENDING_PAYMENT", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
  note: z.string().trim().max(500).optional(),
  restock: z.literal("on").optional(),
});

export async function changeOrderStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await assertAdmin("orders");
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: "Datos inválidos." };
  const { orderId, to, note, restock } = parsed.data;
  const db = getDb();
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { message: "Pedido no encontrado." };
  const from = order.status as OrderStatus;
  if (!MANUAL_TRANSITIONS[from].includes(to)) return { message: `No se puede pasar de ${from} a ${to}.` };

  if (to === "CANCELLED") {
    // Libera el inventario apartado (mismo camino que la expiración automática).
    await orders.cancelPending(orderId, note || "Cancelado desde el panel");
    await db.orderStatusChange.updateMany({ where: { orderId, to: "CANCELLED", actorId: null }, data: { actorId: user.id } });
  } else {
    await db.$transaction(async (tx) => {
      const res = await tx.order.updateMany({ where: { id: orderId, status: from }, data: { status: to } });
      if (res.count !== 1) throw new Error("El pedido cambió mientras lo editabas. Recarga la página.");
      if (to === "REFUNDED" && restock === "on") {
        for (const item of order.items) {
          await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        }
      }
      await tx.orderStatusChange.create({ data: { orderId, from, to, note: note || null, actorId: user.id } });
    });
  }

  await audit(user, "order.status_change", "Order", orderId, { from, to, note, restock: restock === "on" });
  if (to === "CANCELLED" || restock === "on") updateTag(CATALOG_TAG);
  if (to === "DELIVERED") {
    const mail = getDictionary(isLocale(order.locale) ? order.locale : "es").emails;
    await sendEmail({ to: order.email, subject: fill(mail.deliveredSubject, { number: orderNumber(order.number) }), text: mail.deliveredText });
  }
  revalidatePath(`/admin/pedidos/${orderId}`);
  return {
    ok: true,
    message: to === "REFUNDED" ? "Marcado como reembolsado. Recuerda emitir el reembolso en Mercado Pago." : "Estado actualizado.",
  };
}

const shipmentSchema = z.object({
  orderId: z.string().min(1),
  carrier: z.enum(CARRIERS, { error: "Elige la paquetería" }),
  trackingNumber: z.string().trim().min(4, "Número de guía inválido").max(60),
  trackingUrl: z.union([z.url({ protocol: /^https$/, error: "Debe ser un enlace https" }), z.literal("")]).optional(),
});

export async function addShipment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await assertAdmin("orders");
  const parsed = shipmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: "Revisa los datos de la guía.", errors: firstErrors(parsed.error) };
  const { orderId, carrier, trackingNumber, trackingUrl } = parsed.data;
  const db = getDb();
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { message: "Pedido no encontrado." };
  if (!["PAID", "PREPARING", "SHIPPED"].includes(order.status)) return { message: "Solo se pueden enviar pedidos pagados." };

  const shipment = await db.$transaction(async (tx) => {
    const s = await tx.shipment.create({ data: { orderId, carrier, trackingNumber, trackingUrl: trackingUrl || null } });
    if (order.status !== "SHIPPED") {
      await tx.order.update({ where: { id: orderId }, data: { status: "SHIPPED" } });
      await tx.orderStatusChange.create({ data: { orderId, from: order.status, to: "SHIPPED", note: `${carrier} ${trackingNumber}`, actorId: user.id } });
    }
    return s;
  });

  // El correo va en el idioma en que la persona compró.
  const mail = getDictionary(isLocale(order.locale) ? order.locale : "es").emails;
  await sendEmail({
    to: order.email,
    subject: fill(mail.shippedSubject, { number: orderNumber(order.number) }),
    text: fill(mail.shippedText, { carrier, tracking: trackingNumber }) + (trackingUrl ? `\n${fill(mail.trackingLine, { url: trackingUrl })}` : ""),
  });
  await db.shipment.update({ where: { id: shipment.id }, data: { notifiedAt: new Date() } });
  await audit(user, "order.shipment_add", "Order", orderId, { carrier, trackingNumber });
  revalidatePath(`/admin/pedidos/${orderId}`);
  return { ok: true, message: "Guía registrada y cliente notificado por correo." };
}
