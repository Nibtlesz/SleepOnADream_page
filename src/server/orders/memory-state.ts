/**
 * Estado EN MEMORIA para desarrollo sin base de datos (datos de ejemplo).
 * Se pierde al reiniciar el servidor. En producción se usa PostgreSQL.
 */
import "server-only";
import type { OrderRecord } from "@/lib/orders";

interface MemoryState {
  orders: Map<string, OrderRecord>;
  seq: number;
  /** Unidades comprometidas por variante (pedidos pendientes o pagados). */
  committed: Map<string, number>;
  /** Eventos de pago ya procesados (idempotencia de webhooks). */
  events: Set<string>;
}

const g = globalThis as unknown as { __soadMemory?: MemoryState };

export const memory: MemoryState = (g.__soadMemory ??= {
  orders: new Map(),
  seq: 0,
  committed: new Map(),
  events: new Set(),
});

export function committedQty(variantId: string) {
  return memory.committed.get(variantId) ?? 0;
}
