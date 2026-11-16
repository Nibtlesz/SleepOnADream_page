import { ExternalLink } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { formatDate, formatMXN } from "@/lib/format";
import type { PaymentInstructions } from "@/lib/orders";

function Row({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1 border-b border-smoke py-3 sm:flex-row sm:items-baseline sm:justify-between">
      <dt className="eyebrow">{label}</dt>
      <dd className={mono ? "font-mono text-lg tracking-wider select-all" : "text-sm"}>{value}</dd>
    </div>
  );
}

/** Cómo terminar un pago diferido (OXXO / SPEI) o aviso de pago en revisión. */
export function PaymentInstructionsCard({ instructions }: { instructions: PaymentInstructions }) {
  if (instructions.kind === "review") {
    return <p className="mt-8 border border-smoke bg-coal p-6 text-sm text-mist">{instructions.message}</p>;
  }
  const expires = instructions.expiresAt ? formatDate(instructions.expiresAt, { hour: "2-digit", minute: "2-digit" }) : null;
  return (
    <section className="mt-8 border border-ember/40 bg-coal p-6 md:p-8" aria-labelledby="pay-instructions">
      <h2 id="pay-instructions" className="display text-3xl">
        {instructions.kind === "spei" ? "Paga por transferencia SPEI" : "Paga en efectivo"}
      </h2>
      <p className="mt-2 text-sm text-mist">
        {instructions.kind === "spei"
          ? "Haz la transferencia desde tu banca en línea con estos datos. Se acredita en minutos."
          : "Presenta la referencia o la ficha en la tienda. El pago puede tardar hasta 2 horas en reflejarse."}
      </p>
      <dl className="mt-4">
        <Row label="Monto exacto" value={formatMXN(instructions.amount)} />
        {instructions.kind === "spei" && (
          <>
            <Row label="CLABE" value={instructions.clabe} mono />
            <Row label="Banco" value={instructions.bank} />
            <Row label="Beneficiario" value={instructions.beneficiary} />
          </>
        )}
        <Row label="Referencia" value={instructions.reference} mono />
        <Row label="Fecha límite" value={expires} />
      </dl>
      {instructions.voucherUrl && (
        <a href={instructions.voucherUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "md", "mt-6")}>
          {instructions.kind === "spei" ? "Ver instrucciones" : "Ver ficha de pago"} <ExternalLink className="h-4 w-4" />
        </a>
      )}
      <p className="mt-5 text-xs text-fog">Tu pedido queda apartado hasta la fecha límite. Te avisaremos por correo cuando recibamos el pago.</p>
    </section>
  );
}
