import { Ticket } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { cn } from "@/lib/cn";
import { INTL_LOCALE } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { dateParts } from "@/lib/format";
import type { Show } from "@/lib/types";

export async function ShowRow({ show, past = false, detailed = false }: { show: Show; past?: boolean; detailed?: boolean }) {
  const { lang, t } = await getI18n();
  const d = dateParts(show.startsAt, INTL_LOCALE[lang]);
  const status = t.tour.status[show.status] || null;
  const inactive = show.status === "CANCELLED" || show.status === "POSTPONED";
  return (
    <li
      className={cn(
        "group grid grid-cols-[4.5rem_1fr] items-center gap-x-5 gap-y-4 border-b border-smoke py-6 transition-colors md:grid-cols-[6rem_1fr_auto] md:gap-x-10 md:py-8",
        !past && "hover:bg-ash/40",
      )}
    >
      <time dateTime={show.startsAt} className={cn("flex flex-col leading-none", past && "opacity-50")}>
        <span className="display text-4xl md:text-6xl">{d.day}</span>
        <span className="mt-1 text-[0.7rem] font-semibold tracking-[0.2em] text-ember">
          {d.month} {d.year}
        </span>
      </time>
      <div className={cn("min-w-0", inactive && "opacity-60")}>
        <p className="display text-2xl md:text-4xl">
          <span className={cn(show.status === "CANCELLED" && "line-through decoration-ember")}>{show.city}</span>
          <span className="ml-2 text-base text-fog md:text-xl">{show.state}</span>
        </p>
        <p className="mt-1 text-sm text-mist">
          {show.venue}
          {!past && <span className="text-fog"> · {d.weekday} {d.time} h</span>}
        </p>
        {detailed && show.notes && <p className="mt-2 max-w-xl text-xs text-fog">{show.notes}</p>}
        {show.isSample && <SampleBadge className="mt-2" label={t.common.sampleDate} />}
      </div>
      {!past && (
        <div className="col-span-2 md:col-span-1">
          {status ? (
            <span className="inline-flex h-12 items-center border border-smoke px-6 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-fog">
              {status}
            </span>
          ) : show.ticketUrl ? (
            <a href={show.ticketUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "md")}>
              <Ticket className="h-4 w-4" /> {t.tour.tickets}
            </a>
          ) : (
            <span className={buttonClass("outline", "md", "pointer-events-none opacity-50")} aria-disabled>
              {t.tour.ticketsSoon}
            </span>
          )}
        </div>
      )}
    </li>
  );
}
