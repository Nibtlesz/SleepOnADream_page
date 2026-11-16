/**
 * Sesiones de administrador en base de datos.
 *  - Token aleatorio de 256 bits en cookie httpOnly / Secure / SameSite=Lax.
 *  - En la base solo se guarda su SHA-256: una fuga de la tabla no permite suplantar sesiones.
 *  - Vigencia de 12 h; cerrar sesión la invalida en el servidor.
 */
import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";

const SESSION_HOURS = 12;
const isProd = process.env.NODE_ENV === "production";
/** El prefijo __Host- obliga a Secure, Path=/ y sin Domain (no la pueden pisar subdominios). */
export const SESSION_COOKIE = isProd ? "__Host-soad_admin" : "soad_admin";

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export async function createSession(userId: string, meta: { ip?: string; userAgent?: string } = {}) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_HOURS * 3600_000);
  await getDb().session.create({
    data: { tokenHash: sha256(token), userId, expires, ip: meta.ip, userAgent: meta.userAgent?.slice(0, 300) },
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "STORE_MANAGER" | "EDITOR";
  sessionId: string;
}

/** Usuario de la sesión actual, o null. No redirige (ver dal.ts). */
export async function readSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const session = await getDb().session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });
  if (!session || session.expires < new Date()) return null;
  const u = session.user;
  if (!u.active || u.role === "CUSTOMER") return null;
  return { id: u.id, email: u.email, name: u.name, role: u.role, sessionId: session.id };
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await getDb().session.deleteMany({ where: { tokenHash: sha256(token) } });
  store.delete(SESSION_COOKIE);
}
