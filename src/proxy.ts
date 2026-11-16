import { NextResponse, type NextRequest } from "next/server";

/**
 * Redirección OPTIMISTA: si no hay cookie de sesión, manda a /admin/login.
 * La verificación real (sesión válida, rol, permisos) ocurre en el servidor
 * en cada página y acción (src/server/auth/dal.ts).
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("__Host-soad_admin") || request.cookies.has("soad_admin");
  if (!hasSession && !request.nextUrl.pathname.startsWith("/admin/login")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
