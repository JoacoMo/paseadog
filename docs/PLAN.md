# DogWalkr — Plan maestro

Documento vivo. Cada fase tiene objetivo, tareas, entregables y criterios de
aceptación ("Definition of Done"). Una fase no arranca hasta que la anterior
cumple su DoD. Para pedirle trabajo a Claude Code alcanza con decir
**"seguí con la Fase N de docs/PLAN.md"**: las reglas del proyecto están en
`CLAUDE.md` y se cargan solas.

Estado: ✅ hecha · 🟡 en curso · ⬜ pendiente

| Fase | Tema                                           | Estado |
| ---- | ---------------------------------------------- | ------ |
| 1    | Init del monorepo                              | ✅     |
| 2    | Base de datos y ORM (Sequelize + PostGIS)      | ⬜     |
| 3    | API REST (CRUD + búsqueda geográfica)          | ⬜     |
| 4    | Auth con Supabase (middleware JWT)             | ⬜     |
| 5    | Frontend core (login, búsqueda, perfil)        | ⬜     |
| 6    | Disponibilidad y reservas (únicas/recurrentes) | ⬜     |
| 7    | Chat y notificaciones                          | ⬜     |
| 8    | Paseo en vivo + Walk Report                    | ⬜     |
| 9    | Reseñas y reputación                           | ⬜     |
| 10   | Pagos con Mercado Pago                         | ⬜     |
| 11   | Confianza, seguridad y panel admin             | ⬜     |
| 12   | Calidad, observabilidad y deploy               | ⬜     |
| 13   | (Opcional) App nativa con Expo                 | ⬜     |

> **Recomendación de orden:** hacer la Fase 4 (auth) antes que la 3. Casi todos
> los endpoints de la Fase 3 necesitan saber quién es el usuario ("mis perros",
> "mi perfil de paseador"); si la auth llega después, hay que reescribir los
> controladores. Es una fase chica.

---

## Arquitectura

```
┌──────────────┐  HTTPS /api/v1   ┌──────────────────┐   SQL (pooler)   ┌───────────────────────┐
│  client/     │ ───────────────▶ │  server/         │ ───────────────▶ │ Supabase Postgres     │
│  React+Vite  │   Bearer JWT     │  Express+Sequelize│                 │ + PostGIS             │
│  PWA         │                  │  (lógica, authz)  │                 └───────────────────────┘
└──────┬───────┘                  └────────┬─────────┘
       │ Auth (login), Storage (subida con URL firmada), Realtime (chat / GPS)
       └──────────────────────────────▶ Supabase ◀── verifica JWT (JWKS) ──┘
```

- **Express es la única puerta de escritura a la base.** El cliente usa Supabase
  solo para: iniciar sesión (Auth), subir archivos con URLs firmadas que emite
  Express (Storage) y canales en tiempo real (Realtime).
- **Supabase expone el esquema `public` por su Data API con la clave anon.** Si
  Sequelize crea tablas ahí sin RLS, cualquiera con la anon key (que viaja al
  navegador) puede leerlas y escribirlas salteando Express. Mitigación (Fase 2):
  tablas en un esquema propio `app`, no expuesto en la API, **y** RLS activado
  sin políticas como defensa en profundidad.
- **Express se conecta con un rol privilegiado**, así que RLS no lo frena: la
  autorización (¿este perro es tuyo?, ¿esta reserva es tuya?) vive en la capa
  de servicios de Express y se testea.
- Una API REST independiente permite sumar una app nativa (Fase 13) sin tocar
  el backend.

### Riesgo técnico a tener presente: GPS en segundo plano

Una PWA **no puede** leer el GPS con la pantalla apagada o la app en segundo
plano (iOS lo corta siempre; Android, casi siempre). Para el Paseo en Vivo de la
Fase 8 la PWA usa Wake Lock API (pantalla encendida) y avisa al paseador. Si el
seguimiento en segundo plano se vuelve imprescindible, la salida es la app de
paseador con Expo (Fase 13), que reutiliza esta misma API.

---

## Fase 1 — Init ✅

- Monorepo con npm workspaces: `client/` y `server/`.
- `server/`: Express 5 + TypeScript (ESM), zod para variables de entorno y
  validación, pino para logs con request id, manejo central de errores con
  contrato JSON único, `GET /api/v1/health`, apagado prolijo, tests con Vitest +
  Supertest.
- `client/`: React 19 + Vite 8 + Tailwind CSS 4 + TypeScript, cliente HTTP
  tipado que entiende el contrato de errores, landing mobile-first con
  indicador de conexión con la API, manifest PWA, tests con Testing Library.
- Raíz: tsconfig base estricto, Prettier, EditorConfig, CI en GitHub Actions.

**DoD:** `npm run verify` en verde (formato, lint, tipos, tests y build de los dos
lados) y `npm run dev` levanta ambos con el proxy funcionando.

---

## Fase 2 — Base de datos y ORM

### Decisiones a confirmar antes de arrancar

El modelo del brief original se respeta, con estas mejoras (cada una evita un
problema concreto más adelante):

| Brief original                   | Propuesta                                                                 | Por qué                                                                            |
| -------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `Users.role`                     | `is_owner`, `is_walker`, `is_admin` (booleanos)                           | Una cuenta puede ser dueño y paseador a la vez; un único `role` no lo representa.  |
| `Bookings.dog_ids` (array)       | Tabla puente `booking_dogs (booking_id, dog_id)`                          | Un array no tiene claves foráneas: se puede reservar con un perro borrado o ajeno. |
| `hourly_rate` / `total_price`    | Enteros en centavos (`*_cents`) + `currency` (`ARS`)                      | Los decimales binarios redondean mal la plata.                                     |
| `Users.location (lat/lon)`       | `geography(Point, 4326)` + índice GIST                                    | Búsqueda por radio con `ST_DWithin` usando índice, en metros reales.               |
| `WalkLogs.walk_photos` (array)   | Tabla `walk_photos` con `storage_path`                                    | Permite orden, borrado y URLs firmadas por foto.                                   |
| Tablas `Users`, `WalkerProfiles` | `users`, `walker_profiles` (snake_case) en esquema `app`                  | Convención de Postgres; ver nota de seguridad arriba.                              |
| Estados de reserva (4)           | `pending, accepted, rejected, cancelled, in_progress, completed, expired` | Hacen falta para cancelar, rechazar y vencer solicitudes sin respuesta.            |

### Modelo propuesto

- **users** — `id uuid PK` (= `auth.users.id` de Supabase), `email citext unique`,
  `full_name`, `phone`, `avatar_url`, `is_owner`, `is_walker`, `is_admin`,
  `location geography(Point,4326)`, `neighborhood`, `city`, timestamps,
  `deleted_at` (borrado lógico).
- **walker_profiles** (1:1 con users) — `user_id PK/FK`, `headline`, `bio`,
  `hourly_rate_cents`, `currency`, `experience_years`, `is_trainer`,
  `certifications jsonb` (nombre, emisor, año, `document_path` privado),
  `accepted_sizes size[]`, `accepted_behaviors behavior[]`, `services service[]`
  (paseo individual, grupal, visita a domicilio, guardería, adiestramiento),
  `max_dogs_per_walk`, `service_radius_km`, `verified_status`
  (`unverified|pending|verified|rejected`), `is_listed` (visible en búsqueda),
  contadores desnormalizados `rating_avg`, `rating_count`, `completed_walks`.
- **walker_photos** (1:N) — galería: `storage_path`, `caption`, `position`.
- **walker_availability** (1:N) — `weekday 0–6`, `start_time`, `end_time`.
- **walker_time_off** (1:N) — rangos de fechas sin disponibilidad (vacaciones).
- **dogs** (N:1 users) — `name`, `breed`, `size`, `birth_date`, `weight_kg`,
  `sex`, `neutered`, `energy_level` (`low|medium|high`), `behavior` (amigable,
  tímido, reactivo con perros/personas, tira de la correa), `good_with_dogs`,
  `good_with_kids`, `behavior_notes`, `medical_notes`, `vaccines_up_to_date`,
  `vet_contact`, `photo_url`.
- **bookings** — `owner_id`, `walker_id`, `status`, `start_time timestamptz`,
  `end_time timestamptz`, `total_price_cents`, `currency`, `notes`,
  `series_id` (reservas recurrentes), `cancelled_by`, `cancel_reason`,
  `accepted_at`, `started_at`, `completed_at`. Restricciones: `end_time >
start_time`; **constraint de exclusión** (`btree_gist` + `tstzrange`) que
  impide dos reservas aceptadas/en curso superpuestas para el mismo paseador.
- **booking_dogs** — `(booking_id, dog_id)` PK compuesta.
- **walk_logs** (1:1 con bookings) — `route geography(LineString)`,
  `distance_m`, `duration_s`, `pee_events`, `poop_events`, `water_given`,
  `notes`, `started_at`, `ended_at`.
- **walk_photos** (1:N walk_logs) — `storage_path`, `taken_at`.
- **reviews** — `booking_id`, `reviewer_id`, `reviewee_id`, `rating 1–5`
  (CHECK), `comment`, `published_at`; `UNIQUE (booking_id, reviewer_id)`.

Más adelante (no en Fase 2): `conversations`, `messages`, `favorites`,
`notifications`, `payments`, `reports`, `booking_series`.

### Tareas

1. Base local: proyecto Supabase de desarrollo (gratis) para Auth/Storage, y
   `docker-compose.yml` con `postgis/postgis` para tests y CI.
2. Conexión Sequelize con `DATABASE_URL` (pooler de Supabase en modo sesión,
   SSL), pool configurado, `underscored: true`, timestamps `timestamptz`.
3. Modelos tipados (`InferAttributes`/`InferCreationAttributes`) con
   asociaciones 1:1 y 1:N.
4. Migraciones con Umzug (TypeScript, ESM): extensiones `postgis`, `citext`,
   `btree_gist`; esquema `app`; enums; tablas; índices (GIST en ubicaciones,
   B-tree en FKs y `bookings(walker_id, start_time)`); RLS activado.
5. Seeds de desarrollo: 30 paseadores repartidos por barrios de CABA, dueños con
   perros, reservas en todos los estados y reseñas.
6. Scripts: `db:migrate`, `db:migrate:undo`, `db:seed`, `db:reset`.

**DoD:** migraciones idempotentes de ida y vuelta; tests de integración contra
PostGIS real (Docker) verificando asociaciones, CHECKs y el constraint de
superposición; seeds cargan sin errores.

---

## Fase 3 — API REST

Estructura por módulo: `routes → controller → service → models`, validación con
zod en cada endpoint, paginación por cursor, respuestas con el contrato de
errores de la Fase 1.

- **Usuarios:** `GET/PATCH /me`, `PUT /me/location` (recibe lat/lon, guarda
  geography; nunca devuelve coordenadas de otros).
- **Perros:** `GET/POST /me/dogs`, `GET/PATCH/DELETE /me/dogs/:id` (solo el dueño).
- **Perfil de paseador:** `PUT /me/walker-profile` (crea o actualiza y marca
  `is_walker`), galería y disponibilidad.
- **Búsqueda:** `GET /walkers/search?lat&lon&radiusKm&minPrice&maxPrice&
minExperience&size&isTrainer&day&from&to&sort=distance|rating|price&cursor`.
  SQL con `ST_DWithin` (usa índice) + `ST_Distance` para ordenar. La respuesta
  trae `distanceM` **redondeada a 100 m**, nunca coordenadas. Filtra por
  disponibilidad cruzando `walker_availability` y reservas existentes.
- **Perfil público:** `GET /walkers/:id` (bio, fotos, reseñas, stats).

**DoD:** tests de integración por endpoint (feliz, validación, 404, acceso a
recurso ajeno → 403/404); búsqueda probada con puntos conocidos y distancias
verificadas; documento OpenAPI generado desde los esquemas zod.

---

## Fase 4 — Auth con Supabase

- Middleware `requireAuth`: lee `Authorization: Bearer`, verifica el JWT con
  `jose` contra el JWKS del proyecto (`/auth/v1/.well-known/jwks.json`; las
  claves nuevas de Supabase son asimétricas), valida `iss`, `aud`, `exp`, y deja
  `req.auth = { userId, email }`. Fallback a HS256 con `SUPABASE_JWT_SECRET`
  solo si el proyecto todavía usa la clave legada.
- Alta perezosa: el primer request autenticado crea la fila en `users`
  (upsert por `id`).
- `requireRole('walker' | 'admin')` para rutas específicas.
- Rate limiting (`express-rate-limit`) más estricto en endpoints sensibles.

**DoD:** tests con JWT firmados localmente (válido, vencido, firma inválida,
audiencia incorrecta, sin header) — sin depender de la red.

---

## Fase 5 — Frontend core

- React Router (rutas protegidas), TanStack Query (caché y estados de carga),
  react-hook-form + zod (formularios), Supabase JS solo para Auth.
- Pantallas: Login / Registro (email + magic link; Google opcional),
  Onboarding (¿buscás paseador, querés pasear o ambas?), Búsqueda (lista de
  tarjetas + filtros en bottom sheet + mapa con MapLibre), Perfil de paseador
  (galería, bio, certificaciones, tarifas, tamaños aceptados, reseñas, botón
  "Reservar"), Mis perros (CRUD con foto), Mi perfil de paseador.
- Modo **Descubrir** estilo tarjetas: una tarjeta por paseador con foto grande,
  distancia, precio, rating y chips (entrenador, acepta perros grandes…);
  deslizar para guardar o pasar, tocar para ver el perfil completo.
- PWA instalable (vite-plugin-pwa), estados vacíos y de error con mensajes que
  dicen qué hacer, skeletons de carga, accesibilidad AA.

**DoD:** tests de componentes de los flujos clave; Lighthouse PWA/Accesibilidad
≥ 90 en móvil.

---

## Fase 6 — Disponibilidad y reservas

- Calendario semanal del paseador (franjas recurrentes + días libres).
- Reserva única o recurrente (ej. "lunes, miércoles y viernes 9:00 por 4
  semanas"), con regla RRULE expandida a reservas individuales.
- Máquina de estados explícita y testeada:
  `pending → accepted | rejected | expired`, `accepted → in_progress |
cancelled`, `in_progress → completed`. Transiciones solo por endpoints
  dedicados (`POST /bookings/:id/accept`, etc.), nunca con un PATCH libre.
- Vencimiento automático de solicitudes sin respuesta (job cada 5 min).
- Política de cancelación (gratis hasta X horas antes) y reprogramación.
- **Meet & greet** gratuito opcional antes del primer paseo.
- Zona horaria `America/Argentina/Buenos_Aires` en toda la UI; en base, UTC.

---

## Fase 7 — Chat y notificaciones

- Conversación por par dueño–paseador. Mensajes persistidos por Express y
  difundidos por Supabase Realtime (canal privado por conversación).
- Teléfono y dirección exacta ocultos hasta que haya una reserva aceptada
  (evita que se salteen la plataforma y protege la privacidad).
- Notificaciones Web Push (VAPID) + email transaccional (Resend o similar):
  nueva solicitud, aceptada, paseo empezó/terminó, nueva reseña.
- Centro de notificaciones en la app con no leídas.

---

## Fase 8 — Paseo en vivo + Walk Report

- El paseador inicia el paseo con check-in (geofence cerca del domicilio del
  dueño + código de 4 dígitos que le da el dueño al entregar el perro).
- Envío de posición cada ~10 s o 20 m por **Realtime Broadcast** en un canal
  privado `walk:{bookingId}` con autorización (solo dueño y paseador de esa
  reserva). Lotes de puntos persistidos por Express cada ~30 s en `walk_logs`.
- Vista del dueño: mapa en vivo, recorrido, tiempo transcurrido, eventos.
- Botones rápidos: 💧 pis, 💩 caca, 🚰 agua, 📷 foto (sube a Storage privado).
- Walk Report al finalizar: mapa del recorrido, distancia, duración, eventos,
  fotos, nota del paseador. Link para compartir con un familiar.
- Botón de emergencia / reportar incidente.

---

## Fase 9 — Reseñas y reputación

- Solo sobre reservas completadas, ventana de 14 días.
- **Doble ciego:** las dos reseñas se publican juntas o al vencer la ventana,
  para que nadie califique en represalia.
- Subcalificaciones (puntualidad, comunicación, cuidado del perro) y respuesta
  pública del paseador.
- Recalcular `rating_avg`/`rating_count` en la misma transacción.
- Badges: "Respuesta rápida", "Paseador destacado", "Entrenador certificado".

---

## Fase 10 — Pagos (Mercado Pago)

- Mercado Pago Marketplace: cada paseador vincula su cuenta (OAuth); el cobro
  se divide con `marketplace_fee` (comisión de la plataforma).
- Cobro al aceptar la reserva; reembolso automático según la política de
  cancelación. Propinas opcionales al terminar el paseo.
- Webhooks idempotentes con verificación de firma; tabla `payments` con
  estados y conciliación.

---

## Fase 11 — Confianza, seguridad y panel admin

- Verificación de paseadores: foto de DNI + selfie, certificado de
  antecedentes penales (Registro Nacional de Reincidencia), certificados de
  adiestramiento o primeros auxilios. Documentos en bucket privado.
- Reportar y bloquear usuarios; moderación de reseñas y fotos.
- Panel admin: cola de verificaciones, reportes, disputas, métricas básicas.
- Auditoría de acciones sensibles; cumplimiento de la Ley 25.326 de Protección
  de Datos Personales (consentimiento de ubicación, exportar y borrar cuenta).

---

## Fase 12 — Calidad, observabilidad y deploy

- E2E con Playwright de los flujos críticos (buscar → reservar → paseo → reseña).
- Sentry (errores front y back), logs estructurados, métricas de latencia.
- Deploy: cliente en Vercel; API en Render/Railway/Fly.io; migraciones como
  paso previo del deploy; previews por PR.
- Backups y política de retención; alertas.

---

## Fase 13 — (Opcional) App nativa con Expo

App del paseador con GPS en segundo plano (expo-location + TaskManager),
notificaciones push nativas y cámara. Reutiliza la API sin cambios.

---

## Ideas para más adelante

- Paseos grupales con cupos y precio por perro.
- Suscripciones mensuales (paquete de N paseos con descuento).
- Programa de referidos y cupones.
- Favoritos ("mis paseadores") y reserva rápida con el de siempre.
- Score de compatibilidad perro–paseador (tamaño, energía, comportamiento,
  distancia, disponibilidad) para ordenar la búsqueda.
- Tiempo medio de respuesta y tasa de aceptación visibles en el perfil.
- Modo oscuro.
