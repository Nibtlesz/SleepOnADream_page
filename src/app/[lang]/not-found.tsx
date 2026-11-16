import { LocaleLink } from "@/i18n/LocaleLink";
import { getI18n } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="eyebrow">{t.notFound.code}</p>
        <h1 className="display mt-4 text-7xl md:text-9xl">{t.notFound.title}</h1>
        <p className="mt-4 text-mist">{t.notFound.text}</p>
        <LocaleLink href="/" className="mt-8 inline-block bg-blood px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-ember">
          {t.common.home}
        </LocaleLink>
      </div>
    </div>
  );
}
