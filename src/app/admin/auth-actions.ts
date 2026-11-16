"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { audit } from "@/server/audit";
import { dummyHash, verifyPassword } from "@/server/auth/password";
import { createSession, destroySession, readSession } from "@/server/auth/session";
import { rateLimit } from "@/server/rate-limit";
import { getClientIp } from "@/server/request";

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const GENERIC = "Correo o contraseña incorrectos.";

const loginSchema = z.object({
  email: z.email().trim().toLowerCase().max(254),
  password: z.string().min(1).max(200),
});

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: GENERIC };
  const { email, password } = parsed.data;

  const ip = await getClientIp();
  if (!rateLimit(`login:ip:${ip}`, 20, 15 * 60_000).ok || !rateLimit(`login:email:${email}`, 10, 15 * 60_000).ok) {
    return { error: "Demasiados intentos. Espera unos minutos." };
  }

  const db = getDb();
  const user = await db.user.findUnique({ where: { email } });
  // Siempre se calcula un hash, exista o no el usuario, para no revelar qué correos existen.
  const valid = await verifyPassword(password, user?.passwordHash ?? (await dummyHash()));

  if (!user || !user.passwordHash || !user.active || user.role === "CUSTOMER") return { error: GENERIC };
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { error: "Cuenta bloqueada temporalmente por intentos fallidos. Intenta más tarde." };
  }
  if (!valid) {
    const failed = user.failedLogins + 1;
    await db.user.update({
      where: { id: user.id },
      data: failed >= MAX_FAILED ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000) } : { failedLogins: failed },
    });
    return { error: GENERIC };
  }

  await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
  await createSession(user.id, { ip, userAgent: (await headers()).get("user-agent") ?? undefined });
  await audit(user, "auth.login", "User", user.id);
  redirect("/admin");
}

export async function logout() {
  const user = await readSession();
  if (user) await audit(user, "auth.logout", "User", user.id);
  await destroySession();
  redirect("/admin/login");
}
