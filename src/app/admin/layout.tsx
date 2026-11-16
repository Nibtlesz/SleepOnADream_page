import type { Metadata, Viewport } from "next";
import { fontClasses } from "../fonts";
import "../globals.css";

/**
 * El panel depende de la sesión en cada petición: no se prerenderiza y se permite
 * que la navegación espere al servidor.
 */
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel SOAD" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#070708", colorScheme: "dark" };

/** Layout raíz del panel (independiente del sitio público y de sus idiomas; siempre en español). */
export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="es-MX" className={fontClasses}>
      <body className="min-h-dvh bg-ink">{children}</body>
    </html>
  );
}
