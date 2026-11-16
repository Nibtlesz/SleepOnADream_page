# Arquitectura — Sitio oficial de Sleep On a Dream

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Cache Components, Turbopack) + React 19 + TypeScript |
| Estilos | Tailwind CSS 4 (tokens de diseño en `src/app/globals.css`) |
| Animación | Motion (`motion/react`, sucesor de Framer Motion) |
| Estado del carrito | Zustand + `persist` (localStorage) |
| Validación | Zod 4 (esquemas compartidos cliente/servidor) |
| Base de datos | PostgreSQL + Prisma 7 (`@prisma/adapter-pg`) |
| Autenticación (Fase 4) | Auth.js con roles (`ADMIN`, `STORE_MANAGER`, `EDITOR`, `CUSTOMER`) |
| Pagos (Fase 5) | Mercado Pago (Payment Brick) o Stripe (Payment Element) |
| Correo (Fase 5) | Proveedor vía API (Resend / Postmark / SES) |
| Imágenes (Fase 4) | Almacenamiento de objetos S3-compatible (S3 / Cloudflare R2) + `next/image` |

## Estructura de carpetas

```
prisma/
  schema.prisma            Modelo de datos completo (contenido, tienda, pedidos, pagos, auditoría)
src/
  app/
    layout.tsx             Raíz: fuentes, metadatos globales, <html lang="es-MX">
    actions.ts             Server Actions públicas (contacto, newsletter) con antispam
    (site)/                Sitio público (header + footer + carrito lateral)
      page.tsx             HOME
      music/ videos/ tour/ about/ contact/
      store/ store/[slug]/ cart/
      legal/[slug]/        Aviso de privacidad, términos, envíos y devoluciones
    api/cart/quote/        POST: cotización autoritativa del carrito
    sitemap.ts robots.ts
    (admin)/  ← Fase 4: panel administrativo con layout propio
  components/
    layout/                Header, footer, logo, redes
    ui/                    Botones, encabezados, Reveal (animación), arte provisional
    home/ music/ videos/ tour/ store/ forms/
  config/
    site.ts                Navegación, redes, correos de contacto, documentos legales
    store.ts               Zonas y tarifas de envío, envío gratis, estados de México
  data/sample/             ⚠️ DATOS DE EJEMPLO (todos con isSample: true)
  lib/
    db.ts                  Cliente Prisma (singleton)
    types.ts               Tipos de dominio que consume la UI (independientes del ORM)
    commerce/pricing.ts    Cálculo de totales (función pura)
    validation/schemas.ts  Esquemas Zod
    format.ts              Moneda MXN, fechas en America/Mexico_City
  server/
    queries/               Lectura de datos con `"use cache"` + `cacheTag`
    services/              Lógica de negocio (cotización, correo; luego checkout, webhooks)
    rate-limit.ts          Límite por IP (cambiar a Redis en multi-instancia)
  store/cart.ts            Carrito persistente (cliente)
```

### Separación de responsabilidades

```
Componentes (UI)  →  server/queries (lectura, caché)  →  data/sample  |  Prisma (Fase 4)
Formularios/API   →  server/services (reglas de negocio)  →  Prisma / proveedores externos
```

- Los componentes solo conocen `lib/types.ts`; cambiar de datos de ejemplo a Prisma no toca la UI.
- Las consultas usan `"use cache"` + `cacheTag(...)`. Cuando el panel guarde un cambio llamará a
  `revalidateTag("catalog")`, `revalidateTag("shows")`, etc.
- El historial de conciertos se calcula por fecha: los eventos pasados se mueven solos, sin cron.

## Tienda: flujo y garantías

1. **Carrito (cliente):** guarda variante, cantidad, precio *de referencia*, estado y tarifa de envío en localStorage.
2. **Cotización (servidor) `POST /api/cart/quote`:** recalcula precios desde el catálogo, valida
   estado del producto e inventario disponible (descontando lo ya apartado), aplica el código de
   descuento y calcula el envío por zona. Nunca se confía en precios enviados por el navegador.
3. **Checkout `/checkout` (6 pasos):** datos del comprador → dirección → método de envío → resumen →
   método de pago → confirmación (`/checkout/pedido/[token]`). Cada paso valida con los esquemas de
   `src/lib/validation/checkout.ts`; el borrador vive en sessionStorage (nunca datos de tarjeta).
4. **Creación del pedido `POST /api/checkout`** (`src/server/services/checkout.ts`):
   - **Idempotencia:** el cliente genera una `idempotencyKey` ligada a la "huella" del pedido. Un doble
     clic, un reintento tras perder la conexión o dos peticiones simultáneas devuelven el mismo pedido
     (clave única en `Order` + recuperación ante violación de unicidad).
   - Se vuelve a cotizar; si cambió precio o inventario responde `409 cart_changed` con la cotización nueva.
   - **Inventario transaccional:** en PostgreSQL, `UPDATE … SET stock = stock - n WHERE id = ? AND stock >= n`
     por cada línea dentro de una transacción; si alguna no se actualiza, se revierte todo.
     El stock queda apartado hasta `reservedUntil` (30 min).
   - Se guarda una instantánea de nombre, variante y precio de cada producto.
   - La confirmación se consulta con un `accessToken` aleatorio (no con el número de pedido).
5. **Pago:** solo se confirma desde `applyPaymentResult` (`src/server/services/payments.ts`), que llaman
   - el webhook verificado `POST /api/webhooks/mercadopago`: valida la firma HMAC `x-signature` con
     ventana de 5 min, consulta el pago en la API de Mercado Pago (no confía en el cuerpo), registra el
     evento en `PaymentEvent` (idempotente) y comprueba que el monto coincida con el total del pedido;
   - el **pago de prueba**, disponible solo fuera de producción, que recorre exactamente el mismo camino.
   Con el pago aprobado: `PENDING_PAYMENT → PAID`, historial en `OrderStatusChange` y correo al comprador.
   Pago rechazado: el pedido se cancela y el inventario se libera.
6. **Expiración:** `GET /api/cron/expire-orders` (protegido con `CRON_SECRET`) cancela pedidos no
   pagados a tiempo y libera inventario; además se ejecuta antes de cada checkout.

Sin `DATABASE_URL`, los pedidos se guardan en memoria del servidor (se pierden al reiniciar) para poder
probar el flujo con los datos de ejemplo.

Estados de pedido: `PENDING_PAYMENT → PAID → PREPARING → SHIPPED → DELIVERED`, además de
`CANCELLED` y `REFUNDED`.

### Pendiente para cobrar de verdad (Fase 5)

- Montar el componente seguro del proveedor en el paso 5 (Payment Brick de Mercado Pago o Payment
  Element de Stripe) y crear el pago en el servidor con `external_reference = order.id`.
- Activar tarjeta / OXXO / SPEI (`PROVIDER_INTEGRATED` en `src/server/payments/config.ts`).
- Webhook de Stripe (si se elige Stripe) con `stripe.webhooks.constructEvent`.
- Programar el cron de expiración en el hosting.

## Seguridad

- Cabeceras HTTP de seguridad en `next.config.ts` (HSTS, nosniff, frame-options, permissions-policy).
  La CSP con nonce se añade en Fase 5, cuando se conozcan los dominios de pago.
- Validación Zod en servidor para toda entrada; los esquemas se reutilizan en el cliente.
- Antispam en formularios: honeypot, tiempo mínimo de llenado y límite de peticiones por IP.
- Variables sensibles solo en `.env.local` / gestor de secretos del hosting (ver `.env.example`).
- `server-only` en módulos de servidor para que nunca se incluyan en el bundle del navegador.
- Panel `/admin` (Fase 4): sesión Auth.js, verificación de rol en cada Server Action y Route Handler
  (no solo en el middleware), y registro en `AdminAuditLog`.

## Cumplimiento en México (pendiente de asesoría legal)

- Aviso de privacidad (LFPDPPP) y consentimiento expreso en el newsletter (campo `consentAt`).
- Términos y condiciones, política de envíos, cambios y devoluciones (LFPC / NOM-247-SE).
- Precios en MXN con IVA incluido; datos del proveedor visibles; facturación CFDI a definir.

## Fases

| Fase | Estado | Contenido |
|---|---|---|
| 1. Diseño y estructura | ✅ | Sistema visual, header/menú móvil, footer, todas las páginas, HOME |
| 2. Contenido musical | ✅ (con datos de ejemplo) | Discografía, videos (reproductor ligero de YouTube), tour + historial, About |
| 3. Comercio | ✅ | Catálogo, filtros, variantes, inventario, carrito persistente, cotización, checkout de 6 pasos, pedidos idempotentes con reserva de inventario |
| 4. Backend y administración | ⏳ | Migraciones, Auth.js, panel (productos, pedidos, contenido, estadísticas), subida de imágenes |
| 5. Integraciones | 🟡 | ✅ webhook de Mercado Pago verificado · ⏳ componente de pago embebido, correos reales, guías de envío |
| 6. Pruebas y despliegue | ⏳ | Pruebas E2E del flujo de compra, auditoría de seguridad, Lighthouse, despliegue |

## Contenido pendiente de la banda

Logotipo oficial (SVG), fotografías, portadas, biografía e historia, integrantes y roles,
enlaces oficiales de redes y plataformas, IDs de YouTube, fechas reales, catálogo con fotos,
precios e inventario, correos de booking/prensa, textos legales.
