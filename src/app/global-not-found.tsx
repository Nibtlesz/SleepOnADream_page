import type { Metadata } from "next";
import { fontClasses } from "./fonts";
import "./globals.css";

export const metadata: Metadata = { title: "404 · Sleep On a Dream", robots: { index: false } };

/** 404 para URLs que no coinciden con ninguna ruta (fuera del sitio con idioma y del panel). */
export default function GlobalNotFound() {
  return (
    <html lang="es-MX" className={fontClasses}>
      <body className="grid min-h-dvh place-items-center bg-ink px-6 text-center">
        <div>
          <p className="eyebrow">Error 404</p>
          <h1 className="display mt-4 text-7xl md:text-9xl">Perdido en el sueño</h1>
          <p className="mt-4 text-mist">La página que buscas no existe · The page you&apos;re looking for doesn&apos;t exist.</p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="mt-8 inline-block bg-blood px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-ember">
            Inicio · Home
          </a>
        </div>
      </body>
    </html>
  );
}
