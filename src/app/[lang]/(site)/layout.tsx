import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CartDrawer } from "@/components/store/CartDrawer";

/** Layout del sitio público (ambos idiomas). El panel /admin tiene su propio layout raíz. */
export default function SiteLayout({ children }: LayoutProps<"/[lang]">) {
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <CartDrawer />
    </>
  );
}
