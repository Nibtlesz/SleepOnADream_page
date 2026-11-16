import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ShipmentForm, StatusForm } from "@/components/admin/OrderActions";
import { AdminLink, Card, OrderStatusBadge, PageTitle } from "@/components/admin/ui";
import { MX_STATES } from "@/config/store";
import { getDb } from "@/lib/db";
import { formatDate, formatMXN, orderNumber } from "@/lib/format";
import { MANUAL_TRANSITIONS } from "@/lib/order-flow";
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, type OrderStatus, type PaymentInstructions } from "@/lib/orders";
import type { PaymentMethod, ShippingAddress } from "@/lib/validation/checkout";
import { requireAdmin } from "@/server/auth/dal";

export const metadata: Metadata = { title: "Pedido" };

/** Página privada que depende de la sesión: la navegación espera al servidor. */
export const instant = false;

const dt = (d: Date) => formatDate(d.toISOString(), { hour: "2-digit", minute: "2-digit" });

export default async function OrderDetailPage({ params }: PageProps<"/admin/pedidos/[id]">) {
  await requireAdmin("orders");
  const { id } = await params;
  const db = getDb();
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      customer: true,
      payments: { orderBy: { createdAt: "desc" } },
      shipments: { orderBy: { shippedAt: "desc" } },
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();

  const [history, actors] = await Promise.all([
    db.order.findMany({
      where: { customerId: order.customerId, NOT: { id: order.id } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, number: true, status: true, total: true, createdAt: true },
    }),
    db.user.findMany({
      where: { id: { in: order.statusHistory.map((h) => h.actorId).filter((a): a is string => Boolean(a)) } },
      select: { id: true, email: true },
    }),
  ]);
  const address = order.shippingAddress as unknown as ShippingAddress;
  const instructions = order.paymentInstructions as unknown as PaymentInstructions | null;
  const state = MX_STATES.find(([k]) => k === address.state)?.[1] ?? address.state;
  const status = order.status as OrderStatus;
  const canShip = ["PAID", "PREPARING", "SHIPPED"].includes(status);

  return (
    <>
      <AdminLink href="/admin/pedidos" className="text-xs">← Pedidos</AdminLink>
      <div className="mt-4">
        <PageTitle
          title={orderNumber(order.number)}
          eyebrow={dt(order.createdAt)}
          action={<OrderStatusBadge status={status} />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Productos">
            <ul className="divide-y divide-smoke/60 text-sm">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 py-2.5">
                  <span>{i.productName} <span className="text-fog">{i.variantLabel && `· ${i.variantLabel}`} × {i.quantity}</span></span>
                  <span className="tabular-nums">{formatMXN(i.unitPrice * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-smoke pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-fog">Subtotal</dt><dd className="tabular-nums">{formatMXN(order.subtotal)}</dd></div>
              {order.discountTotal > 0 && <div className="flex justify-between"><dt className="text-fog">Descuento {order.discountCodeText && `(${order.discountCodeText})`}</dt><dd className="tabular-nums">−{formatMXN(order.discountTotal)}</dd></div>}
              <div className="flex justify-between"><dt className="text-fog">Envío · {order.shippingRateName}</dt><dd className="tabular-nums">{formatMXN(order.shippingTotal)}</dd></div>
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatMXN(order.total)}</dd></div>
            </dl>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card title="Cliente">
              <p>{order.customer.name}</p>
              <p className="text-sm text-mist">{order.email}</p>
              <p className="text-sm text-mist">{order.customer.phone}</p>
              <p className="mt-2 text-xs text-fog">Compró en {order.locale === "en" ? "inglés" : "español"} · los correos se le envían en ese idioma.</p>
            </Card>
            <Card title="Dirección de envío">
              <address className="text-sm not-italic text-mist">
                <span className="text-bone">{address.recipient}</span><br />
                {address.street} {address.extNumber}{address.intNumber ? ` int. ${address.intNumber}` : ""}, {address.neighborhood}<br />
                {address.postalCode} {address.city}, {state}
                {address.references && <><br /><span className="text-fog">Ref: {address.references}</span></>}
              </address>
            </Card>
          </div>

          <Card title="Pagos">
            <p className="mb-2 text-sm">Método: {PAYMENT_METHOD_LABEL[order.paymentMethod as PaymentMethod] ?? order.paymentMethod}</p>
            {order.payments.length ? (
              <ul className="space-y-1 text-sm">
                {order.payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap justify-between gap-2">
                    <span className="font-mono text-xs">{p.provider} #{p.providerPaymentId}</span>
                    <span className="text-mist">{p.status} · {formatMXN(p.amount)} · {dt(p.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-fog">
                {status === "PENDING_PAYMENT" ? "Aún sin pago confirmado." : order.paymentMethod === "test" ? "Pago de prueba (sin cobro)." : "Sin registros."}
              </p>
            )}
            {status === "PENDING_PAYMENT" && instructions && instructions.kind !== "review" && (
              <p className="mt-2 text-xs text-fog">Referencia entregada al cliente: {instructions.reference ?? "—"}{instructions.expiresAt && ` · vence ${formatDate(instructions.expiresAt, { hour: "2-digit", minute: "2-digit" })}`}</p>
            )}
          </Card>

          <Card title="Historial del pedido">
            <ol className="space-y-2 text-sm">
              {order.statusHistory.map((h) => (
                <li key={h.id} className="flex flex-wrap gap-x-3">
                  <span className="w-40 shrink-0 text-xs text-fog">{dt(h.createdAt)}</span>
                  <span>{h.from ? `${ORDER_STATUS_LABEL[h.from as OrderStatus]} → ` : ""}<strong>{ORDER_STATUS_LABEL[h.to as OrderStatus]}</strong></span>
                  <span className="text-xs text-fog">{h.actorId ? actors.find((a) => a.id === h.actorId)?.email : "sistema"}{h.note && ` · ${h.note}`}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Cambiar estado">
            <StatusForm orderId={order.id} options={MANUAL_TRANSITIONS[status]} />
          </Card>
          <Card title="Envío">
            {order.shipments.length > 0 && (
              <ul className="mb-4 space-y-2 text-sm">
                {order.shipments.map((s) => (
                  <li key={s.id}>
                    <p>{s.carrier} · <span className="font-mono">{s.trackingNumber}</span></p>
                    <p className="text-xs text-fog">
                      {dt(s.shippedAt)}{s.notifiedAt ? " · cliente notificado" : ""}
                      {s.trackingUrl && <> · <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">rastreo <ExternalLink className="h-3 w-3" /></a></>}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {canShip ? <ShipmentForm orderId={order.id} /> : <p className="text-sm text-fog">Disponible cuando el pedido esté pagado.</p>}
          </Card>
          <Card title={`Otros pedidos del cliente (${history.length})`}>
            {history.length ? (
              <ul className="space-y-1.5 text-sm">
                {history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-2">
                    <Link href={`/admin/pedidos/${h.id}`} className="font-mono hover:text-ember">{orderNumber(h.number)}</Link>
                    <span className="text-xs text-fog">{ORDER_STATUS_LABEL[h.status as OrderStatus]}</span>
                    <span className="tabular-nums">{formatMXN(h.total)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-fog">Es su primer pedido.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
