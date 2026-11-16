import type { Metadata } from "next";

/**
 * El panel depende de la sesión en cada petición: no se prerenderiza y se permite
 * que la navegación espere al servidor.
 */
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel SOAD" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="min-h-dvh bg-ink">{children}</div>;
}
