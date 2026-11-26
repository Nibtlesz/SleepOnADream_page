/**
 * Merch OFICIAL de la banda. Se carga con el seed (el inventario solo se fija al crear cada talla:
 * volver a correr el seed no repone piezas vendidas) y se muestra cuando el sitio funciona sin base
 * de datos. Para cambiar precios, existencias o fotos, usa el panel (/admin/productos).
 * Fotos en public/images/merch/ (recortadas a 4:5): primero la espalda, luego el frente.
 */
import type { Product, ProductVariant } from "@/lib/types";
import { sampleCategories } from "@/data/sample/catalog";

/** Tallas en el orden en que se muestran. */
export const TEE_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

const playeras = sampleCategories.find((c) => c.slug === "playeras")!;

function tee(key: string, stockPerSize: number): ProductVariant[] {
  return TEE_SIZES.map((size) => ({
    id: `${key}-${size.toLowerCase()}`,
    sku: `SOAD-${key.toUpperCase()}-${size}`,
    size,
    color: null,
    price: null,
    stock: stockPerSize,
  }));
}

function product(p: {
  key: string;
  name: string;
  description: string;
  images: Array<{ file: string; alt: string }>;
  related: string[];
}): Product {
  return {
    id: `prod-${p.key}`,
    slug: `playera-${p.key}`,
    name: p.name,
    description: p.description,
    basePrice: 35_000, // $350 MXN (centavos)
    compareAt: null,
    status: "ACTIVE",
    category: playeras,
    art: "tee",
    images: p.images.map((i) => ({ url: `/images/merch/${i.file}`, alt: i.alt })),
    variants: tee(p.key, 5),
    relatedSlugs: p.related,
    isExclusive: false,
    isBundle: false,
    isSample: false,
  };
}

export const officialProducts: Product[] = [
  product({
    key: "askis",
    name: "Playera Askis",
    description:
      "Playera negra inspirada en nuestro cover de “Amor Regresa” (Los Askis): ilustración y letra al reverso, logo “Los Sleep” al frente.",
    images: [
      { file: "askis-espalda.jpg", alt: "Playera Askis, espalda con el diseño de Amor Regresa" },
      { file: "askis-frente.jpg", alt: "Playera Askis, frente con el logo Los Sleep" },
    ],
    related: ["playera-brutal", "playera-alien"],
  }),
  product({
    key: "brutal",
    name: "Playera Brutal",
    description:
      "Playera negra con el nombre de la banda en tipografía brutal al reverso y el símbolo de Sleep On A Dream al frente.",
    images: [
      { file: "brutal-espalda.jpg", alt: "Playera Brutal, espalda con el logo en tipografía brutal" },
      { file: "brutal-frente.jpg", alt: "Playera Brutal, frente con el símbolo de la banda" },
    ],
    related: ["playera-askis", "playera-alien"],
  }),
  product({
    key: "alien",
    name: "Playera Alien",
    description:
      "Playera negra con ilustración de platillo volador y alien al reverso, y un alien con gorra al frente.",
    images: [
      { file: "alien-espalda.jpg", alt: "Playera Alien, espalda con el platillo volador" },
      { file: "alien-frente.jpg", alt: "Playera Alien, frente con el alien con gorra" },
    ],
    related: ["playera-askis", "playera-brutal"],
  }),
];
