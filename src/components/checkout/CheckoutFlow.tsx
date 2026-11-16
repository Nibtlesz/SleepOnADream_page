"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, CreditCard, FlaskConical, Landmark, Lock, ShieldCheck, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { BrickSubmission } from "./MercadoPagoBrick";
import { ShippingOptions } from "@/components/store/ShippingOptions";
import { TotalsList } from "@/components/store/TotalsList";
import { useCartQuote } from "@/components/store/useCartQuote";
import { ProductArt } from "@/components/ui/Art";
import { Button, ButtonLink } from "@/components/ui/Button";
import { MX_STATES } from "@/config/store";
import { describeDiscount, fill, k, msg } from "@/i18n";
import { useI18n } from "@/i18n/client";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import { cn } from "@/lib/cn";
import { formatMXN } from "@/lib/format";
import {
  addressSchema,
  customerSchema,
  firstErrors,
  type AddressInput,
  type CheckoutPayment,
  type CustomerInput,
} from "@/lib/validation/checkout";
import { useCart, useHydrated } from "@/store/cart";
import { useCheckout } from "@/store/checkout";

export interface PaymentOptionsView {
  mercadopago: { enabled: boolean; publicKey: string | null };
  test: boolean;
}

/** El SDK de Mercado Pago solo se descarga al llegar al paso de pago. */
const MercadoPagoBrick = dynamic(() => import("./MercadoPagoBrick").then((m) => m.MercadoPagoBrick), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-coal" aria-busy />,
});


const stateName = (code: string) => MX_STATES.find(([k]) => k === code)?.[1] ?? code;

// ─────────────────────────────────────────────────────────────
// Piezas de formulario
// ─────────────────────────────────────────────────────────────

function Field({
  id,
  label,
  error,
  className,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className={className}>
      <label htmlFor={id} className="eyebrow mb-2 flex justify-between">
        {label}
        {optional && <span className="normal-case tracking-normal text-iron">{t.common.optional}</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-ember">
          {msg(t, error)}
        </p>
      )}
    </div>
  );
}

function inputProps(id: string, error?: string) {
  return {
    id,
    name: id,
    className: "field",
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${id}-error` : undefined,
  };
}

function Stepper({ current, onGo }: { current: number; onGo: (i: number) => void }) {
  const { t } = useI18n();
  return (
    <nav aria-label={t.checkout.stepsNav} className="mb-10 md:mb-14">
      <ol className="grid grid-cols-6 gap-1.5 md:gap-3">
        {t.checkout.steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label}>
              <button
                type="button"
                disabled={!done}
                onClick={() => onGo(i)}
                aria-current={active ? "step" : undefined}
                className="group w-full text-left disabled:cursor-default"
              >
                <span
                  className={cn(
                    "block h-1 transition-colors duration-500",
                    done ? "bg-ember group-hover:bg-bone" : active ? "bg-bone" : "bg-smoke",
                  )}
                />
                <span className={cn("mt-3 flex items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] md:text-[0.68rem]", active ? "text-bone" : done ? "text-mist" : "text-iron")}>
                  <span className="tabular-nums">{done ? <Check className="h-3 w-3 text-ember" /> : `0${i + 1}`}</span>
                  <span className="hidden md:inline">{label}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex items-start justify-between gap-6 border-b border-smoke py-5">
      <div className="min-w-0 text-sm">
        <p className="eyebrow mb-2">{title}</p>
        <div className="space-y-0.5 text-mist">{children}</div>
      </div>
      <button type="button" onClick={onEdit} className="shrink-0 text-xs text-fog underline underline-offset-4 hover:text-bone">
        {t.common.edit}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Flujo
// ─────────────────────────────────────────────────────────────

export function CheckoutFlow({ paymentOptions }: { paymentOptions: PaymentOptionsView }) {
  const router = useRouter();
  const { lang, t } = useI18n();
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const code = useCart((s) => s.code);
  const shipState = useCart((s) => s.shipState);
  const rateId = useCart((s) => s.rateId);
  const setShipping = useCart((s) => s.setShipping);
  const clearCart = useCart((s) => s.clear);

  const draft = useCheckout();
  const { step, setStep } = draft;
  const { quote, loading, refresh } = useCartQuote();

  const [customer, setCustomerLocal] = useState<CustomerInput>(draft.customer);
  const [address, setAddressLocal] = useState<AddressInput>(draft.address);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mpEnabled = paymentOptions.mercadopago.enabled;
  const [method, setMethod] = useState<CheckoutPayment | null>(
    paymentOptions.mercadopago.enabled ? "mercadopago" : paymentOptions.test ? "test" : null,
  );
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  // El borrador se rehidrata de sessionStorage después del primer render.
  const [syncedDraft, setSyncedDraft] = useState(false);
  if (hydrated && !syncedDraft) {
    setSyncedDraft(true);
    setCustomerLocal(draft.customer);
    setAddressLocal({ ...draft.address, state: draft.address.state || shipState || "" });
  }

  useEffect(() => {
    if (hydrated) heading.current?.focus({ preventScroll: true });
  }, [step, hydrated]);

  function go(next: number) {
    setErrors({});
    setBanner(null);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!hydrated) return <div className="h-[32rem] animate-pulse bg-coal" aria-busy />;

  if (items.length === 0 && !completed) {
    return (
      <div className="flex flex-col items-center gap-6 border border-smoke bg-coal py-24 text-center">
        <ShoppingBag className="h-12 w-12 text-iron" strokeWidth={1.2} />
        <p className="display text-4xl">{t.cart.emptyTitle}</p>
        <ButtonLink href="/store">{t.common.goToStore}</ButtonLink>
      </div>
    );
  }

  const selectedRate = quote?.shipping.options.find((o) => o.id === quote.shipping.selectedId) ?? null;
  const blocking = quote?.lines.some((l) => l.issue === "unavailable" || l.issue === "out_of_stock") ?? false;
  const issueFor = (id: string) => {
    const issue = quote?.lines.find((l) => l.variantId === id)?.issue;
    return issue ? t.cart.issues[issue] : null;
  };

  // ── Validación por paso ──────────────────────────────────
  function submitCustomer() {
    const r = customerSchema.safeParse(customer);
    if (!r.success) return setErrors(firstErrors(r.error));
    draft.setCustomer(customer);
    if (!address.recipient) setAddressLocal((a) => ({ ...a, recipient: customer.name }));
    go(1);
  }

  function submitAddress() {
    const r = addressSchema.safeParse(address);
    if (!r.success) return setErrors(firstErrors(r.error));
    draft.setAddress(address);
    if (address.state !== shipState) setShipping(address.state, null);
    go(2);
  }

  function submitShipping() {
    if (!quote?.shipping.selectedId) return setErrors({ rateId: k("v.rate") });
    setShipping(address.state, quote.shipping.selectedId);
    go(3);
  }

  /**
   * Envía el pedido. Con Mercado Pago recibe los datos del Brick; lanza un error si
   * el pago no se completó para que el Brick permita reintentar.
   */
  async function pay(mp?: BrickSubmission) {
    if (!method) return setErrors({ paymentMethod: k("v.paymentMethod") });
    if (!acceptTerms) return setErrors({ acceptTerms: k("v.terms") });
    if (!quote || blocking) return go(3);

    const payload = {
      customer,
      address,
      items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      code,
      rateId: rateId ?? quote.shipping.selectedId,
      paymentMethod: method,
      acceptTerms: true,
    };
    // La clave depende del pedido, no del intento de pago: reintentar con otra
    // tarjeta reutiliza el mismo pedido (y el mismo inventario apartado).
    const idempotencyKey = draft.keyFor(JSON.stringify(payload));
    const mercadopago = mp ? { attemptId: crypto.randomUUID(), ...mp } : undefined;

    setSubmitting(true);
    setErrors({});
    setBanner(null);
    let failure: string | null = null;
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, idempotencyKey, mercadopago, locale: lang }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setCompleted(true);
        router.push(`/checkout/pedido/${data.accessToken}`);
        clearCart();
        draft.reset();
        return;
      }
      failure =
        data.error === "payment_rejected"
          ? (t.checkout.rejections[data.detail] ?? t.checkout.rejections.default)
          : (t.checkout.errors[data.error] ?? t.checkout.errors.generic);
      if (data.error === "cart_changed") {
        refresh();
        setStep(3);
      } else if (data.error === "order_expired") {
        draft.clearKey();
      } else if (data.error === "invalid_input" && data.fields) {
        failure = t.checkout.errors.fields;
        const fields = Object.keys(data.fields);
        setStep(fields.some((f) => f.startsWith("customer")) ? 0 : fields.some((f) => f.startsWith("address")) ? 1 : 4);
      }
    } catch {
      // Error de red: el reintento usa la MISMA clave, así que no se duplica el pedido.
      failure = t.checkout.errors.network;
    } finally {
      setSubmitting(false);
    }
    setBanner(failure);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (mp) throw new Error(failure ?? "payment_failed");
  }

  // ── Render ──────────────────────────────────────────────
  const stepTitle = t.checkout.stepTitles[step];

  return (
    <div>
      <Stepper current={completed ? 5 : step} onGo={go} />

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Resumen móvil */}
        <details className="border border-smoke bg-coal lg:hidden">
          <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm">
            <span className="flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> {t.checkout.viewSummary} ({items.length})</span>
            <span className="font-semibold tabular-nums">{quote ? formatMXN(quote.totals.total) : "—"}</span>
          </summary>
          <div className="border-t border-smoke px-5 py-4">
            {renderSummary()}
          </div>
        </details>

        <section className="lg:col-span-7" aria-labelledby="step-title">
          <p className="eyebrow mb-3">{fill(t.checkout.stepOf, { n: step + 1 })}</p>
          <h2 id="step-title" ref={heading} tabIndex={-1} className="display mb-8 text-4xl outline-none md:text-5xl">
            {stepTitle}
          </h2>

          {banner && (
            <p role="alert" className="mb-6 border border-ember/50 bg-blood/10 px-4 py-3 text-sm text-bone">
              {banner}
            </p>
          )}

          {/* 1. Datos del comprador */}
          {step === 0 && (
            <form noValidate onSubmit={(e) => { e.preventDefault(); submitCustomer(); }} className="grid gap-5 sm:grid-cols-2">
              <Field id="email" label={t.checkout.email} error={errors.email} className="sm:col-span-2">
                <input {...inputProps("email", errors.email)} type="email" autoComplete="email" value={customer.email} onChange={(e) => setCustomerLocal({ ...customer, email: e.target.value })} />
              </Field>
              <Field id="name" label={t.checkout.fullName} error={errors.name}>
                <input {...inputProps("name", errors.name)} autoComplete="name" value={customer.name} onChange={(e) => setCustomerLocal({ ...customer, name: e.target.value })} />
              </Field>
              <Field id="phone" label={t.checkout.phone} error={errors.phone}>
                <input {...inputProps("phone", errors.phone)} type="tel" inputMode="tel" autoComplete="tel-national" value={customer.phone} onChange={(e) => setCustomerLocal({ ...customer, phone: e.target.value })} />
              </Field>
              <p className="text-xs text-fog sm:col-span-2">{t.checkout.emailNote}</p>
              <div className="flex items-center justify-between sm:col-span-2">
                <Link href="/cart" className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-fog hover:text-bone"><ChevronLeft className="h-4 w-4" /> {t.cart.title}</Link>
                <Button type="submit" size="lg">{t.common.continue}</Button>
              </div>
            </form>
          )}

          {/* 2. Dirección de envío */}
          {step === 1 && (
            <form noValidate onSubmit={(e) => { e.preventDefault(); submitAddress(); }} className="grid gap-5 sm:grid-cols-6">
              <Field id="recipient" label={t.checkout.recipient} error={errors.recipient} className="sm:col-span-6">
                <input {...inputProps("recipient", errors.recipient)} autoComplete="shipping name" value={address.recipient} onChange={(e) => setAddressLocal({ ...address, recipient: e.target.value })} />
              </Field>
              <Field id="street" label={t.checkout.street} error={errors.street} className="sm:col-span-4">
                <input {...inputProps("street", errors.street)} autoComplete="shipping address-line1" value={address.street} onChange={(e) => setAddressLocal({ ...address, street: e.target.value })} />
              </Field>
              <Field id="extNumber" label={t.checkout.extNumber} error={errors.extNumber} className="sm:col-span-1">
                <input {...inputProps("extNumber", errors.extNumber)} value={address.extNumber} onChange={(e) => setAddressLocal({ ...address, extNumber: e.target.value })} />
              </Field>
              <Field id="intNumber" label={t.checkout.intNumber} optional className="sm:col-span-1">
                <input {...inputProps("intNumber")} value={address.intNumber} onChange={(e) => setAddressLocal({ ...address, intNumber: e.target.value })} />
              </Field>
              <Field id="neighborhood" label={t.checkout.neighborhood} error={errors.neighborhood} className="sm:col-span-4">
                <input {...inputProps("neighborhood", errors.neighborhood)} autoComplete="shipping address-line2" value={address.neighborhood} onChange={(e) => setAddressLocal({ ...address, neighborhood: e.target.value })} />
              </Field>
              <Field id="postalCode" label={t.checkout.postalCode} error={errors.postalCode} className="sm:col-span-2">
                <input {...inputProps("postalCode", errors.postalCode)} inputMode="numeric" maxLength={5} autoComplete="shipping postal-code" value={address.postalCode} onChange={(e) => setAddressLocal({ ...address, postalCode: e.target.value.replace(/\D/g, "") })} />
              </Field>
              <Field id="city" label={t.checkout.city} error={errors.city} className="sm:col-span-3">
                <input {...inputProps("city", errors.city)} autoComplete="shipping address-level2" value={address.city} onChange={(e) => setAddressLocal({ ...address, city: e.target.value })} />
              </Field>
              <Field id="state" label={t.checkout.state} error={errors.state} className="sm:col-span-3">
                <select {...inputProps("state", errors.state)} autoComplete="shipping address-level1" value={address.state} onChange={(e) => setAddressLocal({ ...address, state: e.target.value })}>
                  <option value="">{t.cart.selectState}</option>
                  {MX_STATES.map(([k, name]) => <option key={k} value={k}>{name}</option>)}
                </select>
              </Field>
              <Field id="references" label={t.checkout.references} optional className="sm:col-span-6">
                <textarea {...inputProps("references")} rows={2} value={address.references} onChange={(e) => setAddressLocal({ ...address, references: e.target.value })} placeholder={t.checkout.referencesPlaceholder} />
              </Field>
              <p className="text-xs text-fog sm:col-span-6">{t.checkout.mexicoOnly}</p>
              <div className="flex items-center justify-between sm:col-span-6">
                <button type="button" onClick={() => go(0)} className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-fog hover:text-bone"><ChevronLeft className="h-4 w-4" /> {t.checkout.steps[0]}</button>
                <Button type="submit" size="lg">{t.common.continue}</Button>
              </div>
            </form>
          )}

          {/* 3. Método de envío */}
          {step === 2 && (
            <div className="space-y-6">
              <p className="text-sm text-mist">
                {t.checkout.sendingTo} <strong className="text-bone">{address.city}, {stateName(address.state)}</strong>
              </p>
              {quote && quote.shipping.options.length > 0 ? (
                <ShippingOptions quote={quote} onSelect={(id) => setShipping(address.state, id)} />
              ) : (
                <div className="h-28 animate-pulse bg-coal" aria-busy />
              )}
              {quote?.totals.freeShipping && <p className="text-xs text-ember">{t.checkout.freeShipping}</p>}
              {errors.rateId && <p className="text-xs text-ember">{msg(t, errors.rateId)}</p>}
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => go(1)} className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-fog hover:text-bone"><ChevronLeft className="h-4 w-4" /> {t.checkout.steps[1]}</button>
                <Button type="button" size="lg" onClick={submitShipping} disabled={!quote || loading}>{t.common.continue}</Button>
              </div>
            </div>
          )}

          {/* 4. Resumen */}
          {step === 3 && (
            <div>
              <ul className="divide-y divide-smoke border-y border-smoke">
                {items.map((i) => (
                  <li key={i.variantId} className="flex items-center gap-4 py-4">
                    <div className="w-16 shrink-0 border border-smoke"><ProductArt kind={i.art} /></div>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="truncate font-semibold">{i.name}</p>
                      <p className="text-xs text-fog">{i.variantLabel} · {t.checkout.quantity} {i.quantity}</p>
                      {issueFor(i.variantId) && <p className="mt-1 text-xs text-ember">{issueFor(i.variantId)}</p>}
                    </div>
                    <p className="text-sm tabular-nums">{formatMXN(i.unitPrice * i.quantity)}</p>
                  </li>
                ))}
              </ul>
              <ReviewBlock title={t.checkout.contact} onEdit={() => go(0)}>
                <p className="text-bone">{customer.name}</p>
                <p>{customer.email} · {customer.phone}</p>
              </ReviewBlock>
              <ReviewBlock title={t.checkout.shipTo} onEdit={() => go(1)}>
                <p className="text-bone">{address.recipient}</p>
                <p>{address.street} {address.extNumber}{address.intNumber ? ` int. ${address.intNumber}` : ""}, {address.neighborhood}</p>
                <p>{address.postalCode} {address.city}, {stateName(address.state)}</p>
              </ReviewBlock>
              <ReviewBlock title={t.checkout.shippingMethod} onEdit={() => go(2)}>
                <p>{selectedRate ? `${t.cart.rateNames[selectedRate.name] ?? selectedRate.name} · ${fill(t.cart.eta, { min: selectedRate.etaMin, max: selectedRate.etaMax })}` : "—"}</p>
              </ReviewBlock>
              {blocking && (
                <p className="mt-6 text-sm text-ember">
                  {t.checkout.noStock} <Link href="/cart" className="underline">{t.checkout.updateCart}</Link> {t.checkout.toContinue}
                </p>
              )}
              <div className="mt-8 flex items-center justify-between">
                <button type="button" onClick={() => go(2)} className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-fog hover:text-bone"><ChevronLeft className="h-4 w-4" /> {t.checkout.steps[2]}</button>
                <Button type="button" size="lg" onClick={() => go(4)} disabled={blocking || !quote || loading}>{t.checkout.toPayment}</Button>
              </div>
            </div>
          )}

          {/* 5. Pago */}
          {step === 4 && (
            <div className="space-y-6">
              <label className="flex items-start gap-3 border border-smoke bg-coal p-4 text-sm text-mist">
                <input type="checkbox" className="mt-1 accent-ember" checked={acceptTerms} onChange={(e) => { setAcceptTerms(e.target.checked); setErrors({}); }} aria-invalid={Boolean(errors.acceptTerms)} />
                <span>
                  {t.checkout.acceptPrefix} <Link href="/legal/terminos" target="_blank" className="underline underline-offset-2 hover:text-bone">{t.checkout.terms}</Link>, {t.checkout.theF}{" "}
                  <Link href="/legal/envios-y-devoluciones" target="_blank" className="underline underline-offset-2 hover:text-bone">{t.checkout.shippingPolicy}</Link> {t.checkout.and}{" "}
                  <Link href="/legal/privacidad" target="_blank" className="underline underline-offset-2 hover:text-bone">{t.checkout.privacy}</Link>.
                </span>
              </label>
              {errors.acceptTerms && <p className="text-xs text-ember">{msg(t, errors.acceptTerms)}</p>}

              <fieldset className="space-y-2">
                <legend className="sr-only">{t.checkout.paymentMethod}</legend>
                {(
                  [
                    {
                      value: "mercadopago" as CheckoutPayment,
                      icon: CreditCard,
                      title: t.checkout.cardOrCash,
                      note: mpEnabled ? t.checkout.cardOrCashNote : t.checkout.mpPending,
                      enabled: mpEnabled,
                    },
                    {
                      value: "spei" as CheckoutPayment,
                      icon: Landmark,
                      title: t.checkout.spei,
                      note: mpEnabled ? t.checkout.speiNote : t.checkout.mpPending,
                      enabled: mpEnabled,
                    },
                    ...(paymentOptions.test
                      ? [{ value: "test" as CheckoutPayment, icon: FlaskConical, title: t.checkout.test, note: t.checkout.testNote, enabled: true }]
                      : []),
                  ]
                ).map((o) => (
                  <label
                    key={o.value}
                    className={cn(
                      "flex items-start gap-4 border px-5 py-4 transition-colors",
                      o.enabled ? "cursor-pointer" : "cursor-not-allowed opacity-45",
                      method === o.value ? "border-ember bg-blood/10" : "border-smoke",
                      o.enabled && method !== o.value && "hover:border-iron",
                    )}
                  >
                    <input type="radio" name="paymentMethod" className="mt-1 accent-ember" disabled={!o.enabled} checked={method === o.value} onChange={() => { setMethod(o.value); setBanner(null); }} />
                    <o.icon className="mt-0.5 h-5 w-5 shrink-0 text-mist" strokeWidth={1.5} aria-hidden />
                    <span className="text-sm">
                      <span className="font-semibold">{o.title}</span>
                      <span className="mt-0.5 block text-xs text-fog">{o.note}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              {errors.paymentMethod && <p className="text-xs text-ember">{msg(t, errors.paymentMethod)}</p>}

              {method === "mercadopago" && paymentOptions.mercadopago.enabled && paymentOptions.mercadopago.publicKey && quote && (
                acceptTerms ? (
                  <div className={cn(submitting && "pointer-events-none opacity-70")}>
                    <MercadoPagoBrick
                      amount={quote.totals.total / 100}
                      payer={{ email: customer.email, firstName: customer.name.split(" ")[0], lastName: customer.name.split(" ").slice(1).join(" ") || undefined }}
                      onSubmit={async (data) => { await pay(data); }}
                    />
                  </div>
                ) : (
                  <p className="border border-dashed border-smoke p-5 text-sm text-fog">{t.checkout.acceptToShow}</p>
                )
              )}

              <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => go(3)} className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-fog hover:text-bone"><ChevronLeft className="h-4 w-4" /> {t.checkout.steps[3]}</button>
                {(method === "test" || method === "spei") && (
                  <Button type="button" size="lg" onClick={() => pay()} disabled={submitting || !quote || loading} aria-busy={submitting}>
                    <Lock className="h-4 w-4" />
                    {submitting
                      ? t.common.processing
                      : method === "spei"
                        ? t.checkout.getTransfer
                        : fill(t.checkout.pay, { amount: quote ? formatMXN(quote.totals.total) : "" })}
                  </Button>
                )}
              </div>
              <p className="flex items-center gap-2 text-xs text-fog">
                <ShieldCheck className="h-4 w-4 shrink-0 text-mist" aria-hidden /> {t.checkout.secureNote}
              </p>
            </div>
          )}
        </section>

        {/* Resumen escritorio */}
        <aside className="hidden lg:col-span-5 lg:block" aria-label={t.cart.summary}>
          <div className="sticky top-28 border border-smoke bg-coal p-8">
            <p className="eyebrow mb-5">{t.checkout.yourOrder}</p>
            {renderSummary()}
          </div>
        </aside>
      </div>
    </div>
  );

  function renderSummary() {
    return (
      <>
        <ul className="mb-6 space-y-4">
          {items.map((i) => (
            <li key={i.variantId} className="flex items-center gap-3 text-sm">
              <div className="relative w-12 shrink-0 border border-smoke">
                <ProductArt kind={i.art} />
                <span className="absolute -top-2 -right-2 grid h-5 min-w-5 place-items-center rounded-full bg-iron px-1 text-[0.6rem] font-bold">{i.quantity}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate">{i.name}</p>
                <p className="text-xs text-fog">{i.variantLabel}</p>
              </div>
              <p className="tabular-nums">{formatMXN(i.unitPrice * i.quantity)}</p>
            </li>
          ))}
        </ul>
        {quote?.discount?.status === "applied" && (
          <p className="mb-4 text-xs text-mist">{quote.discount.code}: {describeDiscount(t, quote.discount)}</p>
        )}
        <TotalsList totals={quote?.totals} loading={loading} className="border-t border-smoke pt-5" />
      </>
    );
  }
}
