import type { Metadata } from "next";
import { Logo } from "@/components/layout/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-5">
      <div className="w-full max-w-sm">
        <Logo className="text-3xl" />
        <p className="eyebrow mt-3 mb-10">Panel administrativo</p>
        <LoginForm />
        <p className="mt-8 text-xs text-fog">Acceso exclusivo para personal autorizado. Las acciones quedan registradas.</p>
      </div>
    </div>
  );
}
