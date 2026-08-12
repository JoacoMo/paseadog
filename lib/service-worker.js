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

/*
 * El shell NO incluye '/'.
 *
 * Desde que hay sesión, '/' redirige a /login cuando no estás logueado. Dos
 * problemas con guardarlo: el contenido depende de quién sos, y una respuesta
 * que vino de una redirección no se puede devolver a una navegación (el
 * navegador la rechaza con "redirected response ... redirect mode is not
 * follow"). Lo que se precachea es solo lo que es igual para todo el mundo.
 */
const RECURSOS_SHELL = [
  RUTA_OFFLINE,
  '/manifest.webmanifest',
  '/iconos/icono-192.png',
  '/iconos/icono-512.png',
];

/**
 * Una respuesta que llegó siguiendo una redirección no sirve para responderle a
 * una navegación, y encima suele ser de otra ruta que la pedida.
 */
function sePuedeCachear(respuesta) {
  return respuesta.ok && !respuesta.redirected;
}

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    (async () => {
      const cache = await caches.open(NOMBRE_CACHE);

      // Uno por uno y sin cortar ante un error: con cache.addAll(), si un solo
      // recurso falla, no se instala nada y la app se queda sin offline.
      await Promise.allSettled(
        RECURSOS_SHELL.map(async (ruta) => {
          const respuesta = await fetch(ruta, { cache: 'reload' });
          if (sePuedeCachear(respuesta)) await cache.put(ruta, respuesta);
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

/**
 * Navegación: siempre a la red, y si no hay red, la pantalla offline.
 *
 * A propósito no se guarda el HTML de las pantallas visitadas. Desde que hay
 * sesión ese HTML trae datos de una persona (sus perros, sus reservas, su
 * barrio) y queda en el disco del teléfono hasta que se desinstale la PWA. Si
 * después entra otra persona al mismo teléfono y se queda sin señal, estaría
 * viendo la pantalla de la anterior. Poder navegar offline por lo ya visitado
 * no vale eso.
 */
async function navegacion(pedido) {
  try {
    return await fetch(pedido);
  } catch {
    const cache = await caches.open(NOMBRE_CACHE);
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
      if (sePuedeCachear(respuesta)) cache.put(pedido, respuesta.clone());
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
    evento.respondWith(navegacion(pedido));
    return;
  }

  // En desarrollo los chunks de Next cambian en cada compilación y comparten
  // nombre: cachearlos te haría ver código viejo sin entender por qué.
  if (MODO === 'desarrollo') return;

  if (esEstatico(url)) {
    evento.respondWith(cachePrimero(pedido));
  }
});
