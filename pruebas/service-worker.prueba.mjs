/**
 * Pruebas del service worker. Corren con `npm test` (node --test, sin librerías).
 *
 * Lo que se prueba acá es el contrato que no se puede verificar a ojo en el
 * navegador sin desconectar el wifi cada vez: qué se cachea, qué no se toca
 * nunca, y qué se muestra cuando no hay red.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { crearEntorno, pedidoFalso, respuestaRedirigida } from './entorno-sw.mjs';

const RED_CAIDA = () => Promise.reject(new TypeError('Failed to fetch'));

test('install cachea el shell, sin la home', async () => {
  const sw = crearEntorno();
  sw.definirRed(async () => new Response('ok', { status: 200 }));

  await sw.instalar();

  const cache = await sw.caches.open(sw.nombreCache);
  assert.deepEqual(cache.rutas.sort(), [
    '/iconos/icono-192.png',
    '/iconos/icono-512.png',
    '/manifest.webmanifest',
    '/offline',
  ]);
  assert.ok(!cache.rutas.includes('/'), 'la home depende de la sesión: no se precachea');
  assert.equal(sw.registro.skipWaiting, true);
});

test('install no se cae si un recurso del shell falla', async () => {
  const sw = crearEntorno();
  sw.definirRed(async (ruta) => {
    if (String(ruta).includes('icono-512')) throw new TypeError('Failed to fetch');
    return new Response('ok', { status: 200 });
  });

  await sw.instalar();

  const cache = await sw.caches.open(sw.nombreCache);
  assert.ok(cache.rutas.includes('/offline'), 'la pantalla offline tiene que quedar cacheada');
  assert.ok(!cache.rutas.includes('/iconos/icono-512.png'));
});

test('install ignora respuestas que no son 200', async () => {
  const sw = crearEntorno();
  sw.definirRed(async (ruta) =>
    String(ruta).includes('/offline')
      ? new Response('no está', { status: 404 })
      : new Response('ok', { status: 200 }),
  );

  await sw.instalar();

  const cache = await sw.caches.open(sw.nombreCache);
  assert.ok(!cache.rutas.includes('/offline'), 'un 404 no se guarda como si fuera la pantalla');
});

test('install ignora lo que llegó por una redirección', async () => {
  const sw = crearEntorno();
  sw.definirRed(async (ruta) =>
    String(ruta).includes('/offline')
      ? respuestaRedirigida('<html>login</html>')
      : new Response('ok', { status: 200 }),
  );

  await sw.instalar();

  const cache = await sw.caches.open(sw.nombreCache);
  assert.ok(
    !cache.rutas.includes('/offline'),
    'una respuesta redirigida no se puede devolver a una navegación: no se guarda',
  );
});

test('activate borra los caches viejos de Paseo y respeta los ajenos', async () => {
  const sw = crearEntorno({ version: 'nueva' });
  await sw.caches.open('paseo-vieja');
  await sw.caches.open('otra-app-v1');
  await sw.instalar();

  await sw.activar();

  assert.deepEqual((await sw.caches.keys()).sort(), ['otra-app-v1', 'paseo-nueva']);
  assert.equal(sw.registro.claim, true);
});

test('no toca las escrituras: los POST van a la red sin pasar por el cache', async () => {
  const sw = crearEntorno();
  await sw.instalar();

  const respuesta = await sw.pedir(pedidoFalso('/reservas', { metodo: 'POST', modo: 'navigate' }));

  assert.equal(respuesta, undefined, 'una Server Action nunca puede ser interceptada');
});

test('no toca pedidos de otros dominios', async () => {
  const sw = crearEntorno();
  await sw.instalar();

  const respuesta = await sw.pedir(pedidoFalso('https://xxx.supabase.co/auth/v1/token'));

  assert.equal(respuesta, undefined);
});

test('no toca los payloads RSC', async () => {
  const sw = crearEntorno();
  await sw.instalar();

  const respuesta = await sw.pedir(pedidoFalso('/reservas?_rsc=a1b2c'));

  assert.equal(respuesta, undefined);
});

test('navegación con red: devuelve lo de la red', async () => {
  const sw = crearEntorno();
  await sw.instalar();
  sw.definirRed(async () => new Response('<html>reservas</html>', { status: 200 }));

  const respuesta = await sw.pedir(pedidoFalso('/reservas', { modo: 'navigate' }));

  assert.equal(await respuesta.text(), '<html>reservas</html>');
});

test('NUNCA guarda el HTML de una pantalla con sesión', async () => {
  const sw = crearEntorno();
  sw.definirRed(async () => new Response('<html>offline</html>', { status: 200 }));
  await sw.instalar();

  sw.definirRed(async () => new Response('<html>los perros de Joaquín</html>', { status: 200 }));
  await sw.pedir(pedidoFalso('/mis-perros', { modo: 'navigate' }));

  const cache = await sw.caches.open(sw.nombreCache);
  assert.ok(
    !cache.rutas.includes('/mis-perros'),
    'ese HTML tiene datos de una persona; no puede quedar en el disco del teléfono',
  );

  // Y sin red muestra la pantalla offline, no lo de la sesión anterior.
  sw.definirRed(RED_CAIDA);
  const respuesta = await sw.pedir(pedidoFalso('/mis-perros', { modo: 'navigate' }));
  assert.equal(await respuesta.text(), '<html>offline</html>');
});

test('navegación sin red: sirve la pantalla offline', async () => {
  const sw = crearEntorno();
  sw.definirRed(async (ruta) =>
    String(ruta).includes('/offline')
      ? new Response('<html>Estás sin conexión</html>', { status: 200 })
      : new Response('ok', { status: 200 }),
  );
  await sw.instalar();

  sw.definirRed(RED_CAIDA);
  const respuesta = await sw.pedir(pedidoFalso('/perfil', { modo: 'navigate' }));

  assert.equal(await respuesta.text(), '<html>Estás sin conexión</html>');
});

test('navegación sin red y sin pantalla offline cacheada: 503 legible', async () => {
  const sw = crearEntorno();
  sw.definirRed(RED_CAIDA);
  await sw.instalar();

  const respuesta = await sw.pedir(pedidoFalso('/perfil', { modo: 'navigate' }));

  assert.equal(respuesta.status, 503);
  assert.match(await respuesta.text(), /sin conexión/i);
});

test('en producción los assets estáticos salen del cache', async () => {
  const sw = crearEntorno({ modo: 'produccion' });
  await sw.instalar();

  const asset = pedidoFalso('/_next/static/chunks/abc.js');
  sw.definirRed(async () => new Response('v1', { status: 200 }));
  assert.equal(await (await sw.pedir(asset)).text(), 'v1');

  sw.definirRed(RED_CAIDA);
  assert.equal(await (await sw.pedir(asset)).text(), 'v1', 'sin red tiene que salir del cache');
});

test('un asset que devuelve error no pisa la copia buena', async () => {
  const sw = crearEntorno();
  await sw.instalar();

  const asset = pedidoFalso('/_next/static/chunks/abc.js');
  sw.definirRed(async () => new Response('bueno', { status: 200 }));
  await sw.pedir(asset);

  sw.definirRed(async () => new Response('error', { status: 500 }));
  await sw.pedir(asset);

  sw.definirRed(RED_CAIDA);
  assert.equal(await (await sw.pedir(asset)).text(), 'bueno');
});

test('en desarrollo los assets NO se cachean (si no, ves código viejo)', async () => {
  const sw = crearEntorno({ modo: 'desarrollo' });
  await sw.instalar();

  const respuesta = await sw.pedir(pedidoFalso('/_next/static/chunks/abc.js'));

  assert.equal(respuesta, undefined, 'en dev el chunk tiene que ir siempre a la red');
});

test('en desarrollo la navegación sigue teniendo respaldo offline', async () => {
  const sw = crearEntorno({ modo: 'desarrollo' });
  sw.definirRed(async () => new Response('<html>offline</html>', { status: 200 }));
  await sw.instalar();

  sw.definirRed(RED_CAIDA);
  const respuesta = await sw.pedir(pedidoFalso('/perfil', { modo: 'navigate' }));

  assert.equal(await respuesta.text(), '<html>offline</html>');
});
