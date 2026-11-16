import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2, Clock, Package, XCircle } from "lucide-react";
import { PaymentInstructionsCard } from "@/components/checkout/PaymentInstructionsCard";
import { ButtonLink } from "@/components/ui/Button";
import { MX_STATES } from "@/config/store";
import { fill } from "@/i18n";
import { INTL_LOCALE } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { formatDate, formatMXN, orderNumber } from "@/lib/format";
import type { OrderStatus } from "@/lib/orders";
import { orders } from "@/server/orders/repository";

/**
 * Página privada y personal: no se prerenderiza. Se permite que la navegación
 * espere al servidor (el header usa la ruta actual, que aquí solo existe en runtime).
 */
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.order, robots: { index: false, follow: false } };
}

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
export default function OrderPage({ params }: PageProps<"/[lang]/checkout/pedido/[token]">) {
  return (
    <div className="container-site pt-28 pb-24 md:pt-36">
      <Suspense fallback={<div className="h-[32rem] animate-pulse bg-coal" aria-busy />}>
        <OrderDetail params={params} />
      </Suspense>
    </div>
  );
}

async function OrderDetail({ params }: { params: PageProps<"/[lang]/checkout/pedido/[token]">["params"] }) {
  const { token } = await params;
  const { lang, t } = await getI18n();
  const locale = INTL_LOCALE[lang];
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) notFound();
  const order = await orders.findByAccessToken(token);
  if (!order) notFound();

  const Icon = STATUS_ICON[order.status] ?? Clock;
  const paid = order.status !== "PENDING_PAYMENT" && order.status !== "CANCELLED";
  const state = MX_STATES.find(([k]) => k === order.address.state)?.[1] ?? order.address.state;

  return (
    <>
      <nav aria-label={t.checkout.stepsNav} className="mb-10 md:mb-14">
        <ol className="grid grid-cols-6 gap-1.5 md:gap-3">
          {t.checkout.steps.map((s, i) => (
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
          <p className="eyebrow mt-6">{t.order.number} {orderNumber(order.number)}</p>
          <h1 className="display mt-3 text-5xl md:text-7xl">
            {paid ? fill(t.order.thanks, { name: order.customerName.split(" ")[0] }) : order.status === "CANCELLED" ? t.order.cancelled : t.order.waiting}
          </h1>
          <p className="mt-5 max-w-xl text-mist">
            {paid
              ? fill(t.order.paidText, { email: order.email })
              : order.status === "CANCELLED"
                ? t.order.cancelledText
                : order.paymentInstructions
                  ? t.order.pendingInstructions
                  : order.reservedUntil
                    ? fill(t.order.reservedUntil, { date: formatDate(order.reservedUntil, { hour: "2-digit", minute: "2-digit" }, locale) })
                    : t.order.reservedPending}
          </p>
          {order.status === "PENDING_PAYMENT" && order.paymentInstructions && (
            <PaymentInstructionsCard instructions={order.paymentInstructions} />
          )}
          {order.paymentMethod === "test" && (
            <p className="mt-4 inline-block border border-dashed border-ember/60 px-3 py-1.5 text-xs text-ember">
              {t.order.testPayment}
            </p>
          )}

          <dl className="mt-10 grid gap-px border border-smoke bg-smoke sm:grid-cols-2">
            {[
              [t.order.status, t.order.statusLabel[order.status]],
              [t.order.date, formatDate(order.createdAt, { hour: "2-digit", minute: "2-digit" }, locale)],
              [t.order.payment, t.order.methodLabel[order.paymentMethod]],
              [t.order.shipping, order.shippingRateName],
            ].map(([k, v]) => (
              <div key={k} className="bg-coal p-5">
                <dt className="eyebrow">{k}</dt>
                <dd className="mt-1.5 text-sm">{v}</dd>
              </div>
            ))}
            <div className="bg-coal p-5 sm:col-span-2">
              <dt className="eyebrow">{t.order.address}</dt>
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
            <ButtonLink href="/store">{t.order.keepShopping}</ButtonLink>
            <ButtonLink href="/contact" variant="outline">{t.order.questions}</ButtonLink>
          </div>
          <p className="mt-6 text-xs text-fog">{t.order.saveLink}</p>
        </section>

        <aside className="lg:col-span-5" aria-label={t.order.items}>
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
              <div className="flex justify-between"><dt className="text-mist">{t.order.subtotal}</dt><dd className="tabular-nums">{formatMXN(order.subtotal)}</dd></div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-ember"><dt>{t.order.discount} {order.discountCode && `(${order.discountCode})`}</dt><dd className="tabular-nums">−{formatMXN(order.discountTotal)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-mist">{t.order.shipping}</dt><dd className="tabular-nums">{order.shippingTotal === 0 ? t.order.free : formatMXN(order.shippingTotal)}</dd></div>
              <div className="flex items-baseline justify-between border-t border-smoke pt-3">
                <dt className="font-semibold">{t.order.total}</dt>
                <dd className="text-2xl font-semibold tabular-nums">{formatMXN(order.total)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </>
  );
}
