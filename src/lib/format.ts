const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Formatea centavos de MXN: 59900 → "$599". */
export function formatMXN(cents: number): string {
  return mxn.format(cents / 100);
}

const TZ = "America/Mexico_City";

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = {}, locale = "es-MX"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
    ...opts,
  }).format(new Date(iso));
}

/** Partes de fecha para el bloque de calendario de conciertos. */
export function dateParts(iso: string, locale = "es-MX") {
  const d = new Date(iso);
  const part = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { timeZone: TZ, ...o }).format(d);
  return {
    day: part({ day: "2-digit" }),
    month: part({ month: "short" }).replace(".", "").toUpperCase(),
    year: part({ year: "numeric" }),
    weekday: part({ weekday: "short" }).replace(".", ""),
    time: part({ hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function orderNumber(n: number): string {
  return `SOAD-${n.toString().padStart(6, "0")}`;
}
