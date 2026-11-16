/** Piezas visuales compartidas del panel (servidor). */
import Link from "next/link";
import type React from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/orders";

export function PageTitle({ title, eyebrow, action }: { title: string; eyebrow?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="display text-4xl md:text-5xl">{title}</h1>
      </div>
      {action}
    </div>
  );
}

export function Card({ title, children, className, action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn("border border-smoke bg-coal", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-smoke px-5 py-3">
          <h2 className="eyebrow text-mist">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const STATUS_TONE: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "border-iron text-mist",
  PAID: "border-ember/60 text-ember",
  PREPARING: "border-amber-500/50 text-amber-400",
  SHIPPED: "border-sky-500/50 text-sky-400",
  DELIVERED: "border-emerald-500/50 text-emerald-400",
  CANCELLED: "border-smoke text-fog line-through",
  REFUNDED: "border-smoke text-fog",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("inline-flex border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em]", STATUS_TONE[status])}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

export function Pill({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "warn" | "ok" | "muted" }) {
  const tones = {
    default: "border-iron text-mist",
    warn: "border-ember/60 text-ember",
    ok: "border-emerald-500/50 text-emerald-400",
    muted: "border-smoke text-fog",
  };
  return <span className={cn("inline-flex border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em]", tones[tone])}>{children}</span>;
}

export const tableCls = {
  wrap: "overflow-x-auto border border-smoke",
  table: "w-full min-w-[640px] text-left text-sm",
  th: "border-b border-smoke bg-coal px-4 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-fog",
  td: "border-b border-smoke/60 px-4 py-3 align-middle",
  row: "transition-colors hover:bg-ash/50",
};

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="border border-dashed border-smoke p-10 text-center text-sm text-fog">{children}</p>;
}

export function AdminLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("text-bone underline decoration-iron underline-offset-4 hover:decoration-ember", className)}>
      {children}
    </Link>
  );
}

export const btn = {
  primary:
    "inline-flex h-10 items-center justify-center gap-2 bg-blood px-5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] transition-colors hover:bg-ember disabled:opacity-50",
  outline:
    "inline-flex h-10 items-center justify-center gap-2 border border-iron px-5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-mist transition-colors hover:border-bone hover:text-bone disabled:opacity-50",
  danger:
    "inline-flex h-10 items-center justify-center gap-2 border border-ember/50 px-5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ember transition-colors hover:bg-blood hover:text-bone disabled:opacity-50",
};

/** Fecha y hora en la zona del centro de México para los campos de formulario. */
export function mxDateInput(d: Date | null) {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(d);
}
export function mxTimeInput(d: Date | null) {
  if (!d) return "20:00";
  return new Intl.DateTimeFormat("en-GB", { timeZone: "America/Mexico_City", hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
}

export function Flash({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const msg = sp.guardado ? "Cambios guardados. El sitio ya muestra la versión actualizada." : sp.eliminado ? "Elemento eliminado." : null;
  if (!msg) return null;
  return <p role="status" className="mb-6 border border-emerald-500/40 px-4 py-3 text-sm text-emerald-300">{msg}</p>;
}

export function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="accent-ember" /> {label}
    </label>
  );
}

export function Input({ label, name, className, hint, ...props }: { label: string; name: string; hint?: string } & React.ComponentProps<"input">) {
  return (
    <div className={className}>
      <label htmlFor={name} className="eyebrow mb-2 block">{label}</label>
      <input id={name} name={name} className="field" {...props} />
      {hint && <p className="mt-1 text-xs text-fog">{hint}</p>}
    </div>
  );
}
