"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/components/admin/forms";
import { getDb } from "@/lib/db";
import { firstErrors } from "@/lib/validation/checkout";
import { audit } from "@/server/audit";
import { assertAdmin } from "@/server/auth/dal";

const schema = z
  .object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,32}$/, "3–32 letras, números, guion o guion bajo"),
    type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
    value: z.coerce.number().min(0).max(100_000).optional().default(0),
    minSubtotal: z.coerce.number().min(0).max(1_000_000).optional(),
    maxRedemptions: z.coerce.number().int().min(1).max(1_000_000).optional(),
    endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  })
  .refine((d) => d.type !== "PERCENT" || (d.value > 0 && d.value <= 100), { error: "El porcentaje va de 1 a 100", path: ["value"] })
  .refine((d) => d.type !== "FIXED" || d.value > 0, { error: "Indica el monto", path: ["value"] });

export async function createDiscount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await assertAdmin("products");
  const raw = Object.fromEntries([...formData.entries()].filter(([, v]) => v !== ""));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { message: "Revisa los campos.", errors: firstErrors(parsed.error) };
  const d = parsed.data;
  try {
    const created = await getDb().discountCode.create({
      data: {
        code: d.code,
        type: d.type,
        // PERCENT guarda el porcentaje; FIXED guarda centavos.
        value: d.type === "FIXED" ? Math.round(d.value * 100) : Math.round(d.value),
        minSubtotal: d.minSubtotal ? Math.round(d.minSubtotal * 100) : null,
        maxRedemptions: d.maxRedemptions ?? null,
        endsAt: d.endsAt ? new Date(`${d.endsAt}T23:59:59-06:00`) : null,
      },
    });
    await audit(user, "discount.create", "DiscountCode", created.id, { code: d.code, type: d.type });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") return { message: "Ese código ya existe.", errors: { code: "En uso" } };
    throw e;
  }
  revalidatePath("/admin/descuentos");
  return { ok: true, message: `Código ${d.code} creado.` };
}

export async function toggleDiscount(formData: FormData) {
  const user = await assertAdmin("products");
  const id = String(formData.get("id"));
  const db = getDb();
  const current = await db.discountCode.findUnique({ where: { id } });
  if (!current) return;
  await db.discountCode.update({ where: { id }, data: { active: !current.active } });
  await audit(user, current.active ? "discount.deactivate" : "discount.activate", "DiscountCode", id, { code: current.code });
  revalidatePath("/admin/descuentos");
}
