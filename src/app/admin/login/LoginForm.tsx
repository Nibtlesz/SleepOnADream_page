"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { login, type LoginState } from "../auth-actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="email" className="eyebrow mb-2 block">Correo</label>
        <input id="email" name="email" type="email" required autoComplete="username" className="field" />
      </div>
      <div>
        <label htmlFor="password" className="eyebrow mb-2 block">Contraseña</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
      </div>
      {state.error && <p role="alert" className="text-sm text-ember">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 bg-blood text-[0.7rem] font-semibold uppercase tracking-[0.18em] transition-colors hover:bg-ember disabled:opacity-50"
      >
        <Lock className="h-4 w-4" /> {pending ? "Verificando…" : "Entrar"}
      </button>
    </form>
  );
}
