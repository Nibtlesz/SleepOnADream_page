import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE } from "@/i18n/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * 1. /admin: redirección OPTIMISTA si no hay cookie de sesión (la verificación real
 *    de sesión y permisos ocurre en el servidor en cada página y acción).
 * 2. Idiomas: español vive sin prefijo (/store → se reescribe a /es/store);
 *    inglés vive en /en. /es/... redirige a la ruta sin prefijo (una sola URL por página).
 *    La elección se recuerda en una cookie, solo al navegar de verdad (no en prefetch).
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const hasSession = request.cookies.has("__Host-soad_admin") || request.cookies.has("soad_admin");
    if (!hasSession && !pathname.startsWith("/admin/login")) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const isPrefetch = request.headers.has("next-router-prefetch") || request.headers.get("purpose") === "prefetch";
  const remember = (res: NextResponse, lang: string) => {
    if (!isPrefetch && request.cookies.get(LOCALE_COOKIE)?.value !== lang) {
      res.cookies.set(LOCALE_COOKIE, lang, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
    }
    return res;
  };

  // /en/... → se sirve tal cual.
  if (pathname === "/en" || pathname.startsWith("/en/")) return remember(NextResponse.next(), "en");

  // /es/... → URL canónica sin prefijo.
  if (pathname === "/es" || pathname.startsWith("/es/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return remember(NextResponse.redirect(url), "es");
  }

  // Sin prefijo: si la persona eligió inglés antes, la llevamos a /en.
  if (request.cookies.get(LOCALE_COOKIE)?.value === "en" && !isPrefetch) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/en" : `/en${pathname}`;
    return NextResponse.redirect(url);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.rewrite(url);
}

export const config = {
  // Todo excepto APIs, archivos internos de Next y archivos con extensión (íconos, imágenes, robots, sitemap).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
