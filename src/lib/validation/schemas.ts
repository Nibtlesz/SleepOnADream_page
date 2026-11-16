/**
 * Esquemas de validación compartidos (frontend y backend).
 * El servidor vuelve a validar todo: nunca se confía en el cliente.
 */
import { z } from "zod";
import { storeConfig } from "@/config/store";

const email = z.email({ error: "Escribe un correo válido." }).trim().max(254);

/** Campo trampa: los humanos no lo ven; si viene con valor, es un bot. */
const honeypot = z.string().max(0).optional().or(z.literal(""));
/** Marca de tiempo de cuando se mostró el formulario (anti-bots muy rápidos). */
const renderedAt = z.coerce.number().int().positive();

export const newsletterSchema = z.object({
  email,
  consent: z.literal("on", { error: "Necesitamos tu consentimiento para enviarte noticias." }),
  company: honeypot,
  renderedAt,
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre.").max(100),
  email,
  topic: z.enum(["general", "booking", "press", "store"], { error: "Elige un motivo." }),
  message: z.string().trim().min(10, "Cuéntanos un poco más (mínimo 10 caracteres).").max(4000),
  company: honeypot,
  renderedAt,
});

export const cartQuoteSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().min(1).max(64),
        quantity: z.number().int().min(1).max(storeConfig.maxQtyPerItem),
      }),
    )
    .max(50),
  code: z.string().trim().toUpperCase().max(32).optional().nullable(),
  state: z.string().max(8).optional().nullable(),
  rateId: z.string().max(32).optional().nullable(),
});

export type CartQuoteInput = z.infer<typeof cartQuoteSchema>;

export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};
