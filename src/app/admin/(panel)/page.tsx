import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { SalesChart } from "@/components/admin/SalesChart";
import { AdminLink, Card, EmptyState, OrderStatusBadge, PageTitle, Pill } from "@/components/admin/ui";
import { formatDate, formatMXN, orderNumber } from "@/lib/format";
import { getDashboardStats } from "@/server/admin/stats";
import { requireAdmin } from "@/server/auth/dal";
import { can } from "@/server/auth/permissions";

export const metadata: Metadata = { title: "Resumen" };

/** Página privada que depende de la sesión: la navegación espera al servidor. */
export const instant = false;

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-smoke bg-coal p-5">
      <p className="eyebrow">{label}</p>
      <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-fog">{sub}</p>}
    </div>
  );
}

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const user = await requireAdmin("dashboard");
  const denied = (await searchParams).denied === "1";

  if (!can(user.role, "stats")) {
    return (
      <>
        <PageTitle title={`Hola${user.name ? `, ${user.name}` : ""}`} eyebrow="Panel" />
        <p className="text-mist">Desde el menú puedes administrar conciertos, música y videos.</p>
      </>
    );
  }

  const s = await getDashboardStats(30);

  return (
    <>
      <PageTitle title="Resumen" eyebrow="Panel" />
      {denied && <p role="alert" className="mb-6 border border-ember/50 px-4 py-3 text-sm text-ember">No tienes permiso para esa sección.</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Ventas totales" value={formatMXN(s.totalSales)} sub={`${s.totalOrders} pedidos pagados`} />
        <Stat label="Últimos 30 días" value={formatMXN(s.periodSales)} sub={`${s.periodOrders} pedidos`} />
        <Stat label="Por enviar" value={String(s.toShip)} sub="Pagados o en preparación" />
        <Stat label="Pendientes de pago" value={String(s.pendingCount)} sub="OXXO, SPEI o en revisión" />
      </div>

      <Card title="Ventas por día · últimos 30 días" className="mt-6">
        {s.periodOrders ? <SalesChart data={s.series} /> : <EmptyState>Aún no hay ventas en este periodo.</EmptyState>}
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Pedidos recientes" className="xl:col-span-2" action={<AdminLink href="/admin/pedidos" className="text-xs">Ver todos</AdminLink>}>
          {s.recent.length ? (
            <ul className="divide-y divide-smoke/60">
              {s.recent.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/admin/pedidos/${o.id}`} className="font-mono hover:text-ember">{orderNumber(o.number)}</Link>
                  <span className="min-w-0 flex-1 truncate text-fog">{o.email}</span>
                  <OrderStatusBadge status={o.status} />
                  <span className="w-24 text-right tabular-nums">{formatMXN(o.total)}</span>
                  <span className="hidden w-28 text-right text-xs text-fog sm:block">{formatDate(o.createdAt.toISOString(), { year: undefined })}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>Todavía no hay pedidos.</EmptyState>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Más vendidos">
            {s.topItems.length ? (
              <ol className="space-y-2 text-sm">
                {s.topItems.map((t, i) => (
                  <li key={t.name} className="flex justify-between gap-3">
                    <span className="truncate"><span className="mr-2 text-fog tabular-nums">{i + 1}.</span>{t.name}</span>
                    <span className="tabular-nums text-mist">{t.quantity} pzs</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-fog">Sin ventas todavía.</p>
            )}
          </Card>
          <Card title="Inventario bajo" action={<AlertTriangle className="h-4 w-4 text-ember" aria-hidden />}>
            {s.lowStock.length ? (
              <ul className="space-y-2 text-sm">
                {s.lowStock.map((v, i) => (
                  <li key={`${v.productId}-${i}`} className="flex items-center justify-between gap-3">
                    <Link href={`/admin/productos/${v.productId}`} className="min-w-0 truncate hover:text-ember">
                      {v.name} <span className="text-fog">· {v.label}</span>
                    </Link>
                    <Pill tone={v.stock === 0 ? "warn" : "default"}>{v.stock === 0 ? "Agotado" : `${v.stock} pzs`}</Pill>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-fog">Todo el inventario está por encima de 3 piezas.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
