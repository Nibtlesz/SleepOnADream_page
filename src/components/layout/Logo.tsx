import Image from "next/image";
import { cn } from "@/lib/cn";

const LOGOS = {
  /** Dos líneas: portada, footer, login. */
  stacked: { src: "/brand/logo.webp", width: 1500, height: 838 },
  /** Una línea: header. */
  horizontal: { src: "/brand/logo-horizontal.webp", width: 2000, height: 263 },
} as const;

/**
 * Logotipo oficial (public/brand/, fondo transparente).
 * El tamaño lo define quien lo usa: `h-10 w-auto` (por altura) o `w-64 h-auto` (por ancho).
 */
export function Logo({
  className,
  priority = false,
  sizes = "120px",
  variant = "stacked",
}: {
  className?: string;
  priority?: boolean;
  sizes?: string;
  variant?: keyof typeof LOGOS;
}) {
  const logo = LOGOS[variant];
  return (
    <Image
      src={logo.src}
      alt="Sleep On a Dream"
      width={logo.width}
      height={logo.height}
      priority={priority}
      sizes={sizes}
      className={cn("select-none", className)}
      draggable={false}
    />
  );
}

/** Símbolo oficial de la banda (public/brand/simbolo.webp). */
export function BrandSymbol({ className, alt = "" }: { className?: string; alt?: string }) {
  return (
    <Image
      src="/brand/simbolo.webp"
      alt={alt}
      width={2000}
      height={1737}
      sizes="64px"
      className={cn("select-none", className)}
      draggable={false}
    />
  );
}
