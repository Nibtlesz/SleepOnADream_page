"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { sendContactMessage } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { msg } from "@/i18n";
import { useI18n } from "@/i18n/client";
import type { FormState } from "@/lib/validation/schemas";
import { AntiSpamFields } from "./AntiSpamFields";

const initial: FormState = { status: "idle" };

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, initial);
  const { t } = useI18n();
  const e = state.fieldErrors ?? {};

  const FieldError = ({ id, errors }: { id: string; errors?: string[] }) =>
    errors?.length ? <p id={id} className="mt-1.5 text-xs text-ember">{msg(t, errors[0])}</p> : null;

  if (state.status === "success") {
    return (
      <div role="status" className="flex flex-col items-start gap-4 border border-smoke bg-coal p-10">
        <CheckCircle2 className="h-10 w-10 text-ember" strokeWidth={1.4} />
        <p className="display text-3xl">{t.contact.sent}</p>
        <p className="text-mist">{msg(t, state.message)}</p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="relative grid gap-5 sm:grid-cols-2">
      <AntiSpamFields />
      <div>
        <label htmlFor="c-name" className="eyebrow mb-2 block">{t.contact.name}</label>
        <input id="c-name" name="name" required autoComplete="name" className="field" aria-invalid={Boolean(e.name)} aria-describedby="c-name-e" />
        {FieldError({ id: "c-name-e", errors: e.name })}
      </div>
      <div>
        <label htmlFor="c-email" className="eyebrow mb-2 block">{t.contact.email}</label>
        <input id="c-email" name="email" type="email" required autoComplete="email" className="field" aria-invalid={Boolean(e.email)} aria-describedby="c-email-e" />
        {FieldError({ id: "c-email-e", errors: e.email })}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="c-topic" className="eyebrow mb-2 block">{t.contact.topic}</label>
        <select id="c-topic" name="topic" defaultValue="" className="field" aria-invalid={Boolean(e.topic)} aria-describedby="c-topic-e">
          <option value="" disabled>{t.contact.selectOption}</option>
          <option value="general">{t.contact.topics.general}</option>
          <option value="booking">{t.contact.topics.booking}</option>
          <option value="press">{t.contact.topics.press}</option>
          <option value="store">{t.contact.topics.store}</option>
        </select>
        {FieldError({ id: "c-topic-e", errors: e.topic })}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="c-msg" className="eyebrow mb-2 block">{t.contact.message}</label>
        <textarea id="c-msg" name="message" rows={6} required className="field resize-y" aria-invalid={Boolean(e.message)} aria-describedby="c-msg-e" />
        {FieldError({ id: "c-msg-e", errors: e.message })}
      </div>
      <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-fog">{t.contact.privacyNote}</p>
        <Button type="submit" size="lg" disabled={pending}>{pending ? t.common.sending : t.contact.send}</Button>
      </div>
      {state.status === "error" && state.message && (
        <p role="alert" className="text-sm text-ember sm:col-span-2">{msg(t, state.message)}</p>
      )}
    </form>
  );
}
