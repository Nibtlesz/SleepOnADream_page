/** Transiciones de estado permitidas desde el panel (el pago lo confirma solo Mercado Pago). */
import type { OrderStatus } from "./orders";

export const MANUAL_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  PAID: ["PREPARING", "REFUNDED"],
  PREPARING: ["REFUNDED"], // a "Enviado" se pasa registrando la guía
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export const CARRIERS = ["Estafeta", "DHL", "FedEx", "Correos de México", "99 Minutos", "Paquetexpress", "Otro"] as const;
