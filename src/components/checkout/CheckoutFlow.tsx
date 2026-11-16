"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, CreditCard, FlaskConical, Landmark, Lock, ShieldCheck, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { BrickSubmission } from "./MercadoPagoBrick";
import { ISSUE_TEXT } from "@/components/store/CartView";
import { ShippingOptions } from "@/components/store/ShippingOptions";
import { TotalsList } from "@/components/store/TotalsList";
import { useCartQuote } from "@/components/store/useCartQuote";
import { ProductArt } from "@/components/ui/Art";
import { Button, ButtonLink } from "@/components/ui/Button";
import { MX_STATES } from "@/config/store";
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
  loading: () => <div className="h-64 animate-pulse bg-coal" aria-busy aria-label="Cargando formulario de pago" />,
});

const STEPS = ["Datos", "Dirección", "Envío", "Resumen", "Pago", "Confirmación"] as const;

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
  return (
    <div className={className}>
      <label htmlFor={id} className="eyebrow mb-2 flex justify-between">
        {label}
        {optional && <span className="normal-case tracking-normal text-iron">Opcional</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-ember">
          {error}
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
  return (
    <nav aria-label="Pasos del checkout" className="mb-10 md:mb-14">
      <ol className="grid grid-cols-6 gap-1.5 md:gap-3">
        {STEPS.map((label, i) => {
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
  return (
    <div className="flex items-start justify-between gap-6 border-b border-smoke py-5">
      <div className="min-w-0 text-sm">
        <p className="eyebrow mb-2">{title}</p>
        <div className="space-y-0.5 text-mist">{children}</div>
      </div>
      <button type="button" onClick={onEdit} className="shrink-0 text-xs text-fog underline underline-offset-4 hover:text-bone">
        Editar
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Flujo
// ─────────────────────────────────────────────────────────────

export function CheckoutFlow({ paymentOptions }: { paymentOptions: PaymentOptionsView }) {
  const router = useRouter();
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
        <p className="display text-4xl">Tu carrito está vacío</p>
        <ButtonLink href="/store">Ir a la tienda</ButtonLink>
      </div>
    );
  }

  const selectedRate = quote?.shipping.options.find((o) => o.id === quote.shipping.selectedId) ?? null;
  const blocking = quote?.lines.some((l) => l.issue === "unavailable" || l.issue === "out_of_stock") ?? false;
  const issueFor = (id: string) => {
    const issue = quote?.lines.find((l) => l.variantId === id)?.issue;
    return issue ? ISSUE_TEXT[issue] : null;
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
    if (!quote?.shipping.selectedId) return setErrors({ rateId: "Elige un método de envío." });
    setShipping(address.state, quote.shipping.selectedId);
    go(3);
  }

  /**
   * Envía el pedido. Con Mercado Pago recibe los datos del Brick; lanza un error si
   * el pago no se completó para que el Brick permita reintentar.
   */
  async function pay(mp?: BrickSubmission) {
    if (!method) return setErrors({ paymentMethod: "Elige un método de pago." });
    if (!acceptTerms) return setErrors({ acceptTerms: "Debes aceptar los términos y el aviso de privacidad." });
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
        body: JSON.stringify({ ...payload, idempotencyKey, mercadopago }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setCompleted(true);
        router.push(`/checkout/pedido/${data.accessToken}`);
        clearCart();
        draft.reset();
        return;
      }
      failure = data.message ?? "No pudimos procesar tu pedido. Intenta de nuevo.";
      if (data.error === "cart_changed") {
        refresh();
        setStep(3);
      } else if (data.error === "order_expired") {
        draft.clearKey();
      } else if (data.error === "invalid_input" && data.fields) {
        failure = "Revisa tus datos: hay campos con errores.";
        const fields = Object.keys(data.fields);
        setStep(fields.some((f) => f.startsWith("customer")) ? 0 : fields.some((f) => f.startsWith("address")) ? 1 : 4);
      }
    } catch {
      // Error de red: el reintento usa la MISMA clave, así que no se duplica el pedido.
      failure = "Se perdió la conexión. Puedes reintentar sin riesgo de un cobro doble.";
    } finally {
      setSubmitting(false);
    }
    setBanner(failure);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (mp) throw new Error(failure ?? "payment_failed");
  }

  // ── Render ──────────────────────────────────────────────
  const stepTitle = ["¿Quién compra?", "¿A dónde lo enviamos?", "Método de envío", "Revisa tu pedido", "Pago"][step];

  return (
    <div>
      <Stepper current={completed ? 5 : step} onGo={go} />

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Resumen móvil */}
        <details className="border border-smoke bg-coal lg:hidden">
          <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm">
            <span className="flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Ver resumen ({items.length})</span>
            <span className="font-semibold tabular-nums">{quote ? formatMXN(quote.totals.total) : "—"}</span>
          </summary>
          <div className="border-t border-smoke px-5 py-4">
            {renderSummary()}
          </div>
        </details>

        <section className="lg:col-span-7" aria-labelledby="step-title">
          <p className="eyebrow mb-3">Paso {step + 1} de 6</p>
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
              <Field id="email" label="Correo electrónico" error={errors.email} className="sm:col-span-2">
                <input {...inputProps("email", errors.email)} type="email" autoComplete="email" value={customer.email} onChange={(e) => setCustomerLocal({ ...customer, email: e.target.value })} />
              </Field>
              <Field id="name" label="Nombre completo" error={errors.name}>
                <input {...inputProps("name", errors.name)} autoComplete="name" value={customer.name} onChange={(e) => setCustomerLocal({ ...customer, name: e.target.value })} />
              </Field>
              <Field id="phone" label="Teléfono (10 dígitos)" error={errors.phone}>
                <input {...inputProps("phone", errors.phone)} type="tel" inputMode="tel" autoComplete="tel-national" value={customer.phone} onChange={(e) => setCustomerLocal({ ...customer, phone: e.target.value })} />
              </Field>
              <p className="text-xs text-fog sm:col-span-2">Te enviaremos la confirmación y el número de guía a este correo.</p>
              <div className="flex items-center justify-between sm:col-span-2">
                <Link href="/cart" className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-fog hover:text-bone"><ChevronLeft className="h-4 w-4" /> Carrito</Link>
                <Button type="submit" size="lg">Continuar</Button>
              </div>
            </form>
          )}

          {/* 2. Dirección de envío */}
          {step === 1 && (
            <form noValidate onSubmit={(e) => { e.preventDefault(); submitAddress(); }} className="grid gap-5 sm:grid-cols-6">
              <Field id="recipient" label="Nombre de quien recibe" error={errors.recipient} className="sm:col-span-6">
                <input {...inputProps("recipient", errors.recipient)} autoComplete="shipping name" value={address.recipient} onChange={(e) => setAddressLocal({ ...address, recipient: e.target.value })} />
              </Field>
              <Field id="street" label="Calle" error={errors.street} className="sm:col-span-4">
                <input {...inputProps("street", errors.street)} autoComplete="shipping address-line1" value={address.street} onChange={(e) => setAddressLocal({ ...address, street: e.target.value })} />
              </Field>
              <Field id="extNumber" label="Núm. ext." error={errors.extNumber} className="sm:col-span-1">
                <input {...inputProps("extNumber", errors.extNumber)} value={address.extNumber} onChange={(e) => setAddressLocal({ ...address, extNumber: e.target.value })} />
              </Field>
              <Field id="intNumber" label="Núm. int." optional className="sm:col-span-1">
                <input {...inputProps("intNumber")} value={address.intNumber} onChange={(e) => setAddressLocal({ ...address, intNumber: e.target.value })} />
              </Field>
              <Field id="neighborhood" label="Colonia" error={errors.neighborhood} className="sm:col-span-4">
                <input {...inputProps("neighborhood", errors.neighborhood)} autoComplete="shipping address-line2" value={address.neighborhood} onChange={(e) => setAddressLocal({ ...address, neighborhood: e.target.value })} />
              </Field>
              <Field id="postalCode" label="Código postal" error={errors.postalCode} className="sm:col-span-2">
                <input {...inputProps("postalCode", errors.postalCode)} inputMode="numeric" maxLength={5} autoComplete="shipping postal-code" value={address.postalCode} onChange={(e) => setAddressLocal({ ...address, postalCode: e.target.value.replace(/\D/g, "") })} />
              </Field>
              <Field id="city" label="Ciudad o municipio" error={errors.city} className="sm:col-span-3">
                <input {...inputProps("city", errors.city)} autoComplete="shipping address-level2" value={address.city} onChange={(e) => setAddressLocal({ ...address, city: e.target.value })} />
              </Field>
              <Field id="state" label="Estado" error={errors.state} className="sm:col-span-3">
                <select {...inputProps("state", errors.state)} autoComplete="shipping address-level1" value={address.state} onChange={(e) => setAddressLocal({ ...address, state: e.target.value })}>
                  <option value="">Selecciona tu estado</option>
                  {MX_STATES.map(([k, name]) => <option key={k} value={k}>{name}</option>)}
                </select>
              </Field>
              <Field id="references" label="Referencias para el repartidor" optional className="sm:col-span-6">
                <textarea {...inputProps("references")} rows={2} value={address.references} onChange={(e) => setAddressLocal({ ...address, references: e.target.value })} placeholder="Entre calles, color de fachada…" />
              </Field>
              <p className="text-xs text-fog sm:col-span-6">Por ahora enviamos solo dentro de México.</p>
              <div className="flex items-center justify-between sm:col-span-6">
                <button type="button" onClick={() => go(0)} className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-fog hover:text-bone"><ChevronLeft className="h-4 w-4" /> Datos</button>
                <Button type="submit" size="lg">Continuar</Button>
              </div>
            </form>
          )}

          {/* 3. Método de envío */}
          {step === 2 && (
            <div className="space-y-6">
              <p className="text-sm text-mist">
                Enviando a <strong className="text-bone">{address.city}, {stateName(address.state)}</strong>
              </p>
              {quote && quote.shipping.options.length > 0 ? (
                <ShippingOptions quote={quote} onSelect={(id) => setShipping(address.state, id)} />
              ) : (
                <div className="h-28 animate-pulse bg-coal" aria-busy />
              )}
              {quote?.totals.freeShipping && <p className="text-xs text-ember">Tu pedido tiene envío gratis.</p>}
              {errors.rateId && <p className="text-xs text-ember">{errors.rateId}</p>}
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => go(1)} className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-fog hover:text-bone"><ChevronLeft className="h-4 w-4" /> Dirección</button>
                <Button type="button" size="lg" onClick={submitShipping} disabled={!quote || loading}>Continuar</Button>
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
                      <p className="text-xs text-fog">{i.variantLabel} · Cantidad {i.quantity}</p>
                      {issueFor(i.variantId) && <p className="mt-1 text-xs text-ember">{issueFor(i.variantId)}</p>}
                    </div>
                    <p className="text-sm tabular-nums">{formatMXN(i.unitPrice * i.quantity)}</p>
                  </li>
                ))}
              </ul>
              <ReviewBlock title="Contacto" onEdit={() => go(0)}>
                <p className="text-bone">{customer.name}</p>
                <p>{customer.email} · {customer.phone}</p>
              </ReviewBlock>
              <ReviewBlock title="Envío a" onEdit={() => go(1)}>
                <p className="text-bone">{address.recipient}</p>
                <p>{address.street} {address.extNumber}{address.intNumber ? ` int. ${address.intNumber}` : ""}, {address.neighborhood}</p>
                <p>{address.postalCode} {address.city}, {stateName(address.state)}</p>
              </ReviewBlock>
              <ReviewBlock title="Método de envío" onEdit={() => go(2)}>
                <p>{selectedRate ? `${selectedRate.name} · ${selectedRate.eta}` : "—"}</p>
              </ReviewBlock>
              {blocking && (
                <p className="mt-6 text-sm text-ember">
                  Hay productos sin inventario. <Link href="/cart" className="underline">Actualiza tu carrito</Link> para continuar.
                </p>
              )}
              <div className="mt-8 flex items-center justify-between">
                <button type="button" onClick={() => go(2)} className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-fog hover:text-bone"><ChevronLeft className="h-4 w-4" /> Envío</button>
                <Button type="button" size="lg" onClick={() => go(4)} disabled={blocking || !quote || loading}>Ir al pago</Button>
              </div>
            </div>
          )}

          {/* 5. Pago */}
          {step === 4 && (
            <div className="space-y-6">
              <label className="flex items-start gap-3 border border-smoke bg-coal p-4 text-sm text-mist">
                <input type="checkbox" className="mt-1 accent-ember" checked={acceptTerms} onChange={(e) => { setAcceptTerms(e.target.checked); setErrors({}); }} aria-invalid={Boolean(errors.acceptTerms)} />
                <span>
                  Acepto los <Link href="/legal/terminos" target="_blank" className="underline underline-offset-2 hover:text-bone">términos y condiciones</Link>, la{" "}
                  <Link href="/legal/envios-y-devoluciones" target="_blank" className="underline underline-offset-2 hover:text-bone">política de envíos y devoluciones</Link> y el{" "}
                  <Link href="/legal/privacidad" target="_blank" className="underline underline-offset-2 hover:text-bone">aviso de privacidad</Link>.
                </span>
              </label>
              {errors.acceptTerms && <p className="text-xs text-ember">{errors.acceptTerms}</p>}

              <fieldset className="space-y-2">
                <legend className="sr-only">Método de pago</legend>
                {(
                  [
                    {
                      value: "mercadopago" as CheckoutPayment,
                      icon: CreditCard,
                      title: "Tarjeta o efectivo",
                      note: mpEnabled ? "Crédito, débito (hasta 12 meses) u OXXO, vía Mercado Pago." : "Pendiente de configurar las credenciales de Mercado Pago.",
                      enabled: mpEnabled,
                    },
                    {
                      value: "spei" as CheckoutPayment,
                      icon: Landmark,
                      title: "Transferencia SPEI",
                      note: mpEnabled ? "Te damos los datos para transferir desde tu banca en línea." : "Pendiente de configurar las credenciales de Mercado Pago.",
                      enabled: mpEnabled,
                    },
                    ...(paymentOptions.test
                      ? [{ value: "test" as CheckoutPayment, icon: FlaskConical, title: "Pago de prueba (simulado)", note: "Solo en desarrollo: confirma el pedido sin cobrar.", enabled: true }]
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
              {errors.paymentMethod && <p className="text-xs text-ember">{errors.paymentMethod}</p>}

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
                  <p className="border border-dashed border-smoke p-5 text-sm text-fog">Acepta los términos para mostrar las opciones de pago.</p>
                )
              )}

              <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => go(3)} className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-fog hover:text-bone"><ChevronLeft className="h-4 w-4" /> Resumen</button>
                {(method === "test" || method === "spei") && (
                  <Button type="button" size="lg" onClick={() => pay()} disabled={submitting || !quote || loading} aria-busy={submitting}>
                    <Lock className="h-4 w-4" />
                    {submitting
                      ? "Procesando…"
                      : method === "spei"
                        ? "Obtener datos de transferencia"
                        : `Pagar ${quote ? formatMXN(quote.totals.total) : ""}`}
                  </Button>
                )}
              </div>
              <p className="flex items-center gap-2 text-xs text-fog">
                <ShieldCheck className="h-4 w-4 shrink-0 text-mist" aria-hidden /> Los datos de tu tarjeta los procesa Mercado Pago; nunca pasan por este sitio. Tu pedido se aparta mientras completas el pago.
              </p>
            </div>
          )}
        </section>

        {/* Resumen escritorio */}
        <aside className="hidden lg:col-span-5 lg:block" aria-label="Resumen del pedido">
          <div className="sticky top-28 border border-smoke bg-coal p-8">
            <p className="eyebrow mb-5">Tu pedido</p>
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
          <p className="mb-4 text-xs text-mist">Código {quote.discount.code}: {quote.discount.label}</p>
        )}
        <TotalsList totals={quote?.totals} loading={loading} className="border-t border-smoke pt-5" />
      </>
    );
  }
}
