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
| Autenticación | Sesiones propias en PostgreSQL (scrypt + cookie httpOnly) con roles `ADMIN`, `STORE_MANAGER`, `EDITOR` |
| Pagos | Mercado Pago: Payment Brick (tarjetas, OXXO/efectivo) + API de pagos (SPEI) + webhooks |
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
    admin/                 Panel: login/, (panel)/ (resumen, pedidos, productos, descuentos,
                           conciertos, música, videos, bitácora) y actions/ (Server Actions)
  proxy.ts                 Redirección optimista de /admin sin sesión
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
    auth/                  Contraseñas, sesiones, permisos por rol y DAL (requireAdmin)
    admin/                 Consultas del panel (estadísticas, productos)
    audit.ts               Bitácora de acciones administrativas
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
5. **Pago con Mercado Pago** (`src/server/payments/mercadopago.ts`):
   - **Tarjeta y efectivo (OXXO, Paycash, cajeros):** el Payment Brick (`@mercadopago/sdk-react`) captura
     los datos en iframes de Mercado Pago y entrega un token de un solo uso. El servidor crea el pago con
     `POST /v1/payments` usando el **total del pedido calculado en el servidor** (se ignora cualquier
     monto del navegador), `external_reference = order.id`, `notification_url` y `X-Idempotency-Key`
     único por intento.
   - **SPEI:** en México el Brick no ofrece transferencia, así que el servidor crea el pago con
     `payment_method_id: "clabe"` y el comprador recibe referencia e instrucciones.
   - **Resultado inmediato:** `approved` confirma el pedido; `pending` (OXXO/SPEI/revisión) guarda las
     instrucciones y extiende la reserva hasta que vence la ficha; `rejected` deja el pedido pendiente
     para reintentar con otro medio sobre el **mismo** pedido e inventario.
   - **Webhook `POST /api/webhooks/mercadopago`:** valida la firma HMAC `x-signature` (ventana de
     5 min), consulta el pago en la API (no confía en el cuerpo), registra el evento en `PaymentEvent`
     (idempotente) y comprueba que el monto coincida. Así se acreditan OXXO y SPEI cuando el cliente paga.
   - Todo pago aprobado pasa por `applyPaymentResult` (`src/server/services/payments.ts`): el webhook,
     la respuesta inmediata y el pago de prueba (solo fuera de producción) usan el mismo camino.
     Un pago aprobado para un pedido ya cancelado se marca para revisión/reembolso.
6. **Expiración:** `GET /api/cron/expire-orders` (protegido con `CRON_SECRET`) cancela pedidos no
   pagados a tiempo y libera inventario; además se ejecuta antes de cada checkout.

Sin `DATABASE_URL`, los pedidos se guardan en memoria del servidor (se pierden al reiniciar) para poder
probar el flujo con los datos de ejemplo.

Estados de pedido: `PENDING_PAYMENT → PAID → PREPARING → SHIPPED → DELIVERED`, además de
`CANCELLED` y `REFUNDED`.

### Puesta en marcha de Mercado Pago

1. En Mercado Pago > Tus integraciones, crea una aplicación (Checkout API / Bricks) y copia las
   credenciales de **prueba** a `.env.local` junto con `PAYMENT_PROVIDER=mercadopago`.
2. Configura el webhook (evento **Pagos**) apuntando a `https://TU-DOMINIO/api/webhooks/mercadopago`
   y copia la clave secreta a `MERCADOPAGO_WEBHOOK_SECRET`. En local se necesita un túnel HTTPS.
3. Prueba con las tarjetas de prueba de México (titular `APRO` = aprobado, `FUND` = fondos
   insuficientes, `CONT` = pendiente). Los pagos en efectivo quedan `pending` en el entorno de prueba.
4. Cambia a credenciales de producción solo con dominio HTTPS, textos legales y cron configurados.

Pendiente: Status Screen Brick (código de barras OXXO dentro del sitio), reembolsos desde el panel y
mostrar la CLABE en el sitio (la API de pagos no la devuelve; hoy se enlaza a las instrucciones de
Mercado Pago; la API de órdenes `/v1/orders` sí la incluye).

## Seguridad

- Cabeceras HTTP de seguridad en `next.config.ts` (HSTS, nosniff, frame-options, permissions-policy).
  La CSP con nonce se añade en Fase 5, cuando se conozcan los dominios de pago.
- Validación Zod en servidor para toda entrada; los esquemas se reutilizan en el cliente.
- Antispam en formularios: honeypot, tiempo mínimo de llenado y límite de peticiones por IP.
- Variables sensibles solo en `.env.local` / gestor de secretos del hosting (ver `.env.example`).
- `server-only` en módulos de servidor para que nunca se incluyan en el bundle del navegador.
- Panel `/admin`: ver "Panel administrativo" abajo.

## Panel administrativo (`/admin`)

**Autenticación** (`src/server/auth/`). Se eligieron sesiones propias en base de datos en lugar de
Auth.js porque su versión para el App Router (v5) sigue en beta; el diseño es pequeño y auditable:

- Contraseñas con **scrypt** (N=2¹⁵, r=8, p=1, sal aleatoria) y comparación en tiempo constante. Si el
  correo no existe se calcula igualmente un hash, para no revelar qué cuentas existen.
- **Bloqueo**: 5 intentos fallidos bloquean la cuenta 15 min; además hay límite por IP y por correo.
- **Sesión**: token aleatorio de 256 bits en cookie `__Host-` httpOnly + Secure + SameSite=Lax, 12 h.
  En la tabla `Session` solo se guarda su SHA-256. Cerrar sesión la invalida en el servidor;
  `npm run user:create` (cambio de contraseña) cierra todas las sesiones del usuario.
- No hay registro público de administradores: se crean con `npm run user:create` o el seed.

**Autorización** (`src/server/auth/permissions.ts`): `requireAdmin(permiso)` en **cada página** y
`assertAdmin(permiso)` en **cada Server Action**. El `proxy.ts` solo hace una redirección optimista.

| Rol | Resumen | Estadísticas | Pedidos | Productos y descuentos | Contenido | Bitácora |
|---|---|---|---|---|---|---|
| `ADMIN` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `STORE_MANAGER` | ✅ | ✅ | ✅ | ✅ | — | — |
| `EDITOR` | ✅ | — | — | — | ✅ | — |

**Secciones**
- **Resumen**: ventas totales y de 30 días, pedidos por enviar y pendientes, ventas por día, pedidos
  recientes, más vendidos e inventario bajo (≤ 3 piezas).
- **Pedidos**: filtros por estado y búsqueda por correo o folio; detalle con productos, cliente,
  dirección, pagos, historial de estados y otros pedidos del cliente. Cambios de estado con reglas
  (`src/lib/order-flow.ts`), cancelación que libera inventario, reembolso con opción de reabastecer
  (el dinero se devuelve en Mercado Pago) y registro de guía que marca "Enviado" y avisa al comprador.
- **Productos**: alta/edición con variantes (talla, color, SKU, precio especial), fotografías por URL,
  productos relacionados y estado. El inventario se ajusta **por diferencia** (`increment`), así una
  venta que ocurra mientras se edita no se pierde. Productos con ventas se archivan en vez de borrarse.
- **Descuentos**: porcentaje, monto fijo o envío gratis, con mínimo, usos máximos y vencimiento.
- **Conciertos, Música y Videos**: alta, edición, publicación y eliminación. Fechas en hora del centro
  de México. Videos aceptan cualquier enlace de YouTube. Solo un lanzamiento/video destacado a la vez.
- **Bitácora**: inicio y cierre de sesión y cada cambio administrativo, con usuario, IP y detalle.

Cada guardado invalida la caché del sitio público con `updateTag` (tienda, conciertos, música,
videos), así que los cambios se ven al instante.

**Pendiente**: subida de imágenes a almacenamiento de objetos (hoy se capturan URLs), edición de
zonas y tarifas de envío desde el panel (hoy en `src/config/store.ts`), textos de "About" y
gestión de usuarios desde la interfaz.

### Conciertos desde Bandsintown

Los conciertos que la banda crea en Bandsintown llegan solos al sitio (`src/server/services/bandsintown.ts`):

- **Configurar:** en Bandsintown for Artists → Settings → General → *Get API Key*; copiar la clave en
  `BANDSINTOWN_APP_ID` (y `BANDSINTOWN_ARTIST` si el nombre en Bandsintown cambia).
- **Cada hora:** `GET /api/cron/sync-bandsintown` (protegido con `CRON_SECRET`). El workflow
  `.github/workflows/sync-bandsintown.yml` lo llama cada hora; requiere los secretos de GitHub `SITE_URL` y
  `CRON_SECRET`. Sirve igual cualquier otro programador (Vercel Cron, cron del servidor, cron-job.org).
- **Al momento:** botón *Sincronizar con Bandsintown* en `/admin/conciertos`.
- **Qué se sincroniza:** fecha y hora, ciudad, estado, recinto y enlace de boletos (se cambian en
  Bandsintown) y "agotado". Información adicional, cartel, estado y visibilidad se editan en el panel.
  Un concierto futuro que desaparece de Bandsintown se oculta (no se borra). Los conciertos creados a mano
  en el panel no se tocan. Las horas se guardan como hora del centro de México, igual que en el panel.

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
| 4. Backend y administración | ✅ | PostgreSQL + migraciones, seed, autenticación con roles, panel completo · ⏳ subida de imágenes, zonas de envío y About editables |
| 5. Integraciones | 🟡 | ✅ Mercado Pago (tarjeta, OXXO, SPEI, webhooks) · ⏳ correos reales, guías de envío |
| 6. Pruebas y despliegue | ⏳ | Pruebas E2E del flujo de compra, auditoría de seguridad, Lighthouse, despliegue |

## Marca

- `public/brand/logo.webp` (dos líneas), `logo-horizontal.webp` (una línea) y `simbolo.webp`: archivos
  oficiales (fondo transparente, gris #e2e1e4).
- `Logo` usa la versión horizontal en el header y la de dos líneas en portada, footer y login;
  `BrandSymbol` muestra el símbolo en el panel. Todos con `next/image`.
- `npm run brand:icons` genera desde esos archivos el ícono de la pestaña (`favicon.ico`, `icon.png`),
  el de iOS (`apple-icon.png`) y la imagen para redes sociales (`opengraph-image.png`). El símbolo va
  sobre fondo negro para que se vea en pestañas claras y oscuras. Vuelve a ejecutarlo si cambia el arte.

## Contenido pendiente de la banda

Logotipo en SVG (ya está el oficial en WebP; un SVG se vería más nítido), fotografías, portadas, biografía e historia, integrantes y roles,
enlaces oficiales de redes y plataformas, IDs de YouTube, fechas reales, catálogo con fotos,
precios e inventario, correos de booking/prensa, textos legales.
