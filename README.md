# DogWalkr 🐾

Marketplace para conectar dueños de perros con paseadores locales. PWA
mobile-first, pensada para Argentina.

El roadmap completo, con el modelo de datos y las decisiones de arquitectura,
está en [`docs/PLAN.md`](docs/PLAN.md). Las reglas del proyecto (convenciones,
seguridad, privacidad) están en [`CLAUDE.md`](CLAUDE.md).

## Stack

| Capa       | Tecnología                                          |
| ---------- | --------------------------------------------------- |
| Cliente    | React 19 · Vite 8 · Tailwind CSS 4 · TypeScript     |
| API        | Node 22 · Express 5 · TypeScript (ESM) · zod · pino |
| Base       | PostgreSQL + PostGIS · Sequelize (Fase 2)           |
| Plataforma | Supabase: Auth, Storage, Realtime                   |
| Tests      | Vitest · Supertest · Testing Library                |
| Deploy     | Vercel (cliente) · Render / Railway / Fly.io (API)  |

## Estructura

```
.
├── client/          React + Vite (PWA)
│   └── src/
│       ├── features/    código por funcionalidad (system, auth, walkers…)
│       ├── components/  primitivas de UI compartidas
│       └── lib/         env, cliente HTTP
├── server/          API Express
│   └── src/
│       ├── modules/     un módulo por recurso (health, users, dogs…)
│       ├── middlewares/ errores, 404, validación
│       ├── config/      variables de entorno validadas
│       ├── lib/         logger, HttpError
│       └── db/          modelos y migraciones (Fase 2)
├── docs/PLAN.md     roadmap por fases
└── CLAUDE.md        reglas del proyecto
```

## Puesta en marcha

Requisitos: Node 22 (`nvm use` toma la versión de `.nvmrc`).

```bash
npm install                                  # instala client y server (workspaces)
cp server/.env.example server/.env           # opcional en Fase 1: hay valores por defecto
cp client/.env.example client/.env           # opcional en Fase 1
npm run dev                                  # API en :4000 y cliente en :5173
```

Abrí http://localhost:5173: el indicador de abajo tiene que decir
**"API en línea"**. En desarrollo, Vite redirige `/api` a `localhost:4000`, así
que el cliente no necesita CORS ni URLs absolutas.

## Comandos (desde la raíz)

| Comando              | Qué hace                                                   |
| -------------------- | ---------------------------------------------------------- |
| `npm run dev`        | API y cliente juntos, con recarga en caliente              |
| `npm run dev:server` | Solo la API                                                |
| `npm run dev:client` | Solo el cliente                                            |
| `npm run build`      | Build de producción de los dos                             |
| `npm run test`       | Tests de los dos                                           |
| `npm run lint`       | ESLint de los dos                                          |
| `npm run typecheck`  | `tsc` de los dos                                           |
| `npm run format`     | Prettier sobre todo el repo                                |
| `npm run verify`     | Formato + lint + tipos + tests + build: lo mismo que la CI |

Para un solo lado: `npm run <script> -w server` o `-w client`.

## API

Base: `/api/v1`.

| Método | Ruta      | Descripción                   |
| ------ | --------- | ----------------------------- |
| GET    | `/health` | Estado del servicio y versión |

Todos los errores responden con la misma forma:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "No encontramos lo que buscabas. Revisá la URL.",
    "requestId": "3f2c…"
  }
}
```

Cada respuesta lleva el header `x-request-id`; si el cliente manda uno, se
respeta. Sirve para encontrar en los logs el request exacto de un error.

## Historia

La primera versión del proyecto ("Paseo", Next.js + Supabase con Server
Actions) sigue en la rama `main` (commit `a81b248`). Esta versión arranca de
cero con API propia en Express; de la anterior se conservan los íconos, la
paleta y las reglas de privacidad.
