import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Cliente de Prisma (singleton). En desarrollo se reutiliza entre recargas
 * para no agotar conexiones. Mientras no exista DATABASE_URL, el sitio funciona
 * con los datos de ejemplo de `src/data/sample`.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const isDbConfigured = Boolean(process.env.DATABASE_URL);

export function getDb(): PrismaClient {
  if (!isDbConfigured) {
    throw new Error("DATABASE_URL no está configurada. Revisa .env.example.");
  }
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}
