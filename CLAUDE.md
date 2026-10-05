# DogWalkr — reglas del proyecto

Marketplace (PWA) para conectar dueños de perros con paseadores, en Argentina.
El roadmap por fases está en `docs/PLAN.md`: trabajá una fase por vez y no
arranques la siguiente sin que la actual cumpla su "Definition of Done".
Al terminar una fase, actualizá su estado en la tabla de `docs/PLAN.md`.

## Estructura

- `client/` — React 19 + Vite + Tailwind CSS 4 + TypeScript. PWA mobile-first.
- `server/` — Express 5 + TypeScript (ESM, NodeNext) + Sequelize (desde Fase 2).
- npm workspaces: los comandos se corren desde la raíz (`npm run verify`,
  `npm run dev`) o con `-w client` / `-w server`.

## Antes de dar algo por terminado

Corré `npm run verify` (formato, lint, tipos, tests y build de los dos lados).
Si algo falla, se arregla; nunca se saltea ni se desactiva un test.

## Convenciones

1. **Idiomas:** código, nombres de archivos, tablas y columnas en inglés
   (snake_case en la base). Todo texto que ve el usuario, en español
   rioplatense con voseo. Los mensajes de error dicen qué hacer.
2. **TypeScript estricto**, sin `any` (usá `unknown` y estrechá). TypeScript
   fijado en `~6.0`: typescript-eslint todavía no soporta la 7.
3. **Imports relativos con extensión `.js`** en `server/` (NodeNext).
4. **Validación con zod** en todo borde: variables de entorno, body, query y
   params. Nada sin validar llega a un servicio.
5. **Contrato de errores único** de la API:
   `{ "error": { "code", "message", "details"?, "requestId" } }`. Lanzá
   `HttpError` (o sus helpers) y dejá que el middleware central responda.
   Un 500 nunca filtra detalles internos al cliente.
6. **Capas en el server:** `routes → controller → service → models`. La
   autorización (¿este recurso es tuyo?) va en el servicio y se testea.
7. **Plata en enteros** (centavos) con `currency`. Fechas en UTC
   (`timestamptz`); la UI muestra `America/Argentina/Buenos_Aires`.
8. **Componentes funcionales y hooks.** Componentes en PascalCase, hooks
   `useX.ts`, el resto en kebab-case. Estructura por feature
   (`src/features/<feature>/`), primitivas compartidas en `src/components/ui/`.
9. Comentá el _por qué_, no el _qué_.

## Seguridad y privacidad (no negociables)

- **La ubicación exacta de un usuario nunca se le muestra a otro.** La búsqueda
  devuelve distancia redondeada, no coordenadas. La única excepción es el
  paseo en vivo: el dueño ve la posición del paseador solo durante su propia
  reserva en curso.
- Teléfono y dirección exacta se revelan recién con una reserva aceptada.
- **Express es la única puerta de escritura a la base.** El cliente usa
  Supabase solo para Auth, subidas con URL firmada y Realtime.
- Las tablas viven en un esquema no expuesto por la Data API de Supabase y con
  RLS activado: la anon key viaja al navegador y no debe abrir nada.
- La `service_role` key de Supabase jamás va al cliente ni a un `.env.example`
  con valor. Ningún secreto se commitea.
- En el server, el JWT de Supabase se verifica criptográficamente (JWKS); nunca
  se confía en un token sin verificar.

## Commits

Mensajes en español, en imperativo y describiendo el cambio
(ej. "Agregar búsqueda de paseadores por radio"). Un commit por unidad lógica.
