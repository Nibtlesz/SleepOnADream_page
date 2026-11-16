# Sleep On a Dream — Sitio oficial

Sitio oficial de la banda con música, videos, fechas de concierto y tienda en línea propia.

> ⚠️ Todo el contenido actual (lanzamientos, fechas, integrantes, productos, precios) es **de ejemplo**
> y está marcado visualmente como tal. No es información oficial de la banda.

## Requisitos

- Node.js 22+
- PostgreSQL 15+ (necesario a partir de la Fase 4; el sitio funciona sin él con datos de ejemplo)

## Desarrollo

```bash
cp .env.example .env.local
npm install
npm run dev
```

Abre http://localhost:3000.

Códigos de descuento de prueba: `EJEMPLO10` (10 %) y `ENVIOGRATIS` (mínimo $800).

En desarrollo, el paso de pago ofrece **"Pago de prueba (simulado)"**, que confirma el pedido sin cobrar.
No existe en producción. Sin base de datos, los pedidos se guardan en memoria y se pierden al reiniciar.

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Genera el cliente de Prisma y compila para producción |
| `npm run lint` / `npm run typecheck` | Calidad de código |
| `npm run db:migrate` | Aplica migraciones de Prisma (requiere `DATABASE_URL`) |
| `npm run db:studio` | Explorador de la base de datos |

## Documentación

- [Arquitectura, flujo de la tienda, seguridad y fases](docs/ARQUITECTURA.md)
