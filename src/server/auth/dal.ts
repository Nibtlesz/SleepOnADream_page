/**
 * Capa de acceso (DAL) del panel. TODA página y acción administrativa pasa por
 * `requireAdmin(permiso)`: el proxy solo hace una redirección optimista.
 */
import "server-only";
import { redirect } from "next/navigation";
import { can, type Permission } from "./permissions";
import { readSession, type SessionUser } from "./session";

export async function requireAdmin(permission: Permission = "dashboard"): Promise<SessionUser> {
  const user = await readSession();
  if (!user) redirect("/admin/login");
  if (!can(user.role, permission)) redirect("/admin?denied=1");
  return user;
}

/** Para Server Actions: devuelve el usuario o lanza (sin redirigir a mitad de un formulario). */
export async function assertAdmin(permission: Permission): Promise<SessionUser> {
  const user = await readSession();
  if (!user || !can(user.role, permission)) throw new Error("No autorizado");
  return user;
}
