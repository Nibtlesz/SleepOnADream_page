/** Bitácora de acciones administrativas (quién, qué, cuándo, desde dónde). */
import "server-only";
import { getDb } from "@/lib/db";
import type { SessionUser } from "@/server/auth/session";
import { getClientIp } from "@/server/request";

export async function audit(
  user: Pick<SessionUser, "id">,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>,
) {
  await getDb().adminAuditLog.create({
    data: {
      userId: user.id,
      action,
      entityType,
      entityId,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      ip: await getClientIp().catch(() => null),
    },
  });
}
