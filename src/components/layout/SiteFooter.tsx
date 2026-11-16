import Link from "next/link";
import { siteConfig } from "@/config/site";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { Logo } from "./Logo";
import { SocialLinks } from "./SocialLinks";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-smoke bg-coal">
      <div className="container-site grid gap-14 py-16 md:grid-cols-12 md:py-24">
        <div className="md:col-span-5">
          <Logo className="text-4xl md:text-5xl" />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-fog">
            Recibe primero lanzamientos, fechas de concierto y ediciones limitadas de la tienda.
          </p>
          <NewsletterForm className="mt-6 max-w-md" />
        </div>

        <nav aria-label="Pie de página" className="grid grid-cols-2 gap-10 md:col-span-4 md:col-start-7">
          <div>
            <p className="eyebrow mb-5">Explorar</p>
            <ul className="space-y-3 text-sm">
              {siteConfig.nav.slice(1).map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-mist transition-colors hover:text-bone">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-5">Tienda</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/cart" className="text-mist hover:text-bone">Carrito</Link></li>
              {siteConfig.legal.map((l) => (
                <li key={l.slug}>
                  <Link href={`/legal/${l.slug}`} className="text-mist hover:text-bone">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="md:col-span-2">
          <p className="eyebrow mb-5">Síguenos</p>
          <SocialLinks />
        </div>
      </div>
      <div className="border-t border-smoke">
        <div className="container-site flex flex-col gap-2 py-6 text-[0.7rem] text-iron md:flex-row md:items-center md:justify-between">
          <p>© {siteConfig.name}. Todos los derechos reservados.</p>
          <p>Precios en pesos mexicanos (MXN), IVA incluido.</p>
        </div>
      </div>
    </footer>
  );
}
