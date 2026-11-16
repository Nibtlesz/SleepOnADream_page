/** Estadísticas del panel. Siempre en vivo (sin caché): reflejan pedidos al momento. */
import "server-only";
import { getDb } from "@/lib/db";

/** Estados que cuentan como venta (el pago se confirmó). */
export const SOLD_STATUSES = ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] as const;
export const LOW_STOCK = 3;

const TZ = "America/Mexico_City";
const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d); // YYYY-MM-DD

export async function getDashboardStats(days = 30) {
  const db = getDb();
  const since = new Date(Date.now() - days * 86_400_000);
  const sold = { status: { in: [...SOLD_STATUSES] } };

  const [allTime, periodOrders, pendingCount, toShip, recent, topItems, lowStock] = await Promise.all([
    db.order.aggregate({ where: sold, _sum: { total: true }, _count: true }),
    db.order.findMany({ where: { ...sold, createdAt: { gte: since } }, select: { total: true, createdAt: true } }),
    db.order.count({ where: { status: "PENDING_PAYMENT" } }),
    db.order.count({ where: { status: { in: ["PAID", "PREPARING"] } } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, number: true, status: true, total: true, email: true, createdAt: true } }),
    db.orderItem.groupBy({
      by: ["productName"],
      where: { order: sold },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    db.productVariant.findMany({
      where: { stock: { lte: LOW_STOCK }, product: { status: "ACTIVE" } },
      include: { product: { select: { id: true, name: true } } },
      orderBy: { stock: "asc" },
      take: 10,
    }),
  ]);

  // Serie diaria (zona horaria de México), incluidos días sin ventas.
  const byDay = new Map<string, { total: number; orders: number }>();
  for (let i = days - 1; i >= 0; i--) byDay.set(dayKey(new Date(Date.now() - i * 86_400_000)), { total: 0, orders: 0 });
  for (const o of periodOrders) {
    const k = dayKey(o.createdAt);
    const bucket = byDay.get(k);
    if (bucket) {
      bucket.total += o.total;
      bucket.orders += 1;
    }
  }

  return {
    totalSales: allTime._sum.total ?? 0,
    totalOrders: allTime._count,
    periodSales: periodOrders.reduce((a, o) => a + o.total, 0),
    periodOrders: periodOrders.length,
    pendingCount,
    toShip,
    series: [...byDay.entries()].map(([date, v]) => ({ date, ...v })),
    recent,
    topItems: topItems.map((t) => ({ name: t.productName, quantity: t._sum.quantity ?? 0 })),
    lowStock: lowStock.map((v) => ({
      productId: v.product.id,
      name: v.product.name,
      label: [v.color, v.size].filter(Boolean).join(" / ") || "Única",
      stock: v.stock,
    })),
  };
}
