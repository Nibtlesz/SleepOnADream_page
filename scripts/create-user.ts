/**
 * Crea o actualiza un usuario del panel. No existe registro público de administradores.
 *
 *   npm run user:create -- correo@dominio.mx ADMIN|STORE_MANAGER|EDITOR "Nombre"
 *
 * La contraseña se toma de NEW_USER_PASSWORD o se genera una aleatoria que se
 * muestra UNA sola vez en la terminal. Cambiarla deja inválidas sus sesiones abiertas.
 */
import { randomBytes } from "node:crypto";
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword, PASSWORD_MIN_LENGTH } from "../src/server/auth/password";

config({ path: [".env.local", ".env"], quiet: true });

const ROLES = ["ADMIN", "STORE_MANAGER", "EDITOR"] as const;
type AdminRole = (typeof ROLES)[number];

async function main() {
  const [emailArg, roleArg = "EDITOR", ...nameParts] = process.argv.slice(2);
  const email = emailArg?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Uso: npm run user:create -- correo@dominio.mx ROL \"Nombre\"");
  if (!ROLES.includes(roleArg as AdminRole)) throw new Error(`Rol inválido. Usa: ${ROLES.join(", ")}`);
  const role = roleArg as AdminRole;

  const generated = !process.env.NEW_USER_PASSWORD;
  const password = process.env.NEW_USER_PASSWORD ?? randomBytes(18).toString("base64url");
  if (password.length < PASSWORD_MIN_LENGTH) throw new Error(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`);

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const passwordHash = await hashPassword(password);
    const user = await db.user.upsert({
      where: { email },
      create: { email, role, name: nameParts.join(" ") || null, passwordHash },
      update: { role, passwordHash, active: true, failedLogins: 0, lockedUntil: null, ...(nameParts.length ? { name: nameParts.join(" ") } : {}) },
    });
    await db.session.deleteMany({ where: { userId: user.id } });
    console.log(`Usuario listo: ${email} (${role})`);
    if (generated) console.log(`Contraseña generada (guárdala en un gestor de contraseñas; no se volverá a mostrar):\n${password}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
