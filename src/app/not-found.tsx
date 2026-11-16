import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="eyebrow">Error 404</p>
        <h1 className="display mt-4 text-7xl md:text-9xl">Perdido en el sueño</h1>
        <p className="mt-4 text-mist">La página que buscas no existe.</p>
        <Link href="/" className="mt-8 inline-block bg-blood px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-ember">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
