# Base de datos — especificación

Fuente de verdad del esquema. Las migraciones (`server/src/db/migrations/`) y
los modelos de Sequelize (`server/src/db/models/`) se escriben contra este
documento; si alguno difiere, gana este documento y se corrige el código. Para
cambiar el esquema: primero se actualiza acá, después una migración **nueva**
(las migraciones ya aplicadas no se editan nunca).

## Decisiones generales

- **Motor:** PostgreSQL ≥ 15 con PostGIS ≥ 3.3 (Supabase en la nube; local con
  `docker compose` o Postgres nativo). Extensiones: `postgis`, `citext`,
  `btree_gist`, instaladas `WITH SCHEMA extensions` (convención de Supabase).
- **Esquema propio `app`.** Supabase expone `public` por su Data API con la anon
  key, que viaja al navegador. Las tablas viven en `app`, que no se expone, y
  además: RLS activado en **todas** las tablas sin políticas, y `REVOKE ALL`
  sobre el esquema y sus tablas para `PUBLIC`, `anon` y `authenticated` (estos
  dos solo existen en Supabase; la migración los revoca si existen). Express se
  conecta como dueño de las tablas, así que RLS no lo frena: la autorización
  vive en los servicios.
- **`search_path`:** la conexión de Sequelize fija `app, public, extensions`
  apenas conecta, para que las funciones de PostGIS se resuelvan estén donde
  estén (`public` en local, `extensions` en Supabase). Los modelos igual usan
  `schema: 'app'` explícito.
- **Nombres:** tablas y columnas en inglés, `snake_case`. En los modelos, los
  atributos van en camelCase con `underscored: true`.
- **IDs:** `uuid` con `DEFAULT gen_random_uuid()`. Excepción: `users.id` no
  tiene default; es el mismo id del usuario en `auth.users` de Supabase.
- **Enumerados como `text` + `CHECK`**, no como tipos `ENUM` de Postgres:
  agregar un valor es cambiar un CHECK (sin `ALTER TYPE`, que no corre dentro
  de una transacción), y evitamos los problemas de Sequelize v6 con
  `ARRAY(ENUM)`. Los valores válidos viven en `server/src/db/enums.ts` como
  constantes `as const`. Las migraciones copian los valores literales: una
  migración es una foto fija y nunca importa código de la app.
- **Fechas:** `timestamptz` en UTC. `created_at` y `updated_at` en todas las
  tablas (`NOT NULL DEFAULT now()`), y un trigger `app.set_updated_at()` los
  mantiene también ante `UPDATE` hechos en SQL directo.
- **Plata:** enteros en centavos (`*_cents integer`) + `currency char(3)`
  (`DEFAULT 'ARS'`, `CHECK (currency ~ '^[A-Z]{3}$')`).
- **Borrado lógico** (`deleted_at`, `paranoid: true`) solo en `users` y `dogs`:
  hay historial (reservas, reseñas) que los referencia.
- **Textos:** `text` con `CHECK (char_length(...) <= N)`, no `varchar(N)`.
  Los obligatorios además `CHECK (char_length(btrim(col)) > 0)`.
- **Horarios de disponibilidad:** hora local de pared del paseador
  (`walker_profiles.timezone`), no UTC: "lunes de 9 a 12" no cambia con el
  horario de verano.

## Enumerados

| Constante (`enums.ts`) | Valores                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `DOG_SIZES`            | `small`, `medium`, `large`, `giant`                                                   |
| `ENERGY_LEVELS`        | `low`, `medium`, `high`                                                               |
| `DOG_SEXES`            | `male`, `female`                                                                      |
| `BEHAVIOR_TRAITS`      | `friendly`, `shy`, `reactive_dogs`, `reactive_people`, `pulls_leash`, `special_needs` |
| `WALKER_SERVICES`      | `walk`, `group_walk`, `home_visit`, `sitting`, `training`                             |
| `VERIFIED_STATUSES`    | `unverified`, `pending`, `verified`, `rejected`                                       |
| `BOOKING_STATUSES`     | `pending`, `accepted`, `rejected`, `cancelled`, `in_progress`, `completed`, `expired` |

`dogs.behavior` describe al perro; `walker_profiles.accepted_behaviors` dice
qué rasgos acepta manejar el paseador. Usan el mismo vocabulario para poder
cruzarlos en la búsqueda.

## Tablas (todas en el esquema `app`)

Notación: `NN` = `NOT NULL`. Toda tabla tiene además `created_at` y
`updated_at` (salvo que se indique), RLS activado y el trigger de `updated_at`.

### `users`

| Columna        | Tipo                     | Reglas                                         |
| -------------- | ------------------------ | ---------------------------------------------- |
| `id`           | `uuid` PK                | sin default (= `auth.users.id`)                |
| `email`        | `citext` NN              | único entre filas no borradas (índice parcial) |
| `full_name`    | `text` NN                | 1–120 caracteres, no vacío                     |
| `phone`        | `text`                   | formato E.164: `^\+[1-9][0-9]{6,14}$`          |
| `avatar_url`   | `text`                   | ≤ 2048                                         |
| `is_owner`     | `boolean` NN             | `DEFAULT true`                                 |
| `is_walker`    | `boolean` NN             | `DEFAULT false`                                |
| `is_admin`     | `boolean` NN             | `DEFAULT false`                                |
| `location`     | `geography(Point, 4326)` | índice GIST                                    |
| `neighborhood` | `text`                   | ≤ 80                                           |
| `city`         | `text`                   | ≤ 80                                           |
| `deleted_at`   | `timestamptz`            | borrado lógico                                 |

- Si existe `auth.users` (Supabase), FK `users.id → auth.users(id) ON DELETE
CASCADE`. La migración la agrega condicionalmente; en local no existe.

### `walker_profiles` (1:1 con `users`)

| Columna              | Tipo           | Reglas                                                                                     |
| -------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| `user_id`            | `uuid` PK      | FK → `users(id)` `ON DELETE CASCADE`                                                       |
| `headline`           | `text`         | ≤ 80 (frase corta para la tarjeta)                                                         |
| `bio`                | `text`         | ≤ 2000                                                                                     |
| `hourly_rate_cents`  | `integer`      | `> 0`                                                                                      |
| `currency`           | `char(3)` NN   | `DEFAULT 'ARS'`, formato ISO                                                               |
| `experience_years`   | `smallint` NN  | `DEFAULT 0`, 0–60                                                                          |
| `is_trainer`         | `boolean` NN   | `DEFAULT false`                                                                            |
| `certifications`     | `jsonb` NN     | `DEFAULT '[]'`, `jsonb_typeof = 'array'`. Ítems: `{ name, issuer?, year?, documentPath? }` |
| `accepted_sizes`     | `text[]` NN    | `DEFAULT '{}'`, `<@ DOG_SIZES`                                                             |
| `accepted_behaviors` | `text[]` NN    | `DEFAULT '{}'`, `<@ BEHAVIOR_TRAITS`                                                       |
| `services`           | `text[]` NN    | `DEFAULT '{walk}'`, `<@ WALKER_SERVICES`                                                   |
| `max_dogs_per_walk`  | `smallint` NN  | `DEFAULT 1`, 1–10                                                                          |
| `service_radius_m`   | `integer` NN   | `DEFAULT 3000`, 500–50000                                                                  |
| `timezone`           | `text` NN      | `DEFAULT 'America/Argentina/Buenos_Aires'`                                                 |
| `verified_status`    | `text` NN      | `DEFAULT 'unverified'`, en `VERIFIED_STATUSES`                                             |
| `is_listed`          | `boolean` NN   | `DEFAULT false` (visible en la búsqueda)                                                   |
| `rating_avg`         | `numeric(3,2)` | 1.00–5.00 o NULL si no tiene reseñas                                                       |
| `rating_count`       | `integer` NN   | `DEFAULT 0`, `>= 0`                                                                        |
| `completed_walks`    | `integer` NN   | `DEFAULT 0`, `>= 0`                                                                        |

- `CHECK (NOT is_listed OR hourly_rate_cents IS NOT NULL)`: no se puede
  publicar un perfil sin tarifa.
- `CHECK ((rating_count = 0) = (rating_avg IS NULL))`.
- Índice parcial `(hourly_rate_cents) WHERE is_listed`.

### `walker_photos` (galería, 1:N con `walker_profiles`)

| Columna        | Tipo          | Reglas                                              |
| -------------- | ------------- | --------------------------------------------------- |
| `id`           | `uuid` PK     |                                                     |
| `walker_id`    | `uuid` NN     | FK → `walker_profiles(user_id)` `ON DELETE CASCADE` |
| `storage_path` | `text` NN     | clave en Supabase Storage, 1–512                    |
| `caption`      | `text`        | ≤ 200                                               |
| `position`     | `smallint` NN | `DEFAULT 0`, `>= 0`                                 |

- Índice `(walker_id, position)`.

### `walker_availability` (franjas semanales, 1:N)

| Columna      | Tipo          | Reglas                                                      |
| ------------ | ------------- | ----------------------------------------------------------- |
| `id`         | `uuid` PK     |                                                             |
| `walker_id`  | `uuid` NN     | FK → `walker_profiles(user_id)` `ON DELETE CASCADE`         |
| `weekday`    | `smallint` NN | 0–6, 0 = domingo (igual que JS `getDay()` y `EXTRACT(DOW)`) |
| `start_time` | `time` NN     |                                                             |
| `end_time`   | `time` NN     | `> start_time`                                              |

- Tipo de rango propio `app.timerange AS RANGE (subtype = time)` y
  `EXCLUDE USING gist (walker_id WITH =, weekday WITH =,
app.timerange(start_time, end_time, '[)') WITH &&)`: un paseador no puede
  tener dos franjas superpuestas el mismo día.

### `walker_time_off` (días sin disponibilidad, 1:N)

| Columna     | Tipo      | Reglas                                              |
| ----------- | --------- | --------------------------------------------------- |
| `id`        | `uuid` PK |                                                     |
| `walker_id` | `uuid` NN | FK → `walker_profiles(user_id)` `ON DELETE CASCADE` |
| `starts_on` | `date` NN |                                                     |
| `ends_on`   | `date` NN | `>= starts_on` (inclusive)                          |
| `reason`    | `text`    | ≤ 200                                               |

- Índice `(walker_id, starts_on)`.

### `dogs` (N:1 con `users`)

| Columna               | Tipo           | Reglas                                  |
| --------------------- | -------------- | --------------------------------------- |
| `id`                  | `uuid` PK      |                                         |
| `owner_id`            | `uuid` NN      | FK → `users(id)` `ON DELETE CASCADE`    |
| `name`                | `text` NN      | 1–50, no vacío                          |
| `breed`               | `text`         | ≤ 80 (NULL o "Mestizo" son válidos)     |
| `size`                | `text` NN      | en `DOG_SIZES`                          |
| `birth_date`          | `date`         | (que no sea futura se valida en la app) |
| `weight_kg`           | `numeric(4,1)` | `> 0 AND < 150`                         |
| `sex`                 | `text`         | en `DOG_SEXES`                          |
| `neutered`            | `boolean`      |                                         |
| `energy_level`        | `text` NN      | `DEFAULT 'medium'`, en `ENERGY_LEVELS`  |
| `behavior`            | `text[]` NN    | `DEFAULT '{}'`, `<@ BEHAVIOR_TRAITS`    |
| `good_with_dogs`      | `boolean`      |                                         |
| `good_with_kids`      | `boolean`      |                                         |
| `good_with_cats`      | `boolean`      |                                         |
| `behavior_notes`      | `text`         | ≤ 1000                                  |
| `medical_notes`       | `text`         | ≤ 2000                                  |
| `vaccines_up_to_date` | `boolean`      |                                         |
| `vet_name`            | `text`         | ≤ 120                                   |
| `vet_phone`           | `text`         | E.164                                   |
| `photo_url`           | `text`         | ≤ 2048                                  |
| `deleted_at`          | `timestamptz`  | borrado lógico                          |

- Índice `(owner_id) WHERE deleted_at IS NULL`.

### `bookings`

| Columna             | Tipo             | Reglas                                               |
| ------------------- | ---------------- | ---------------------------------------------------- |
| `id`                | `uuid` PK        |                                                      |
| `owner_id`          | `uuid` NN        | FK → `users(id)` `ON DELETE RESTRICT`                |
| `walker_id`         | `uuid` NN        | FK → `walker_profiles(user_id)` `ON DELETE RESTRICT` |
| `status`            | `text` NN        | `DEFAULT 'pending'`, en `BOOKING_STATUSES`           |
| `start_time`        | `timestamptz` NN |                                                      |
| `end_time`          | `timestamptz` NN | `> start_time` y duración `<= interval '8 hours'`    |
| `total_price_cents` | `integer` NN     | `>= 0`                                               |
| `currency`          | `char(3)` NN     | `DEFAULT 'ARS'`                                      |
| `notes`             | `text`           | ≤ 1000                                               |
| `series_id`         | `uuid`           | reservas recurrentes (FK en Fase 6)                  |
| `accepted_at`       | `timestamptz`    |                                                      |
| `started_at`        | `timestamptz`    |                                                      |
| `completed_at`      | `timestamptz`    |                                                      |
| `cancelled_at`      | `timestamptz`    |                                                      |
| `cancelled_by`      | `uuid`           | FK → `users(id)` `ON DELETE SET NULL`                |
| `cancel_reason`     | `text`           | ≤ 500                                                |

- `CHECK (owner_id <> walker_id)`: nadie se reserva a sí mismo.
- Coherencia de estado:
  `CHECK (status <> 'cancelled' OR cancelled_at IS NOT NULL)`,
  `CHECK (status NOT IN ('in_progress','completed') OR started_at IS NOT NULL)`,
  `CHECK (status <> 'completed' OR completed_at IS NOT NULL)`,
  `CHECK (status NOT IN ('accepted','in_progress','completed') OR accepted_at IS NOT NULL)`.
- **Sin superposición:** `EXCLUDE USING gist (walker_id WITH =,
tstzrange(start_time, end_time, '[)') WITH &&) WHERE (status IN
('accepted','in_progress'))`. Un paseador no puede tener dos reservas
  aceptadas o en curso que se pisen. (Los paseos grupales, que sí se pisan,
  van a necesitar otro modelo; no son parte del MVP.)
- Índices: `(walker_id, start_time)`, `(owner_id, start_time)`,
  `(created_at) WHERE status = 'pending'` (para vencer solicitudes).

### `booking_dogs` (N:M entre `bookings` y `dogs`)

| Columna      | Tipo      | Reglas                                  |
| ------------ | --------- | --------------------------------------- |
| `booking_id` | `uuid` NN | FK → `bookings(id)` `ON DELETE CASCADE` |
| `dog_id`     | `uuid` NN | FK → `dogs(id)` `ON DELETE RESTRICT`    |

- PK `(booking_id, dog_id)`. Índice `(dog_id)`. Solo `created_at` (sin
  `updated_at` ni trigger: las filas no se modifican).
- Que el perro sea del dueño de la reserva lo valida el servicio (Fase 6).

### `walk_logs` (1:1 con `bookings`)

| Columna       | Tipo                          | Reglas                                  |
| ------------- | ----------------------------- | --------------------------------------- |
| `booking_id`  | `uuid` PK                     | FK → `bookings(id)` `ON DELETE CASCADE` |
| `route`       | `geography(LineString, 4326)` |                                         |
| `distance_m`  | `integer`                     | `>= 0`                                  |
| `duration_s`  | `integer`                     | `>= 0`                                  |
| `pee_events`  | `smallint` NN                 | `DEFAULT 0`, `>= 0`                     |
| `poop_events` | `smallint` NN                 | `DEFAULT 0`, `>= 0`                     |
| `water_given` | `boolean` NN                  | `DEFAULT false`                         |
| `notes`       | `text`                        | ≤ 2000                                  |
| `started_at`  | `timestamptz`                 |                                         |
| `ended_at`    | `timestamptz`                 | `>= started_at` si ambos existen        |

### `walk_photos` (1:N con `walk_logs`)

| Columna        | Tipo          | Reglas                                           |
| -------------- | ------------- | ------------------------------------------------ |
| `id`           | `uuid` PK     |                                                  |
| `walk_log_id`  | `uuid` NN     | FK → `walk_logs(booking_id)` `ON DELETE CASCADE` |
| `storage_path` | `text` NN     | 1–512                                            |
| `taken_at`     | `timestamptz` |                                                  |

- Índice `(walk_log_id)`. Solo `created_at`.

### `reviews`

| Columna        | Tipo          | Reglas                                  |
| -------------- | ------------- | --------------------------------------- |
| `id`           | `uuid` PK     |                                         |
| `booking_id`   | `uuid` NN     | FK → `bookings(id)` `ON DELETE CASCADE` |
| `reviewer_id`  | `uuid` NN     | FK → `users(id)` `ON DELETE RESTRICT`   |
| `reviewee_id`  | `uuid` NN     | FK → `users(id)` `ON DELETE RESTRICT`   |
| `rating`       | `smallint` NN | 1–5                                     |
| `comment`      | `text`        | ≤ 2000                                  |
| `published_at` | `timestamptz` | NULL hasta que se publica (doble ciego) |

- `UNIQUE (booking_id, reviewer_id)`, `CHECK (reviewer_id <> reviewee_id)`.
- Índice `(reviewee_id, published_at DESC)`.

## Asociaciones (Sequelize)

| Origen          | Relación      | Destino              | Alias (`as`)      | Claves                                      |
| --------------- | ------------- | -------------------- | ----------------- | ------------------------------------------- |
| `User`          | hasOne        | `WalkerProfile`      | `walkerProfile`   | `userId`                                    |
| `WalkerProfile` | belongsTo     | `User`               | `user`            | `userId`                                    |
| `User`          | hasMany       | `Dog`                | `dogs`            | `ownerId`                                   |
| `Dog`           | belongsTo     | `User`               | `owner`           | `ownerId`                                   |
| `WalkerProfile` | hasMany       | `WalkerPhoto`        | `photos`          | `walkerId` → `userId`                       |
| `WalkerProfile` | hasMany       | `WalkerAvailability` | `availability`    | `walkerId` → `userId`                       |
| `WalkerProfile` | hasMany       | `WalkerTimeOff`      | `timeOff`         | `walkerId` → `userId`                       |
| `User`          | hasMany       | `Booking`            | `ownerBookings`   | `ownerId`                                   |
| `WalkerProfile` | hasMany       | `Booking`            | `bookings`        | `walkerId` → `userId`                       |
| `Booking`       | belongsTo     | `User`               | `owner`           | `ownerId`                                   |
| `Booking`       | belongsTo     | `WalkerProfile`      | `walker`          | `walkerId` → `userId`                       |
| `Booking`       | belongsToMany | `Dog`                | `dogs`            | through `BookingDog` (`bookingId`, `dogId`) |
| `Dog`           | belongsToMany | `Booking`            | `bookings`        | through `BookingDog`                        |
| `Booking`       | hasOne        | `WalkLog`            | `walkLog`         | `bookingId`                                 |
| `WalkLog`       | belongsTo     | `Booking`            | `booking`         | `bookingId`                                 |
| `WalkLog`       | hasMany       | `WalkPhoto`          | `photos`          | `walkLogId` → `bookingId`                   |
| `Booking`       | hasMany       | `Review`             | `reviews`         | `bookingId`                                 |
| `Review`        | belongsTo     | `Booking`            | `booking`         | `bookingId`                                 |
| `Review`        | belongsTo     | `User`               | `reviewer`        | `reviewerId`                                |
| `Review`        | belongsTo     | `User`               | `reviewee`        | `revieweeId`                                |
| `User`          | hasMany       | `Review`             | `reviewsReceived` | `revieweeId`                                |

## Migraciones

Umzug + Sequelize, en TypeScript, SQL explícito, cada una dentro de una
transacción y con `down` que deja todo como estaba. Tabla de control:
`app.schema_migrations`.

| Archivo                                 | Contenido                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `0001_schema-extensions-and-helpers.ts` | esquema `extensions` y `app`, extensiones, revocaciones, `app.set_updated_at()`, `app.timerange` |
| `0002_users.ts`                         | `users` (+ FK condicional a `auth.users`)                                                        |
| `0003_walker-profiles.ts`               | `walker_profiles`, `walker_photos`, `walker_availability`, `walker_time_off`                     |
| `0004_dogs.ts`                          | `dogs`                                                                                           |
| `0005_bookings.ts`                      | `bookings`, `booking_dogs`                                                                       |
| `0006_walk-logs.ts`                     | `walk_logs`, `walk_photos`                                                                       |
| `0007_reviews.ts`                       | `reviews`                                                                                        |
