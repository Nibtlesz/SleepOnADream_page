import { Suspense } from "react";
import { AdminNav, type NavEntry } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/server/auth/dal";
import { can, ROLE_LABEL, type Permission } from "@/server/auth/permissions";
import { logout } from "../auth-actions";

const NAV: Array<NavEntry & { permission: Permission }> = [
  { href: "/admin", label: "Resumen", icon: "dashboard", permission: "dashboard" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "orders", permission: "orders" },
  { href: "/admin/productos", label: "Productos", icon: "products", permission: "products" },
  { href: "/admin/descuentos", label: "Descuentos", icon: "discounts", permission: "products" },
  { href: "/admin/conciertos", label: "Conciertos", icon: "shows", permission: "content" },
  { href: "/admin/musica", label: "Música", icon: "music", permission: "content" },
  { href: "/admin/videos", label: "Videos", icon: "videos", permission: "content" },
  { href: "/admin/bitacora", label: "Bitácora", icon: "audit", permission: "audit" },
];

function PanelSkeleton() {
  return (
    <div className="lg:flex" aria-busy>
      <div className="hidden h-dvh w-64 shrink-0 border-r border-smoke bg-coal lg:block" />
      <div className="flex-1 space-y-4 px-4 py-10 md:px-10">
        <div className="h-12 w-60 animate-pulse bg-coal" />
        <div className="h-64 animate-pulse bg-coal" />
      </div>
    </div>
  );
}

/**
 * La sesión se lee dentro de Suspense (requisito de Cache Components). Cada página
 * vuelve a verificar sesión y permiso con `requireAdmin`: el layout no es la única barrera.
 */
async function Panel({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin("dashboard");
  const items = NAV.filter((n) => can(user.role, n.permission)).map((n) => ({ href: n.href, label: n.label, icon: n.icon }));
  return (
    <div className="lg:flex">
      <AdminNav items={items} user={{ email: user.email, roleLabel: ROLE_LABEL[user.role] }} logout={logout} />
      <main id="contenido" className="min-w-0 flex-1 px-4 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <Panel>{children}</Panel>
    </Suspense>
  );
}
