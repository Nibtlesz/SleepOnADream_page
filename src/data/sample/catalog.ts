/**
 * ⚠️ CATÁLOGO DE EJEMPLO — productos, precios e inventario ficticios.
 * Se reemplaza por los productos reales cargados desde el panel (Fase 4).
 */
import type { Category, Product, ProductVariant } from "@/lib/types";

export const sampleCategories: Category[] = [
  { slug: "playeras", name: "Playeras" },
  { slug: "sudaderas", name: "Sudaderas" },
  { slug: "gorras", name: "Gorras" },
  { slug: "musica", name: "Música física" },
  { slug: "accesorios", name: "Accesorios" },
  { slug: "paquetes", name: "Paquetes" },
];

const cat = (slug: string) => sampleCategories.find((c) => c.slug === slug)!;

/** Genera variantes talla × color con inventario determinista (algunas agotadas). */
function apparel(prefix: string, colors: string[], sizes = ["S", "M", "L", "XL", "2XL"]): ProductVariant[] {
  return colors.flatMap((color, ci) =>
    sizes.map((size, si) => ({
      id: `${prefix}-${ci}-${size}`,
      sku: `${prefix.toUpperCase()}-${color.slice(0, 3).toUpperCase()}-${size}`,
      size,
      color,
      price: null,
      stock: (ci * 7 + si * 3) % 11 === 0 ? 0 : ((ci + 2) * (si + 3)) % 14 + 1,
    })),
  );
}

function single(prefix: string, stock: number, color: string | null = null): ProductVariant[] {
  return [{ id: `${prefix}-u`, sku: `${prefix.toUpperCase()}-U`, size: null, color, price: null, stock }];
}

export const sampleProducts: Product[] = [
  {
    id: "p1", slug: "playera-ejemplo-logo", name: "Playera Logo (ejemplo)",
    description: "Producto de ejemplo. Playera de algodón 100 % con logotipo frontal. Descripción, materiales y guía de tallas por definir.",
    basePrice: 49_900, compareAt: null, status: "ACTIVE", category: cat("playeras"), art: "tee", images: [],
    variants: apparel("tee1", ["Negro", "Blanco"]), relatedSlugs: ["sudadera-ejemplo-tour", "gorra-ejemplo"],
    isExclusive: false, isBundle: false, isSample: true,
  },
  {
    id: "p2", slug: "playera-ejemplo-tour", name: "Playera Tour (ejemplo)",
    description: "Producto de ejemplo. Playera con fechas de gira al reverso.",
    basePrice: 54_900, compareAt: null, status: "ACTIVE", category: cat("playeras"), art: "tee", images: [],
    variants: apparel("tee2", ["Negro"]), relatedSlugs: ["playera-ejemplo-logo", "paquete-ejemplo"],
    isExclusive: true, isBundle: false, isSample: true,
  },
  {
    id: "p3", slug: "sudadera-ejemplo-tour", name: "Sudadera (ejemplo)",
    description: "Producto de ejemplo. Sudadera con capucha, felpa perchada, estampado en mangas.",
    basePrice: 99_900, compareAt: 119_900, status: "ACTIVE", category: cat("sudaderas"), art: "hoodie", images: [],
    variants: apparel("hood", ["Negro", "Gris carbón"]), relatedSlugs: ["playera-ejemplo-logo", "gorra-ejemplo"],
    isExclusive: false, isBundle: false, isSample: true,
  },
  {
    id: "p4", slug: "gorra-ejemplo", name: "Gorra bordada (ejemplo)",
    description: "Producto de ejemplo. Gorra de seis paneles con bordado frontal y ajuste trasero.",
    basePrice: 44_900, compareAt: null, status: "ACTIVE", category: cat("gorras"), art: "cap", images: [],
    variants: [...single("cap-n", 12, "Negro"), ...single("cap-r", 0, "Rojo")].map((v, i) => ({ ...v, id: `cap-${i}`, size: "Única" })),
    relatedSlugs: ["playera-ejemplo-logo"], isExclusive: false, isBundle: false, isSample: true,
  },
  {
    id: "p5", slug: "vinilo-ejemplo", name: "Vinilo 12\" (ejemplo)",
    description: "Producto de ejemplo. Edición en vinilo de un lanzamiento. Formato, color y tiraje por confirmar.",
    basePrice: 79_900, compareAt: null, status: "COMING_SOON", category: cat("musica"), art: "vinyl", images: [],
    variants: single("vin", 0), relatedSlugs: ["cd-ejemplo", "paquete-ejemplo"],
    isExclusive: true, isBundle: false, isSample: true,
  },
  {
    id: "p6", slug: "cd-ejemplo", name: "CD (ejemplo)",
    description: "Producto de ejemplo. Disco compacto en empaque digipak.",
    basePrice: 29_900, compareAt: null, status: "ACTIVE", category: cat("musica"), art: "cd", images: [],
    variants: single("cd", 25), relatedSlugs: ["vinilo-ejemplo", "parche-ejemplo"],
    isExclusive: false, isBundle: false, isSample: true,
  },
  {
    id: "p7", slug: "parche-ejemplo", name: "Parche bordado (ejemplo)",
    description: "Producto de ejemplo. Parche bordado para chamarra o mochila.",
    basePrice: 14_900, compareAt: null, status: "ACTIVE", category: cat("accesorios"), art: "patch", images: [],
    variants: single("patch", 40), relatedSlugs: ["tote-ejemplo", "cd-ejemplo"],
    isExclusive: false, isBundle: false, isSample: true,
  },
  {
    id: "p8", slug: "tote-ejemplo", name: "Tote bag (ejemplo)",
    description: "Producto de ejemplo. Bolsa de lona con serigrafía.",
    basePrice: 24_900, compareAt: null, status: "ACTIVE", category: cat("accesorios"), art: "tote", images: [],
    variants: single("tote", 3), relatedSlugs: ["parche-ejemplo"],
    isExclusive: false, isBundle: false, isSample: true,
  },
  {
    id: "p9", slug: "paquete-ejemplo", name: "Paquete especial (ejemplo)",
    description: "Producto de ejemplo. Paquete con playera + CD + parche. Contenido final por definir.",
    basePrice: 74_900, compareAt: 94_700, status: "ACTIVE", category: cat("paquetes"), art: "bundle", images: [],
    variants: apparel("bndl", ["Negro"], ["S", "M", "L", "XL"]), relatedSlugs: ["playera-ejemplo-logo", "cd-ejemplo"],
    isExclusive: true, isBundle: true, isSample: true,
  },
];
