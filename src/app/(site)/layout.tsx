import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CartDrawer } from "@/components/store/CartDrawer";

/** Layout del sitio público. El panel administrativo (Fase 4) tendrá su propio layout en /admin. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
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
