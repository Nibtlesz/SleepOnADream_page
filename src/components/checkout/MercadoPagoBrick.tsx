"use client";

/**
 * Payment Brick de Mercado Pago (tarjetas y efectivo: OXXO, Paycash, cajeros).
 * SPEI no está disponible en el Brick para México: se cobra desde el servidor.
 * El formulario de tarjeta vive en iframes de Mercado Pago: el número y el CVV
 * nunca pasan por este sitio. El Brick entrega un token de un solo uso que
 * nuestro servidor envía a la API de pagos junto con el monto calculado en el servidor.
 */
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { useI18n } from "@/i18n/client";

// Este módulo solo se carga en el navegador (dynamic + ssr:false).
const PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
if (PUBLIC_KEY) initMercadoPago(PUBLIC_KEY, { locale: "es-MX" });

export interface BrickSubmission {
  selectedPaymentMethod: string;
  formData: Record<string, unknown>;
}

/** Constante: el Brick se vuelve a crear si cambia la referencia de `customization`. */
const CUSTOMIZATION = {
  paymentMethods: {
    creditCard: "all",
    debitCard: "all",
    prepaidCard: "all",
    ticket: "all", // OXXO, Paycash
    atm: "all", // BBVA, Citibanamex
    maxInstallments: 12,
  },
  visual: {
    style: {
      theme: "dark",
      customVariables: {
        baseColor: "#e0262f",
        formBackgroundColor: "#0e0e10",
        inputBackgroundColor: "#17171a",
        borderRadiusSmall: "0px",
        borderRadiusMedium: "0px",
        borderRadiusLarge: "0px",
      },
    },
  },
} satisfies ComponentProps<typeof Payment>["customization"];

export function MercadoPagoBrick({
  amount,
  payer,
  onSubmit,
}: {
  /** Solo para mostrar en el Brick; el cobro usa el total calculado en el servidor. */
  amount: number;
  payer: { email: string; firstName?: string; lastName?: string };
  onSubmit: (data: BrickSubmission) => Promise<void>;
}) {
  const { lang, t } = useI18n();
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(!PUBLIC_KEY);

  // El SDK reconstruye el Brick si cambia cualquier callback o la inicialización,
  // así que todas las referencias se mantienen estables entre renders.
  const submitRef = useRef(onSubmit);
  useEffect(() => {
    submitRef.current = onSubmit;
  });
  // Si el SDK no responde (bloqueador, red lenta, clave inválida), no dejar al comprador esperando.
  useEffect(() => {
    if (ready || loadError) return;
    const t = setTimeout(() => setLoadError(true), 15_000);
    return () => clearTimeout(t);
  }, [ready, loadError]);
  const { email, firstName, lastName } = payer;
  const initialization = useMemo(
    () => ({ amount, payer: { email, firstName, lastName } }),
    [amount, email, firstName, lastName],
  );
  const handleSubmit = useCallback(
    ({ selectedPaymentMethod, formData }: { selectedPaymentMethod: string; formData: unknown }) =>
      submitRef.current({ selectedPaymentMethod, formData: formData as Record<string, unknown> }),
    [],
  );
  const handleReady = useCallback(() => setReady(true), []);
  const handleError = useCallback((e: { type: string; cause: string }) => {
    console.error("[mercadopago:brick]", e);
    if (e.type === "critical") setLoadError(true);
  }, []);

  return (
    <div className="relative min-h-64">
      {!ready && !loadError && (
        <div className="absolute inset-0 animate-pulse bg-coal" aria-busy aria-label={t.checkout.loadingPayment} />
      )}
      {loadError && (
        <p role="alert" className="border border-ember/50 bg-blood/10 px-4 py-3 text-sm">
          {t.checkout.brickError}{" "}
          <button type="button" className="underline" onClick={() => location.reload()}>{t.checkout.reload}</button>.{" "}
          {t.checkout.orSpei}
        </p>
      )}
      {PUBLIC_KEY && (
        <Payment
          // El formulario de Mercado Pago se muestra en el idioma del sitio.
          locale={lang === "en" ? "en-US" : "es-MX"}
          initialization={initialization}
          customization={CUSTOMIZATION}
          onReady={handleReady}
          onError={handleError}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
