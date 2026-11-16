import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2, Clock, Package, XCircle } from "lucide-react";
import { PaymentInstructionsCard } from "@/components/checkout/PaymentInstructionsCard";
import { ButtonLink } from "@/components/ui/Button";
import { MX_STATES } from "@/config/store";
import { formatDate, formatMXN, orderNumber } from "@/lib/format";
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, type OrderStatus } from "@/lib/orders";
import { orders } from "@/server/orders/repository";

/**
 * Página privada y personal: no se prerenderiza. Se permite que la navegación
 * espere al servidor (el header usa la ruta actual, que aquí solo existe en runtime).
 */
export const instant = false;

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false, follow: false } };

const STATUS_ICON: Partial<Record<OrderStatus, typeof CheckCircle2>> = {
  PENDING_PAYMENT: Clock,
  PAID: CheckCircle2,
  PREPARING: Package,
  SHIPPED: Package,
  DELIVERED: CheckCircle2,
  CANCELLED: XCircle,
  REFUNDED: XCircle,
};

/** Paso 6 — Confirmación. Se accede con un token aleatorio, no con el número de pedido. */
export default function OrderPage({ params }: PageProps<"/checkout/pedido/[token]">) {
  return (
    <div className="container-site pt-28 pb-24 md:pt-36">
      <Suspense fallback={<div className="h-[32rem] animate-pulse bg-coal" aria-busy />}>
        <OrderDetail params={params} />
      </Suspense>
    </div>
  );
}

async function OrderDetail({ params }: { params: PageProps<"/checkout/pedido/[token]">["params"] }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) notFound();
  const order = await orders.findByAccessToken(token);
  if (!order) notFound();

  const Icon = STATUS_ICON[order.status] ?? Clock;
  const paid = order.status !== "PENDING_PAYMENT" && order.status !== "CANCELLED";
  const state = MX_STATES.find(([k]) => k === order.address.state)?.[1] ?? order.address.state;

  return (
    <>
      <nav aria-label="Pasos del checkout" className="mb-10 md:mb-14">
        <ol className="grid grid-cols-6 gap-1.5 md:gap-3">
          {["Datos", "Dirección", "Envío", "Resumen", "Pago", "Confirmación"].map((s, i) => (
            <li key={s} aria-current={i === 5 ? "step" : undefined}>
              <span className={`block h-1 ${i === 5 ? "bg-bone" : "bg-ember"}`} />
              <span className={`mt-3 hidden text-[0.68rem] font-semibold uppercase tracking-[0.14em] md:block ${i === 5 ? "text-bone" : "text-mist"}`}>{s}</span>
            </li>
          ))}
        </ol>
      </nav>

      <div className="grid gap-12 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <Icon className={`h-12 w-12 ${paid ? "text-ember" : "text-mist"}`} strokeWidth={1.3} aria-hidden />
          <p className="eyebrow mt-6">Pedido {orderNumber(order.number)}</p>
          <h1 className="display mt-3 text-5xl md:text-7xl">
            {paid ? `¡Gracias, ${order.customerName.split(" ")[0]}!` : order.status === "CANCELLED" ? "Pedido cancelado" : "Esperando tu pago"}
          </h1>
          <p className="mt-5 max-w-xl text-mist">
            {paid
              ? `Recibimos tu pago. Enviamos la confirmación a ${order.email} y te avisaremos cuando tu pedido salga con su número de guía.`
              : order.status === "CANCELLED"
                ? "El pago no se completó a tiempo y liberamos el inventario. Puedes intentar de nuevo desde la tienda."
                : order.paymentInstructions
                  ? "Tu pedido está apartado. Completa el pago con las instrucciones de abajo."
                  : `Tu pedido está apartado hasta ${order.reservedUntil ? formatDate(order.reservedUntil, { hour: "2-digit", minute: "2-digit" }) : "que se confirme el pago"}.`}
          </p>
          {order.status === "PENDING_PAYMENT" && order.paymentInstructions && (
            <PaymentInstructionsCard instructions={order.paymentInstructions} />
          )}
          {order.paymentMethod === "test" && (
            <p className="mt-4 inline-block border border-dashed border-ember/60 px-3 py-1.5 text-xs text-ember">
              Pago de prueba: no se realizó ningún cobro.
            </p>
          )}

          <dl className="mt-10 grid gap-px border border-smoke bg-smoke sm:grid-cols-2">
            {[
              ["Estado", ORDER_STATUS_LABEL[order.status]],
              ["Fecha", formatDate(order.createdAt, { hour: "2-digit", minute: "2-digit" })],
              ["Pago", PAYMENT_METHOD_LABEL[order.paymentMethod]],
              ["Envío", order.shippingRateName],
            ].map(([k, v]) => (
              <div key={k} className="bg-coal p-5">
                <dt className="eyebrow">{k}</dt>
                <dd className="mt-1.5 text-sm">{v}</dd>
              </div>
            ))}
            <div className="bg-coal p-5 sm:col-span-2">
              <dt className="eyebrow">Dirección de entrega</dt>
              <dd className="mt-1.5 text-sm text-mist">
                <span className="text-bone">{order.address.recipient}</span>
                <br />
                {order.address.street} {order.address.extNumber}
                {order.address.intNumber ? ` int. ${order.address.intNumber}` : ""}, {order.address.neighborhood}
                <br />
                {order.address.postalCode} {order.address.city}, {state}
              </dd>
            </div>
          </dl>

          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/store">Seguir comprando</ButtonLink>
            <ButtonLink href="/contact" variant="outline">¿Dudas con tu pedido?</ButtonLink>
          </div>
          <p className="mt-6 text-xs text-fog">Guarda este enlace para consultar el estado de tu pedido.</p>
        </section>

        <aside className="lg:col-span-5" aria-label="Productos del pedido">
          <div className="border border-smoke bg-coal p-6 md:p-8">
            <ul className="divide-y divide-smoke">
              {order.items.map((i) => (
                <li key={i.variantId} className="flex justify-between gap-4 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate">{i.productName}</span>
                    <span className="text-xs text-fog">{i.variantLabel} · ×{i.quantity}</span>
                  </span>
                  <span className="tabular-nums">{formatMXN(i.unitPrice * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-smoke pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-mist">Subtotal</dt><dd className="tabular-nums">{formatMXN(order.subtotal)}</dd></div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-ember"><dt>Descuento {order.discountCode && `(${order.discountCode})`}</dt><dd className="tabular-nums">−{formatMXN(order.discountTotal)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-mist">Envío</dt><dd className="tabular-nums">{order.shippingTotal === 0 ? "Gratis" : formatMXN(order.shippingTotal)}</dd></div>
              <div className="flex items-baseline justify-between border-t border-smoke pt-3">
                <dt className="font-semibold">Total</dt>
                <dd className="text-2xl font-semibold tabular-nums">{formatMXN(order.total)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </>
  );
}
