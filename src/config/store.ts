/**
 * Reglas comerciales de la tienda. En la Fase 4 se moverán a la base de datos
 * (modelos ShippingZone / ShippingRate / DiscountCode) y serán editables desde el panel.
 * Montos en centavos de MXN.
 */
export const storeConfig = {
  currency: "MXN",
  freeShippingOver: 150_000, // $1,500 MXN
  maxQtyPerItem: 10,
  reservationMinutes: 30,
} as const;

export const MX_STATES = [
  ["AGS", "Aguascalientes"], ["BC", "Baja California"], ["BCS", "Baja California Sur"],
  ["CAMP", "Campeche"], ["CHIS", "Chiapas"], ["CHIH", "Chihuahua"], ["CDMX", "Ciudad de México"],
  ["COAH", "Coahuila"], ["COL", "Colima"], ["DGO", "Durango"], ["MEX", "Estado de México"],
  ["GTO", "Guanajuato"], ["GRO", "Guerrero"], ["HGO", "Hidalgo"], ["JAL", "Jalisco"],
  ["MICH", "Michoacán"], ["MOR", "Morelos"], ["NAY", "Nayarit"], ["NL", "Nuevo León"],
  ["OAX", "Oaxaca"], ["PUE", "Puebla"], ["QRO", "Querétaro"], ["QROO", "Quintana Roo"],
  ["SLP", "San Luis Potosí"], ["SIN", "Sinaloa"], ["SON", "Sonora"], ["TAB", "Tabasco"],
  ["TAMS", "Tamaulipas"], ["TLAX", "Tlaxcala"], ["VER", "Veracruz"], ["YUC", "Yucatán"],
  ["ZAC", "Zacatecas"],
] as const;

export type MxStateCode = (typeof MX_STATES)[number][0];

export interface ShippingZone {
  id: string;
  name: string;
  states: readonly string[];
  rates: Array<{ id: string; name: string; price: number; etaDaysMin: number; etaDaysMax: number }>;
}

/** Zonas de ENVÍO DE EJEMPLO — tarifas por confirmar con la paquetería. */
export const SHIPPING_ZONES: ShippingZone[] = [
  {
    id: "centro",
    name: "Centro",
    states: ["CDMX", "MEX", "HGO", "MOR", "PUE", "QRO", "TLAX", "GTO", "AGS", "SLP"],
    rates: [
      { id: "centro-std", name: "Estándar", price: 12_900, etaDaysMin: 2, etaDaysMax: 4 },
      { id: "centro-exp", name: "Express", price: 22_900, etaDaysMin: 1, etaDaysMax: 2 },
    ],
  },
  {
    id: "norte",
    name: "Norte",
    states: ["BC", "BCS", "SON", "CHIH", "COAH", "NL", "TAMS", "SIN", "DGO", "ZAC", "NAY"],
    rates: [
      { id: "norte-std", name: "Estándar", price: 15_900, etaDaysMin: 3, etaDaysMax: 6 },
      { id: "norte-exp", name: "Express", price: 27_900, etaDaysMin: 1, etaDaysMax: 3 },
    ],
  },
  {
    id: "occidente-sur",
    name: "Occidente y Sur",
    states: ["JAL", "COL", "MICH", "GRO", "OAX", "CHIS", "VER", "TAB", "CAMP", "YUC", "QROO"],
    rates: [
      { id: "sur-std", name: "Estándar", price: 15_900, etaDaysMin: 3, etaDaysMax: 6 },
      { id: "sur-exp", name: "Express", price: 27_900, etaDaysMin: 2, etaDaysMax: 3 },
    ],
  },
];
