"use server";

/**
 * Server Actions de los formularios públicos (contacto y newsletter).
 * Protección antispam en capas: honeypot, tiempo mínimo de llenado y límite por IP.
 */
import { contactSchema, newsletterSchema, type FormState } from "@/lib/validation/schemas";
import { getDb, isDbConfigured } from "@/lib/db";
import { rateLimit } from "@/server/rate-limit";
import { getClientIp } from "@/server/request";
import { sendEmail } from "@/server/services/email";

const MIN_FILL_MS = 2_500;
const GENERIC_OK = "¡Listo! Recibimos tu mensaje.";

function looksLikeBot(company: string | undefined, renderedAt: number) {
  return Boolean(company) || Date.now() - renderedAt < MIN_FILL_MS;
}

export async function subscribeNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newsletterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: "Revisa los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { email, company, renderedAt } = parsed.data;
  // Respuesta de éxito silenciosa ante bots para no darles retroalimentación.
  if (looksLikeBot(company, renderedAt)) return { status: "success", message: "¡Gracias por suscribirte!" };

  const ip = await getClientIp();
  if (!rateLimit(`nl:${ip}`, 5, 10 * 60_000).ok) {
    return { status: "error", message: "Demasiados intentos. Intenta de nuevo en unos minutos." };
  }

  if (isDbConfigured) {
    await getDb().newsletterSubscriber.upsert({
      where: { email },
      create: { email, source: "web" },
      update: { unsubscribedAt: null },
    });
  }
  // Fase 5: correo de doble confirmación (doble opt-in).
  await sendEmail({ to: email, subject: "Confirma tu suscripción", text: "Correo de confirmación pendiente (Fase 5)." });

  return { status: "success", message: "¡Gracias! Revisa tu correo para confirmar la suscripción." };
}

export async function sendContactMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: "Revisa los campos marcados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { company, renderedAt, ...data } = parsed.data;
  if (looksLikeBot(company, renderedAt)) return { status: "success", message: GENERIC_OK };

  const ip = await getClientIp();
  if (!rateLimit(`contact:${ip}`, 3, 10 * 60_000).ok) {
    return { status: "error", message: "Demasiados mensajes seguidos. Intenta más tarde." };
  }

  if (isDbConfigured) {
    await getDb().contactMessage.create({ data: { ...data, ip } });
  }
  await sendEmail({
    to: "equipo@dominio-por-definir.mx",
    replyTo: data.email,
    subject: `[Contacto · ${data.topic}] ${data.name}`,
    text: data.message,
  });

  return { status: "success", message: `${GENERIC_OK} Te responderemos lo antes posible.` };
}
