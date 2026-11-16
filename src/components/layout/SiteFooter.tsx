import { siteConfig } from "@/config/site";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import { getI18n } from "@/i18n/server";
import { Logo } from "./Logo";
import { SocialLinks } from "./SocialLinks";

export async function SiteFooter() {
  const { t } = await getI18n();
  return (
    <footer className="relative border-t border-smoke bg-coal">
      <div className="container-site grid gap-14 py-16 md:grid-cols-12 md:py-24">
        <div className="md:col-span-5">
          <Logo className="h-20 w-auto md:h-24" sizes="200px" />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-fog">{t.footer.pitch}</p>
          <NewsletterForm className="mt-6 max-w-md" />
        </div>

        <nav aria-label={t.footer.nav} className="grid grid-cols-2 gap-10 md:col-span-4 md:col-start-7">
          <div>
            <p className="eyebrow mb-5">{t.footer.explore}</p>
            <ul className="space-y-3 text-sm">
              {siteConfig.nav.slice(1).map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-mist transition-colors hover:text-bone">
                    {t.nav[item.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-5">{t.footer.store}</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/cart" className="text-mist hover:text-bone">{t.footer.cart}</Link></li>
              {siteConfig.legal.map((l) => (
                <li key={l.slug}>
                  <Link href={`/legal/${l.slug}`} className="text-mist hover:text-bone">{t.legal[l.slug]}</Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="md:col-span-2">
          <p className="eyebrow mb-5">{t.footer.follow}</p>
          <SocialLinks pendingLabel={t.social.pending} />
        </div>
      </div>
      <div className="border-t border-smoke">
        <div className="container-site flex flex-col gap-2 py-6 text-[0.7rem] text-iron md:flex-row md:items-center md:justify-between">
          <p>© {siteConfig.name}. {t.footer.rights}</p>
          <p>{t.footer.prices}</p>
        </div>
      </div>
    </footer>
  );
}
