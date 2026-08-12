/**
 * Service worker de Paseo — ARCHIVO FUENTE.
 *
 * Editá este archivo. `scripts/copiar-sw.mjs` lo copia a `public/sw.js`
 * (que es el que sirve Next) reemplazando los marcadores de abajo. Un service
 * worker solo controla su propia carpeta y las de adentro, así que tiene que
 * servirse desde la raíz del sitio para poder controlar toda la app.
 *
 * Alcance de esta etapa: cachear el shell y responder con una pantalla offline.
 * Nada de sincronización en segundo plano ni de ubicación.
 */

const NOMBRE_CACHE = '__VERSION_CACHE__';
const MODO = '__MODO__';
const RUTA_OFFLINE = '/offline';

const RECURSOS_SHELL = [
  '/',
  RUTA_OFFLINE,
  '/manifest.webmanifest',
  '/iconos/icono-192.png',
  '/iconos/icono-512.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    (async () => {
      const cache = await caches.open(NOMBRE_CACHE);

      // Uno por uno y sin cortar ante un error: con cache.addAll(), si un solo
      // recurso falla, no se instala nada y la app se queda sin offline.
      await Promise.allSettled(
        RECURSOS_SHELL.map(async (ruta) => {
          const respuesta = await fetch(ruta, { cache: 'reload' });
          if (respuesta.ok) await cache.put(ruta, respuesta);
        }),
      );

      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      const nombres = await caches.keys();
      await Promise.all(
        nombres
          .filter((nombre) => nombre.startsWith('paseo-') && nombre !== NOMBRE_CACHE)
          .map((nombre) => caches.delete(nombre)),
      );

      await self.clients.claim();
    })(),
  );
});

function esEstatico(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/iconos/') ||
    url.pathname === '/manifest.webmanifest'
  );
}

/** Red primero, con la copia cacheada como red de emergencia. Para navegación. */
async function redPrimero(pedido) {
  const cache = await caches.open(NOMBRE_CACHE);

  try {
    const respuesta = await fetch(pedido);
    if (respuesta.ok) cache.put(pedido, respuesta.clone());
    return respuesta;
  } catch {
    const cacheada = await cache.match(pedido);
    if (cacheada) return cacheada;

    const offline = await cache.match(RUTA_OFFLINE);
    if (offline) return offline;

    return new Response('Estás sin conexión.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

/** Cache primero y refresco en segundo plano. Para assets con nombre versionado. */
async function cachePrimero(pedido) {
  const cache = await caches.open(NOMBRE_CACHE);
  const cacheada = await cache.match(pedido);

  const desdeRed = fetch(pedido)
    .then((respuesta) => {
      if (respuesta.ok) cache.put(pedido, respuesta.clone());
      return respuesta;
    })
    .catch(() => undefined);

  if (cacheada) return cacheada;

  const respuesta = await desdeRed;
  if (respuesta) return respuesta;

  return new Response('', { status: 504 });
}

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;

  // Nunca tocamos escrituras. Las Server Actions viajan por POST y tienen que
  // llegar a la red tal cual, sin cachear ni reintentar por nuestra cuenta.
  if (pedido.method !== 'GET') return;

  const url = new URL(pedido.url);

  // Solo lo nuestro. Supabase, Mercado Pago y los tiles del mapa van directo.
  if (url.origin !== self.location.origin) return;

  // Los payloads de React Server Components cambian con cada navegación y
  // dependen de headers; cachearlos sirve HTML viejo mezclado con datos nuevos.
  if (url.searchParams.has('_rsc')) return;

  if (pedido.mode === 'navigate') {
    evento.respondWith(redPrimero(pedido));
    return;
  }

  // En desarrollo los chunks de Next cambian en cada compilación y comparten
  // nombre: cachearlos te haría ver código viejo sin entender por qué.
  if (MODO === 'desarrollo') return;

  if (esEstatico(url)) {
    evento.respondWith(cachePrimero(pedido));
  }
});
