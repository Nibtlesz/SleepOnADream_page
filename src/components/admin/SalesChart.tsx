"use client";

/**
 * Ventas diarias (una sola serie → sin leyenda; el título la nombra).
 * Barras ≤ 24 px con extremo redondeado de 4 px, separación de 2 px, línea base tenue,
 * tooltip por barra y tabla equivalente para lectores de pantalla.
 */
import { useState } from "react";
import { formatMXN } from "@/lib/format";

interface Point {
  date: string;
  total: number;
  orders: number;
}

const label = (d: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", ...opts }).format(new Date(`${d}T12:00:00Z`));

export function SalesChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.total), 1);
  const peak = data.reduce((best, d, i) => (d.total > data[best].total ? i : best), 0);
  const H = 160;

  return (
    <figure>
      <div className="relative" style={{ height: H + 8 }} onMouseLeave={() => setHover(null)}>
        <div className="absolute inset-x-0 bottom-0 h-px bg-smoke" aria-hidden />
        <div className="absolute inset-0 flex items-end gap-[2px]" role="img" aria-label="Gráfica de ventas diarias; la tabla de abajo tiene los mismos datos.">
          {data.map((d, i) => {
            const h = d.total ? Math.max((d.total / max) * H, 3) : 0;
            return (
              <div
                key={d.date}
                className="relative flex h-full flex-1 cursor-default items-end justify-center"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                tabIndex={-1}
              >
                {hover === i && <div className="absolute inset-y-0 w-full bg-bone/5" aria-hidden />}
                <div
                  className="relative w-full max-w-6 rounded-t-[4px] transition-opacity"
                  style={{ height: h, background: "#e0262f", opacity: hover === null || hover === i ? 1 : 0.45 }}
                />
                {i === peak && d.total > 0 && hover === null && (
                  <span className="absolute text-[0.65rem] tabular-nums text-mist" style={{ bottom: h + 4 }}>
                    {formatMXN(d.total)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {hover !== null && (
          <div
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full border border-smoke bg-ink px-3 py-2 text-xs whitespace-nowrap shadow-lg"
            style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}
          >
            <p className="text-fog">{label(data[hover].date, { weekday: "short", day: "numeric", month: "short" })}</p>
            <p className="mt-0.5 font-semibold tabular-nums text-bone">{formatMXN(data[hover].total)}</p>
            <p className="text-mist">{data[hover].orders} {data[hover].orders === 1 ? "pedido" : "pedidos"}</p>
          </div>
        )}
      </div>
      <div className="mt-2 flex justify-between text-[0.65rem] text-fog" aria-hidden>
        <span>{label(data[0].date, { day: "numeric", month: "short" })}</span>
        <span>{label(data[data.length - 1].date, { day: "numeric", month: "short" })}</span>
      </div>
      <details className="mt-4 text-xs">
        <summary className="cursor-pointer text-fog hover:text-bone">Ver como tabla</summary>
        <table className="mt-3 w-full text-left">
          <thead>
            <tr className="text-fog"><th className="py-1 font-normal">Día</th><th className="py-1 text-right font-normal">Pedidos</th><th className="py-1 text-right font-normal">Ventas</th></tr>
          </thead>
          <tbody>
            {data.filter((d) => d.orders > 0).map((d) => (
              <tr key={d.date} className="border-t border-smoke/60">
                <td className="py-1">{label(d.date, { day: "numeric", month: "short" })}</td>
                <td className="py-1 text-right tabular-nums">{d.orders}</td>
                <td className="py-1 text-right tabular-nums">{formatMXN(d.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
