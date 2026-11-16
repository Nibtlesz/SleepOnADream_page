import { ExternalLink } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { INTL_LOCALE } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
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
export async function PaymentInstructionsCard({ instructions }: { instructions: PaymentInstructions }) {
  const { lang, t } = await getI18n();
  const i18n = t.order.instructions;
  if (instructions.kind === "review") {
    return <p className="mt-8 border border-smoke bg-coal p-6 text-sm text-mist">{t.order.instructions.review}</p>;
  }
  const expires = instructions.expiresAt ? formatDate(instructions.expiresAt, { hour: "2-digit", minute: "2-digit" }, INTL_LOCALE[lang]) : null;
  return (
    <section className="mt-8 border border-ember/40 bg-coal p-6 md:p-8" aria-labelledby="pay-instructions">
      <h2 id="pay-instructions" className="display text-3xl">
        {instructions.kind === "spei" ? i18n.speiTitle : i18n.cashTitle}
      </h2>
      <p className="mt-2 text-sm text-mist">
        {instructions.kind === "spei"
          ? i18n.speiText
          : i18n.cashText}
      </p>
      <dl className="mt-4">
        <Row label={i18n.amount} value={formatMXN(instructions.amount)} />
        {instructions.kind === "spei" && (
          <>
            <Row label="CLABE" value={instructions.clabe} mono />
            <Row label={i18n.bank} value={instructions.bank} />
            <Row label={i18n.beneficiary} value={instructions.beneficiary} />
          </>
        )}
        <Row label={i18n.reference} value={instructions.reference} mono />
        <Row label={i18n.deadline} value={expires} />
      </dl>
      {instructions.voucherUrl && (
        <a href={instructions.voucherUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "md", "mt-6")}>
          {instructions.kind === "spei" ? i18n.viewInstructions : i18n.viewVoucher} <ExternalLink className="h-4 w-4" />
        </a>
      )}
      <p className="mt-5 text-xs text-fog">{i18n.footnote}</p>
    </section>
  );
}
