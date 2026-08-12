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
npm run dev        # https://localhost:3000 (certificado autofirmado)
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
