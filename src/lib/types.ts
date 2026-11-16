/**
 * Tipos de dominio que consume la interfaz. Son independientes de Prisma:
 * la capa `src/server/queries` traduce de la base de datos (o de los datos de
 * ejemplo) a estos tipos, de modo que los componentes no dependen del ORM.
 * Fechas en ISO 8601; montos en centavos de MXN.
 */

/** Tipo de arte provisional mientras no hay fotografías reales. */
export type ArtKind = "tee" | "hoodie" | "cap" | "vinyl" | "cd" | "patch" | "bundle" | "tote";

export interface Release {
  slug: string;
  title: string;
  type: "ALBUM" | "EP" | "SINGLE";
  releaseDate: string;
  description: string;
  coverImageUrl: string | null;
  tracks: Array<{ position: number; title: string; durationS: number | null }>;
  links: { spotify: string | null; appleMusic: string | null; youtubeMusic: string | null };
  embedUrl: string | null;
  isFeatured: boolean;
  isSample: boolean;
}

export interface Video {
  slug: string;
  title: string;
  youtubeId: string | null;
  thumbnailUrl: string | null;
  publishedAt: string;
  isFeatured: boolean;
  isSample: boolean;
}

export interface Show {
  id: string;
  startsAt: string;
  city: string;
  state: string;
  venue: string;
  posterUrl: string | null;
  ticketUrl: string | null;
  notes: string | null;
  status: "SCHEDULED" | "SOLD_OUT" | "CANCELLED" | "POSTPONED";
  isSample: boolean;
}

export interface NewsPost {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  isSample: boolean;
}

export interface BandMember {
  id: string;
  name: string;
  role: string;
  photoUrl: string | null;
}

export interface Category {
  slug: string;
  name: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  price: number | null;
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  basePrice: number;
  compareAt: number | null;
  status: "ACTIVE" | "COMING_SOON" | "SOLD_OUT";
  category: Category;
  art: ArtKind;
  images: Array<{ url: string; alt: string }>;
  variants: ProductVariant[];
  relatedSlugs: string[];
  isExclusive: boolean;
  isBundle: boolean;
  isSample: boolean;
}
