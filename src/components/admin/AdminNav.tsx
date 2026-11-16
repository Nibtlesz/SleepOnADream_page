"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, CalendarDays, ClipboardList, Disc3, Film, LogOut, Menu, Package, ScrollText, TicketPercent, X } from "lucide-react";
import { cn } from "@/lib/cn";

const ICONS = { dashboard: BarChart3, products: Package, discounts: TicketPercent, orders: ClipboardList, shows: CalendarDays, music: Disc3, videos: Film, audit: ScrollText };

export interface NavEntry {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
}

export function AdminNav({ items, user, logout }: { items: NavEntry[]; user: { email: string; roleLabel: string }; logout: () => Promise<void> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-smoke bg-coal px-4 lg:hidden">
        <Link href="/admin" className="display text-xl">SOAD <span className="text-ember">Panel</span></Link>
        <button type="button" onClick={() => setOpen((o) => !o)} className="grid h-10 w-10 place-items-center" aria-expanded={open} aria-controls="admin-nav" aria-label={open ? "Cerrar menú" : "Abrir menú"}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      <aside
        id="admin-nav"
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-smoke bg-coal pt-14 transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 lg:pt-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Link href="/admin" className="display hidden px-6 py-6 text-2xl lg:block">SOAD <span className="text-ember">Panel</span></Link>
        <nav aria-label="Panel" className="flex-1 overflow-y-auto px-3 py-4 lg:py-0">
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = ICONS[item.icon];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active(item.href) ? "page" : undefined}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-mist transition-colors hover:bg-ash hover:text-bone aria-[current=page]:bg-ash aria-[current=page]:text-bone"
                  >
                    <Icon className={cn("h-4 w-4", active(item.href) ? "text-ember" : "text-fog")} strokeWidth={1.6} aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-smoke p-4">
          <p className="truncate text-sm">{user.email}</p>
          <p className="eyebrow mt-1">{user.roleLabel}</p>
          <div className="mt-4 flex gap-2">
            <Link href="/" className="flex-1 border border-iron py-2 text-center text-xs text-mist hover:text-bone">Ver sitio</Link>
            <form action={logout} className="flex-1">
              <button type="submit" className="flex w-full items-center justify-center gap-1.5 border border-iron py-2 text-xs text-mist hover:border-ember hover:text-ember">
                <LogOut className="h-3.5 w-3.5" /> Salir
              </button>
            </form>
          </div>
        </div>
      </aside>
      {open && <button type="button" aria-label="Cerrar menú" className="fixed inset-0 z-20 bg-ink/70 lg:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
