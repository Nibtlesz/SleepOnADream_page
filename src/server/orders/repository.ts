/**
 * Repositorio de pedidos.
 *  - Sin DATABASE_URL: implementación en memoria (desarrollo con datos de ejemplo).
 *  - Con DATABASE_URL: PostgreSQL vía Prisma, con reserva de inventario transaccional.
 *    Se activa por completo en la Fase 4, cuando el catálogo viva en la base de datos.
 */
import "server-only";
import { randomUUID } from "node:crypto";
import { isLocale } from "@/i18n/config";
import { getDb, isDbConfigured } from "@/lib/db";
import type { OrderRecord, OrderStatus, PaymentInstructions } from "@/lib/orders";
import type { PaymentMethod, ShippingAddress } from "@/lib/validation/checkout";
import { findVariantsForQuote } from "@/server/queries/catalog";
import { memory } from "./memory-state";

export type NewOrder = Omit<OrderRecord, "id" | "number" | "status" | "createdAt">;

export interface PendingPaymentInfo {
  paymentMethod: PaymentMethod;
  paymentInstructions: PaymentInstructions | null;
  /** Para OXXO/SPEI la reserva se extiende hasta que vence la ficha. */
  reservedUntil: string | null;
}

export interface PaymentUpdate {
  provider: "MERCADOPAGO" | "STRIPE" | "TEST";
  providerPaymentId: string;
  amount: number;
  method: string | null;
}

export class OutOfStockError extends Error {
  constructor(public variantId: string) {
    super(`Inventario insuficiente para ${variantId}`);
  }
}

export interface OrderRepository {
  findByIdempotencyKey(key: string): Promise<OrderRecord | null>;
  findByAccessToken(token: string): Promise<OrderRecord | null>;
  findById(id: string): Promise<OrderRecord | null>;
  /** Crea el pedido PENDING_PAYMENT y reserva inventario de forma atómica. */
  create(order: NewOrder): Promise<OrderRecord>;
  /** Registra el método elegido / instrucciones de un pedido aún pendiente. */
  updatePendingPayment(orderId: string, info: PendingPaymentInfo): Promise<OrderRecord | null>;
  /** PENDING_PAYMENT → PAID. Idempotente: si ya no está pendiente, no hace nada. */
  markPaid(orderId: string, payment: PaymentUpdate): Promise<OrderRecord | null>;
  /** Cancela un pedido pendiente y libera su inventario. Idempotente. */
  cancelPending(orderId: string, note: string): Promise<OrderRecord | null>;
  /** Registra un evento de webhook. Devuelve false si ya se había procesado. */
  recordEvent(provider: string, eventId: string): Promise<boolean>;
  /** Cancela pedidos cuya reserva de inventario venció. Devuelve cuántos. */
  expireStale(now?: Date): Promise<number>;
}

// ─────────────────────────────────────────────────────────────
// Memoria
// ─────────────────────────────────────────────────────────────

const memoryRepo: OrderRepository = {
  async findByIdempotencyKey(key) {
    return [...memory.orders.values()].find((o) => o.idempotencyKey === key) ?? null;
  },
  async findByAccessToken(token) {
    return [...memory.orders.values()].find((o) => o.accessToken === token) ?? null;
  },
  async findById(id) {
    return memory.orders.get(id) ?? null;
  },
  async create(order) {
    const variants = await findVariantsForQuote(order.items.map((i) => i.variantId));
    // Verificación + reserva sin `await` intermedio: atómica en un solo proceso de Node.
    for (const item of order.items) {
      const available = variants.get(item.variantId)?.variant.stock ?? 0;
      if (available < item.quantity) throw new OutOfStockError(item.variantId);
    }
    for (const item of order.items) {
      memory.committed.set(item.variantId, (memory.committed.get(item.variantId) ?? 0) + item.quantity);
    }
    const record: OrderRecord = {
      ...order,
      id: randomUUID(),
      number: ++memory.seq,
      status: "PENDING_PAYMENT",
      createdAt: new Date().toISOString(),
    };
    memory.orders.set(record.id, record);
    return record;
  },
  async updatePendingPayment(orderId, info) {
    const order = memory.orders.get(orderId);
    if (!order) return null;
    if (order.status === "PENDING_PAYMENT") {
      order.paymentMethod = info.paymentMethod;
      order.paymentInstructions = info.paymentInstructions;
      if (info.reservedUntil) order.reservedUntil = info.reservedUntil;
    }
    return order;
  },
  async markPaid(orderId) {
    const order = memory.orders.get(orderId);
    if (!order) return null;
    if (order.status === "PENDING_PAYMENT") {
      order.status = "PAID";
      order.reservedUntil = null;
      order.paymentInstructions = null;
    }
    return order;
  },
  async cancelPending(orderId) {
    const order = memory.orders.get(orderId);
    if (!order) return null;
    if (order.status === "PENDING_PAYMENT") {
      order.status = "CANCELLED";
      for (const item of order.items) {
        memory.committed.set(item.variantId, Math.max((memory.committed.get(item.variantId) ?? 0) - item.quantity, 0));
      }
    }
    return order;
  },
  async recordEvent(provider, eventId) {
    const key = `${provider}:${eventId}`;
    if (memory.events.has(key)) return false;
    memory.events.add(key);
    return true;
  },
  async expireStale(now = new Date()) {
    let n = 0;
    for (const o of memory.orders.values()) {
      if (o.status === "PENDING_PAYMENT" && o.reservedUntil && new Date(o.reservedUntil) < now) {
        await memoryRepo.cancelPending(o.id, "Reserva vencida");
        n++;
      }
    }
    return n;
  },
};

// ─────────────────────────────────────────────────────────────
// PostgreSQL (Prisma)
// ─────────────────────────────────────────────────────────────

const orderInclude = { items: true, customer: true } as const;

type DbOrder = NonNullable<Awaited<ReturnType<ReturnType<typeof getDb>["order"]["findUnique"]>>> & {
  items: Array<{ variantId: string; productName: string; variantLabel: string; unitPrice: number; quantity: number }>;
  customer: { name: string; phone: string | null };
};

function fromDb(o: DbOrder): OrderRecord {
  return {
    id: o.id,
    number: o.number,
    accessToken: o.accessToken,
    idempotencyKey: o.idempotencyKey,
    status: o.status as OrderStatus,
    email: o.email,
    customerName: o.customer.name,
    phone: o.customer.phone ?? "",
    address: o.shippingAddress as unknown as ShippingAddress,
    shippingRateName: o.shippingRateName,
    paymentMethod: o.paymentMethod as PaymentMethod,
    items: o.items.map((i) => ({
      variantId: i.variantId,
      productName: i.productName,
      variantLabel: i.variantLabel,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
    })),
    subtotal: o.subtotal,
    discountTotal: o.discountTotal,
    discountCode: o.discountCodeText,
    shippingTotal: o.shippingTotal,
    total: o.total,
    reservedUntil: o.reservedUntil?.toISOString() ?? null,
    paymentInstructions: (o.paymentInstructions as unknown as PaymentInstructions | null) ?? null,
    locale: isLocale(o.locale) ? o.locale : "es",
    createdAt: o.createdAt.toISOString(),
  };
}

function isUniqueViolation(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

const prismaRepo: OrderRepository = {
  async findByIdempotencyKey(key) {
    const o = await getDb().order.findUnique({ where: { idempotencyKey: key }, include: orderInclude });
    return o ? fromDb(o) : null;
  },
  async findByAccessToken(token) {
    const o = await getDb().order.findUnique({ where: { accessToken: token }, include: orderInclude });
    return o ? fromDb(o) : null;
  },
  async findById(id) {
    const o = await getDb().order.findUnique({ where: { id }, include: orderInclude });
    return o ? fromDb(o) : null;
  },
  async create(order) {
    const db = getDb();
    try {
      const created = await db.$transaction(async (tx) => {
        // Decremento condicional: si otra compra se llevó la última pieza, count = 0 y se revierte todo.
        for (const item of order.items) {
          const res = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (res.count !== 1) throw new OutOfStockError(item.variantId);
        }
        const customer = await tx.customer.upsert({
          where: { email: order.email },
          create: { email: order.email, name: order.customerName, phone: order.phone },
          update: { name: order.customerName, phone: order.phone },
        });
        if (order.discountCode) {
          await tx.discountCode.updateMany({ where: { code: order.discountCode }, data: { redemptions: { increment: 1 } } });
        }
        return tx.order.create({
          data: {
            idempotencyKey: order.idempotencyKey,
            accessToken: order.accessToken,
            paymentMethod: order.paymentMethod,
            customerId: customer.id,
            email: order.email,
            shippingAddress: order.address,
            shippingRateName: order.shippingRateName,
            subtotal: order.subtotal,
            discountTotal: order.discountTotal,
            discountCodeText: order.discountCode,
            shippingTotal: order.shippingTotal,
            total: order.total,
            reservedUntil: order.reservedUntil ? new Date(order.reservedUntil) : null,
            paymentInstructions: order.paymentInstructions ?? undefined,
            locale: order.locale,
            items: { create: order.items },
            statusHistory: { create: { to: "PENDING_PAYMENT", note: "Pedido creado en el checkout" } },
          },
          include: orderInclude,
        });
      });
      return fromDb(created);
    } catch (e) {
      // Dos peticiones simultáneas con la misma clave: gana una, la otra devuelve el mismo pedido.
      if (isUniqueViolation(e)) {
        const existing = await prismaRepo.findByIdempotencyKey(order.idempotencyKey);
        if (existing) return existing;
      }
      throw e;
    }
  },
  async updatePendingPayment(orderId, info) {
    await getDb().order.updateMany({
      where: { id: orderId, status: "PENDING_PAYMENT" },
      data: {
        paymentMethod: info.paymentMethod,
        paymentInstructions: info.paymentInstructions ?? undefined,
        ...(info.reservedUntil ? { reservedUntil: new Date(info.reservedUntil) } : {}),
      },
    });
    return prismaRepo.findById(orderId);
  },
  async markPaid(orderId, payment) {
    const db = getDb();
    await db.$transaction(async (tx) => {
      const res = await tx.order.updateMany({
        where: { id: orderId, status: "PENDING_PAYMENT" },
        data: { status: "PAID", reservedUntil: null },
      });
      if (res.count === 1) {
        await tx.orderStatusChange.create({ data: { orderId, from: "PENDING_PAYMENT", to: "PAID", note: `Pago ${payment.providerPaymentId}` } });
      }
      if (payment.provider !== "TEST") {
        await tx.payment.upsert({
          where: { providerPaymentId: payment.providerPaymentId },
          create: { orderId, provider: payment.provider, providerPaymentId: payment.providerPaymentId, status: "APPROVED", amount: payment.amount, method: payment.method },
          update: { status: "APPROVED" },
        });
      }
    });
    return prismaRepo.findById(orderId);
  },
  async cancelPending(orderId, note) {
    const db = getDb();
    await db.$transaction(async (tx) => {
      const res = await tx.order.updateMany({ where: { id: orderId, status: "PENDING_PAYMENT" }, data: { status: "CANCELLED" } });
      if (res.count !== 1) return;
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
      }
      await tx.orderStatusChange.create({ data: { orderId, from: "PENDING_PAYMENT", to: "CANCELLED", note } });
    });
    return prismaRepo.findById(orderId);
  },
  async recordEvent(provider, eventId) {
    // Los pagos de prueba (solo desarrollo) no son eventos de un proveedor real.
    if (provider === "TEST") return true;
    try {
      await getDb().paymentEvent.create({
        data: { provider: provider as "MERCADOPAGO" | "STRIPE", providerEventId: eventId, type: "payment" },
      });
      return true;
    } catch (e) {
      if (isUniqueViolation(e)) return false;
      throw e;
    }
  },
  async expireStale(now = new Date()) {
    const stale = await getDb().order.findMany({
      where: { status: "PENDING_PAYMENT", reservedUntil: { lt: now } },
      select: { id: true },
      take: 100,
    });
    for (const o of stale) await prismaRepo.cancelPending(o.id, "Reserva vencida");
    return stale.length;
  },
};

export const orders: OrderRepository = isDbConfigured ? prismaRepo : memoryRepo;
