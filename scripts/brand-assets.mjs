/**
 * Genera los íconos del sitio a partir de los archivos oficiales de marca:
 *   public/brand/simbolo.webp → src/app/icon.png, apple-icon.png, favicon.ico
 *   public/brand/logo.webp    → src/app/opengraph-image.png
 * Volver a ejecutar si la banda entrega una nueva versión:  npm run brand:icons
 */
import { writeFile } from "node:fs/promises";
import sharp from "sharp";

const BG = { r: 7, g: 7, b: 8, alpha: 1 }; // --color-ink
const SYMBOL = "public/brand/simbolo.webp";
const LOGO = "public/brand/logo.webp";

/** Símbolo centrado sobre fondo oscuro (se ve tanto en pestañas claras como oscuras). */
async function symbolTile(size, { padding = 0.16, radius = 0.18 } = {}) {
  const inner = Math.round(size * (1 - padding * 2));
  const symbol = await sharp(SYMBOL).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const r = Math.round(size * radius);
  const mask = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}"/></svg>`);
  const base = sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: symbol, gravity: "center" }])
    .png();
  if (!radius) return base.toBuffer();
  return sharp(await base.toBuffer()).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

/** ICO con PNG embebidos (formato admitido por todos los navegadores actuales). */
function toIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4); // planos
    e.writeUInt16LE(32, 6); // bits por pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

await writeFile("src/app/icon.png", await symbolTile(512));
await writeFile("src/app/apple-icon.png", await symbolTile(180, { padding: 0.14, radius: 0 })); // iOS redondea solo
await writeFile(
  "src/app/favicon.ico",
  toIco(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await symbolTile(size, { padding: 0.08, radius: 0.2 }) })))),
);

// Imagen para redes sociales (1200×630): logo sobre fondo oscuro con un halo rojo.
const logo = await sharp(LOGO).resize({ width: 640 }).png().toBuffer();
const glow = Buffer.from(
  `<svg width="1200" height="630"><defs><radialGradient id="g" cx="70%" cy="35%" r="60%"><stop offset="0" stop-color="#3a050b"/><stop offset="1" stop-color="#070708"/></radialGradient></defs><rect width="1200" height="630" fill="url(#g)"/></svg>`,
);
await sharp(glow).composite([{ input: logo, gravity: "center" }]).png().toFile("src/app/opengraph-image.png");

console.log("Íconos de marca generados.");
