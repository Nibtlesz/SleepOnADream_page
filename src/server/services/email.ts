/**
 * Envío de correos transaccionales.
 * Fase 5: implementar con el proveedor elegido (Resend, Postmark, SES…) vía API.
 * Mientras tanto registra el correo en consola solo en desarrollo.
 */
import "server-only";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

export async function sendEmail(msg: EmailMessage): Promise<void> {
  if (!process.env.EMAIL_API_KEY) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[email:dev] →", msg.to, "|", msg.subject);
    }
    return;
  }
  // TODO(Fase 5): llamada al proveedor de correo.
}
