/**
 * Conciertos OFICIALES (publicados en el perfil de Spotify de la banda; boletos en Bandsintown).
 * Se cargan con el seed y se muestran cuando el sitio funciona sin base de datos.
 * Para agregar más, usa el panel (/admin/conciertos) o añádelos aquí.
 * Horas en UTC: el centro de México es UTC−6 (19:00 locales = 01:00 UTC del día siguiente).
 */
import type { Show } from "@/lib/types";

export const officialShows: Show[] = [
  {
    id: "2026-12-11-pachuca-masiosare",
    startsAt: "2026-12-12T01:00:00.000Z", // vie 11 dic 2026, 19:00
    city: "Pachuca de Soto",
    state: "Hidalgo",
    venue: "Masiosare Tragos Mexas",
    posterUrl: null,
    ticketUrl: "https://www.bandsintown.com/e/109096498",
    notes: null,
    status: "SCHEDULED",
    isSample: false,
  },
  {
    id: "2026-12-12-cdmx-central-belgica",
    startsAt: "2026-12-13T00:30:00.000Z", // sáb 12 dic 2026, 18:30
    city: "Ciudad de México",
    state: "CDMX",
    venue: "Central Bélgica",
    posterUrl: null,
    ticketUrl: "https://www.bandsintown.com/e/109096509",
    notes: null,
    status: "SCHEDULED",
    isSample: false,
  },
];
