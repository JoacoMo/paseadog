# Paseo

App web (PWA) para encontrar paseadores de perros por barrio, en Argentina.
No va a las tiendas de apps: se instala desde el navegador.

## Stack

Next.js 16 (App Router) · TypeScript estricto · Tailwind CSS 4 · Supabase
(PostgreSQL + PostGIS, Auth, Storage, Realtime) · TanStack Query · Zod +
react-hook-form · MapLibre GL JS · Mercado Pago · Vercel.

## Correr el proyecto

```bash
npm install
cp .env.example .env.local   # y completá los dos valores de Supabase
npm run dev                  # https://localhost:3000 (certificado autofirmado)
```

`npm run dev` levanta con `--experimental-https` porque los service workers y la
instalación de la PWA solo funcionan sobre HTTPS. La primera vez el navegador te
va a pedir que aceptes el certificado.

Si necesitás HTTP plano (por ejemplo para depurar algo que el certificado
molesta), usá `npm run dev:http`.

| Comando              | Qué hace                                        |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Desarrollo con HTTPS                            |
| `npm run build`      | Build de producción                             |
| `npm start`          | Sirve el build (para probar offline de verdad)  |
| `npm run typecheck`  | `tsc --noEmit`                                  |
| `npm test`           | Pruebas del service worker (`node --test`)      |
| `npm run verificar`  | typecheck + tests, todo junto                   |
| `npm run iconos`     | Regenera los PNG de `public/iconos/`            |
| `npm run tipos`      | Regenera `lib/supabase/tipos-base.ts` desde la base |

## Autenticación

`proxy.ts` (lo que hasta Next 15 se llamaba `middleware.ts`) corre antes de cada
request y hace dos cosas: refresca la sesión de Supabase y genera el nonce de la
CSP.

Las rutas viven en dos grupos:

- `app/(app)/` — pide sesión. Sin ella, el proxy redirige a `/login?volver=…`.
- `app/(auth)/` — login y registro. Si ya tenés sesión, te saca de ahí.

`/offline` y `/auth/callback` quedan fuera de los dos: la primera la sirve el
service worker cuando no hay red, y la segunda es adonde vuelve el link del mail.

En el servidor siempre se usa `getUser()`, nunca `getSession()`: `getSession()`
lee la cookie y confía en lo que dice, así que un token adulterado pasaría.
`getUser()` lo valida contra Supabase.

El proxy redirige, pero **no** es el control de acceso. El control de acceso es
Row Level Security. Si el proxy tuviera un agujero, RLS sigue tapando.

### Configurar el proyecto de Supabase

1. **Authentication → URL Configuration**
   - *Site URL*: la URL de producción.
   - *Redirect URLs*: agregá `https://localhost:3000/auth/callback`, la de
     producción y `https://*-tu-usuario.vercel.app/auth/callback` para los previews.
2. **Authentication → Email Templates → Confirm signup**: que el link apunte a
   `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup`.
   La ruta también acepta el flujo con `code`, así que si dejás la plantilla por
   defecto igual funciona.
3. Para regenerar tipos, una vez: `npx supabase login` y
   `npx supabase link --project-ref <tu-ref>`. Después alcanza con `npm run tipos`.

## El service worker

El fuente está en `lib/service-worker.js` — **ese es el que se edita**.

`scripts/copiar-sw.mjs` lo copia a `public/sw.js` reemplazando dos marcadores
(versión de cache y modo). Corre solo, como parte de `dev` y `build`. Hay dos
razones para esta vuelta:

- Next sirve estáticos únicamente desde `public/`.
- Un service worker no controla rutas por encima de la suya, así que tiene que
  servirse desde la raíz del sitio.

`public/sw.js` está en `.gitignore`: es un archivo generado. Por eso el paso de
copia está **adentro** del script `build` y no en un `prebuild`; si alguien
configura el Build Command de Vercel como `next build` a secas, un `prebuild`
no se ejecutaría y la app se desplegaría sin service worker, sin avisar.

En desarrollo el service worker no cachea `/_next/static`: en dev los chunks
cambian de contenido conservando el nombre, y cachearlos te haría ver código
viejo sin entender por qué.

Las pruebas (`npm test`) levantan el fuente real en un contexto simulado y
verifican lo que no se puede mirar a ojo sin desconectar el wifi: qué se
cachea, qué nunca se toca (POST, otros dominios, payloads RSC) y qué se
muestra cuando no hay red.

## Deploy

```bash
npx vercel login     # abre el navegador
npx vercel           # preview
npx vercel --prod    # producción
```

El primer `npx vercel` te pregunta a qué proyecto vincular y crea `.vercel/`
(ignorado por git).

Para probar la instalación en un teléfono hace falta un preview de Vercel: el
certificado autofirmado de `--experimental-https` no es de confianza para el
celular, y sin certificado válido el navegador no registra el service worker.

## Reglas del proyecto

1. PWA instalable, diseño primero para teléfono.
2. Toda escritura pasa por Server Actions. El cliente nunca escribe directo
   contra la base.
3. Row Level Security activo en todas las tablas.
4. La ubicación exacta de un usuario no se le muestra nunca a otro: solo se
   expone la distancia en metros.
5. Interfaz en español rioplatense, con voseo. Los errores dicen qué hacer.
6. TypeScript estricto, sin `any`.
7. Tablas, columnas y funciones de la base, en español.
8. Componentes de servidor por defecto; `'use client'` solo donde hace falta
   interactividad real.

### Seguimiento de paseos

No hay seguimiento GPS en vivo. El modelo es: una foto y una lectura puntual de
GPS al salir, otra al volver, y un reporte al final. Es una decisión de
producto, no una limitación técnica.
