# Sleep On a Dream — Sitio oficial

Sitio oficial de la banda con música, videos, fechas de concierto y tienda en línea propia.

> ⚠️ Todo el contenido actual (lanzamientos, fechas, integrantes, productos, precios) es **de ejemplo**
> y está marcado visualmente como tal. No es información oficial de la banda.

## Requisitos

- Node.js 22+
- PostgreSQL 15+ (para la tienda real y el panel; sin él el sitio funciona con datos de ejemplo en memoria)

## Desarrollo

```bash
cp .env.example .env.local
npm install
```

Base de datos local (Prisma Postgres; no requiere Docker). Copia la URL `postgres://…` que imprime a
`DATABASE_URL` en `.env.local` y pon `DATABASE_POOL_MAX="1"`:

```bash
npm run db:dev
```

Crea las tablas y carga los datos de ejemplo (y el administrador de `SEED_ADMIN_*`):

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

```bash
npm run dev
```

Sitio: http://localhost:3000 · Panel: http://localhost:3000/admin

Códigos de descuento de prueba: `EJEMPLO10` (10 %) y `ENVIOGRATIS` (mínimo $800).

En desarrollo, el paso de pago ofrece **"Pago de prueba (simulado)"**, que confirma el pedido sin cobrar.
No existe en producción. Sin base de datos, los pedidos se guardan en memoria y se pierden al reiniciar.

Para cobrar con Mercado Pago (tarjeta, OXXO y SPEI) sigue "Puesta en marcha de Mercado Pago" en
[docs/ARQUITECTURA.md](docs/ARQUITECTURA.md).

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Genera el cliente de Prisma y compila para producción |
| `npm run lint` / `npm run typecheck` | Calidad de código |
| `npm run db:dev` | Levanta PostgreSQL local en segundo plano (Prisma Postgres) |
| `npm run db:migrate` | Aplica migraciones de Prisma (requiere `DATABASE_URL`) |
| `npm run db:seed` | Carga datos de ejemplo y el administrador inicial (idempotente) |
| `npm run user:create -- correo ROL "Nombre"` | Crea o actualiza un usuario del panel (`ADMIN`, `STORE_MANAGER`, `EDITOR`) |
| `npm run db:studio` | Explorador de la base de datos |

## Documentación

- [Arquitectura, flujo de la tienda, seguridad y fases](docs/ARQUITECTURA.md)
