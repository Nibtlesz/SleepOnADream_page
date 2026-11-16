"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";
import { selectCount, useCart, useHydrated } from "@/store/cart";
import { Logo } from "./Logo";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const count = useCart(selectCount);
  const openCart = useCart((s) => s.open);
  const hydrated = useHydrated();
  const menuButton = useRef<HTMLButtonElement>(null);

  // Cierra el menú móvil al navegar.
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-[60] bg-blood px-4 py-2 text-sm focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500",
          scrolled || menuOpen
            ? "border-b border-smoke/80 bg-ink/85 backdrop-blur-md"
            : "border-b border-transparent bg-gradient-to-b from-ink/80 to-transparent",
        )}
      >
        <div className="container-site flex h-16 items-center justify-between gap-6 md:h-20">
          <Link href="/" className="text-xl md:text-2xl" aria-label={`${siteConfig.name} — inicio`}>
            <Logo />
          </Link>

          <nav aria-label="Principal" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {siteConfig.nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className="link-underline pb-1 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-mist transition-colors hover:text-bone aria-[current=page]:text-bone"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={openCart}
              className="relative grid h-11 w-11 place-items-center text-bone transition-colors hover:text-ember"
              aria-label={`Abrir carrito${hydrated && count ? `, ${count} artículos` : ""}`}
            >
              <ShoppingBag className="h-5 w-5" strokeWidth={1.6} />
              {hydrated && count > 0 && (
                <span className="absolute top-1.5 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-ember px-1 text-[0.6rem] font-bold">
                  {count}
                </span>
              )}
            </button>
            <button
              ref={menuButton}
              type="button"
              className="grid h-11 w-11 place-items-center lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="menu-movil"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X className="h-6 w-6" strokeWidth={1.6} /> : <Menu className="h-6 w-6" strokeWidth={1.6} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            id="menu-movil"
            aria-label="Menú móvil"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 flex flex-col justify-between bg-ink/97 px-6 pt-24 pb-10 backdrop-blur-lg lg:hidden"
          >
            <ul className="space-y-1">
              {siteConfig.nav.map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.4 }}
                >
                  <Link
                    href={item.href}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className="display block py-1 text-5xl text-bone/80 transition-colors hover:text-ember aria-[current=page]:text-ember sm:text-6xl"
                  >
                    {item.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
            <p className="eyebrow">Sitio oficial · {siteConfig.name}</p>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
