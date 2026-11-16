import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, OrderStatusBadge, PageTitle, tableCls } from "@/components/admin/ui";
import { getDb } from "@/lib/db";
import { formatDate, formatMXN, orderNumber } from "@/lib/format";
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, type OrderStatus } from "@/lib/orders";
import type { PaymentMethod } from "@/lib/validation/checkout";
import { cn } from "@/lib/cn";
import { requireAdmin } from "@/server/auth/dal";

export const metadata: Metadata = { title: "Pedidos" };

/** Página privada que depende de la sesión: la navegación espera al servidor. */
export const instant = false;

const FILTERS: Array<{ key: string; label: string; statuses?: OrderStatus[] }> = [
  { key: "todos", label: "Todos" },
  { key: "por-enviar", label: "Por enviar", statuses: ["PAID", "PREPARING"] },
  { key: "pendientes", label: "Pendientes de pago", statuses: ["PENDING_PAYMENT"] },
  { key: "enviados", label: "Enviados", statuses: ["SHIPPED"] },
  { key: "entregados", label: "Entregados", statuses: ["DELIVERED"] },
  { key: "cancelados", label: "Cancelados / reembolsados", statuses: ["CANCELLED", "REFUNDED"] },
];

export default async function OrdersPage({ searchParams }: PageProps<"/admin/pedidos">) {
  await requireAdmin("orders");
  const sp = await searchParams;
  const filter = FILTERS.find((f) => f.key === sp.estado) ?? FILTERS[0];
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const num = Number(q.replace(/\D/g, ""));

  const db = getDb();
  const [list, counts] = await Promise.all([
    db.order.findMany({
      where: {
        ...(filter.statuses ? { status: { in: filter.statuses } } : {}),
        ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" as const } }, ...(num ? [{ number: num }] : [])] } : {}),
      },
      include: { customer: { select: { name: true } }, _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const countFor = (f: (typeof FILTERS)[number]) =>
    counts.filter((c) => !f.statuses || f.statuses.includes(c.status as OrderStatus)).reduce((a, c) => a + c._count, 0);

  return (
    <>
      <PageTitle title="Pedidos" eyebrow="Tienda" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Filtrar pedidos" className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={`/admin/pedidos?estado=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              aria-current={f.key === filter.key ? "page" : undefined}
              className={cn("px-3 py-2 text-xs transition-colors", f.key === filter.key ? "bg-bone text-ink" : "text-mist hover:text-bone")}
            >
              {f.label} <span className="tabular-nums opacity-60">{countFor(f)}</span>
            </Link>
          ))}
        </nav>
        <form className="flex" role="search">
          <input type="hidden" name="estado" value={filter.key} />
          <label htmlFor="q" className="sr-only">Buscar por correo o folio</label>
          <input id="q" name="q" defaultValue={q} placeholder="Correo o folio" className="field h-10 w-56 py-0" />
          <button className="border border-l-0 border-iron px-4 text-xs text-mist hover:text-bone">Buscar</button>
        </form>
      </div>

      {list.length === 0 ? (
        <EmptyState>No hay pedidos con este filtro.</EmptyState>
      ) : (
        <div className={tableCls.wrap}>
          <table className={tableCls.table}>
            <thead>
              <tr>
                <th className={tableCls.th}>Folio</th>
                <th className={tableCls.th}>Cliente</th>
                <th className={tableCls.th}>Estado</th>
                <th className={tableCls.th}>Pago</th>
                <th className={`${tableCls.th} text-right`}>Total</th>
                <th className={`${tableCls.th} text-right`}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} className={tableCls.row}>
                  <td className={tableCls.td}><Link href={`/admin/pedidos/${o.id}`} className="font-mono hover:text-ember">{orderNumber(o.number)}</Link></td>
                  <td className={tableCls.td}>
                    <p>{o.customer.name}</p>
                    <p className="text-xs text-fog">{o.email}</p>
                  </td>
                  <td className={tableCls.td}><OrderStatusBadge status={o.status} /></td>
                  <td className={`${tableCls.td} text-mist`}>{PAYMENT_METHOD_LABEL[o.paymentMethod as PaymentMethod] ?? o.paymentMethod}</td>
                  <td className={`${tableCls.td} text-right tabular-nums`}>{formatMXN(o.total)}</td>
                  <td className={`${tableCls.td} text-right text-xs text-fog`}>{formatDate(o.createdAt.toISOString(), { hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-fog">Mostrando hasta 100 pedidos. {ORDER_STATUS_LABEL.PENDING_PAYMENT} se cancelan solos al vencer su reserva.</p>
    </>
  );
}
