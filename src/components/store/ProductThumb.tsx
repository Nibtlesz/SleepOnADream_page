import Image from "next/image";
import { ProductArt } from "@/components/ui/Art";
import { cn } from "@/lib/cn";
import type { ArtKind } from "@/lib/types";

/**
 * Imagen de un producto: la foto real si existe; si no, la ilustración provisional.
 * Mantiene la proporción 4:5 de las fotos de la tienda.
 */
export function ProductThumb({
  image,
  alt,
  kind,
  color,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority = false,
  className,
}: {
  image?: string | null;
  alt: string;
  kind: ArtKind;
  color?: string | null;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  if (!image) return <ProductArt kind={kind} color={color} className={className} />;
  return (
    <div className={cn("relative aspect-[4/5] w-full overflow-hidden bg-ash", className)}>
      <Image src={image} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}
