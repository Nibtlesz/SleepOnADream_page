/**
 * Seed de desarrollo: carga los DATOS DE EJEMPLO (marcados con isSample) y,
 * si se definen SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD, crea un administrador.
 * Es idempotente: se puede ejecutar varias veces.
 *
 *   npm run db:seed
 */
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { sampleCategories, sampleProducts } from "../src/data/sample/catalog";
import { sampleMembers, sampleNews, sampleReleases, sampleShows, sampleVideos } from "../src/data/sample/content";
import { sampleDiscounts } from "../src/data/sample/discounts";
import { SHIPPING_ZONES } from "../src/config/store";
import { hashPassword, PASSWORD_MIN_LENGTH } from "../src/server/auth/password";

config({ path: [".env.local", ".env"], quiet: true });
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  // Categorías
  for (const [i, c] of sampleCategories.entries()) {
    await db.category.upsert({ where: { slug: c.slug }, create: { ...c, position: i }, update: { name: c.name, position: i } });
  }
  const cats = Object.fromEntries((await db.category.findMany()).map((c) => [c.slug, c.id]));

  // Productos y variantes (se conservan los IDs de variante para no romper carritos existentes)
  for (const p of sampleProducts) {
    const status = p.status === "SOLD_OUT" ? "ACTIVE" : p.status;
    const data = {
      name: p.name,
      description: p.description,
      basePrice: p.basePrice,
      compareAt: p.compareAt,
      status,
      isExclusive: p.isExclusive,
      isBundle: p.isBundle,
      isSample: true,
      art: p.art,
      categoryId: cats[p.category.slug],
    } as const;
    const product = await db.product.upsert({ where: { slug: p.slug }, create: { slug: p.slug, ...data }, update: data });
    for (const v of p.variants) {
      await db.productVariant.upsert({
        where: { id: v.id },
        create: { id: v.id, productId: product.id, sku: v.sku, size: v.size, color: v.color, price: v.price, stock: v.stock },
        update: { sku: v.sku, size: v.size, color: v.color, price: v.price },
      });
    }
  }
  for (const p of sampleProducts) {
    await db.product.update({
      where: { slug: p.slug },
      data: { related: { set: p.relatedSlugs.map((slug) => ({ slug })) } },
    });
  }

  // Descuentos de ejemplo
  for (const d of sampleDiscounts) {
    await db.discountCode.upsert({
      where: { code: d.code },
      create: { code: d.code, type: d.type, value: d.value, minSubtotal: d.minSubtotal ?? null, active: d.active },
      update: {},
    });
  }

  // Envíos
  for (const z of SHIPPING_ZONES) {
    await db.shippingZone.upsert({ where: { id: z.id }, create: { id: z.id, name: z.name, states: [...z.states] }, update: { name: z.name, states: [...z.states] } });
    for (const r of z.rates) {
      await db.shippingRate.upsert({
        where: { id: r.id },
        create: { id: r.id, zoneId: z.id, name: r.name, price: r.price, etaDaysMin: r.etaDaysMin, etaDaysMax: r.etaDaysMax },
        update: {},
      });
    }
  }

  // Contenido: se reemplaza solo lo marcado como ejemplo
  await db.track.deleteMany({ where: { release: { isSample: true } } });
  await db.video.deleteMany({ where: { isSample: true } });
  await db.release.deleteMany({ where: { isSample: true } });
  for (const r of sampleReleases) {
    await db.release.create({
      data: {
        slug: r.slug, title: r.title, type: r.type, releaseDate: new Date(r.releaseDate), description: r.description,
        isFeatured: r.isFeatured, published: true, isSample: true,
        tracks: { create: r.tracks.map((t) => ({ position: t.position, title: t.title, durationS: t.durationS })) },
      },
    });
  }
  for (const v of sampleVideos) {
    await db.video.create({
      data: { slug: v.slug, title: v.title, youtubeId: v.youtubeId, publishedAt: new Date(v.publishedAt), isFeatured: v.isFeatured, published: true, isSample: true },
    });
  }
  await db.show.deleteMany({ where: { isSample: true } });
  for (const s of sampleShows) {
    await db.show.create({
      data: { startsAt: new Date(s.startsAt), city: s.city, state: s.state, venue: s.venue, notes: s.notes, status: s.status, published: true, isSample: true },
    });
  }
  await db.newsPost.deleteMany({ where: { isSample: true } });
  for (const n of sampleNews) {
    await db.newsPost.create({
      data: { slug: n.slug, title: n.title, excerpt: n.excerpt, body: n.excerpt, publishedAt: new Date(n.publishedAt), published: true, isSample: true },
    });
  }
  if ((await db.bandMember.count()) === 0) {
    await db.bandMember.createMany({ data: sampleMembers.map((m, i) => ({ name: m.name, role: m.role, position: i })) });
  }

  // Administrador inicial (opcional)
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    if (password.length < PASSWORD_MIN_LENGTH) throw new Error(`SEED_ADMIN_PASSWORD debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`);
    const exists = await db.user.findUnique({ where: { email } });
    if (!exists) {
      await db.user.create({ data: { email, name: "Administrador", role: "ADMIN", passwordHash: await hashPassword(password) } });
      console.log(`Administrador creado: ${email}`);
    }
  }

  console.log("Seed completado:", {
    productos: await db.product.count(),
    variantes: await db.productVariant.count(),
    lanzamientos: await db.release.count(),
    videos: await db.video.count(),
    conciertos: await db.show.count(),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
