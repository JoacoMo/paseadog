/**
 * Entorno falso para probar el service worker fuera del navegador.
 *
 * El service worker es el único archivo del proyecto que no puede romperse en
 * silencio: si se equivoca, el usuario ve código viejo o una pantalla en blanco,
 * y encima queda instalado en su teléfono. Pero no lo puede correr Node tal cual,
 * porque depende de `self`, `caches` y del evento `fetch`.
 *
 * Acá se arma un contexto con esas piezas simuladas y se ejecuta el fuente real
 * (lib/service-worker.js, con los marcadores reemplazados igual que en el build).
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const rutaFuente = join(raiz, 'lib', 'service-worker.js');

export const ORIGEN = 'https://paseo.test';

/** Normaliza a URL absoluta, que es como el Cache API real indexa las entradas. */
function clave(pedidoOUrl) {
  const url = typeof pedidoOUrl === 'string' ? pedidoOUrl : pedidoOUrl.url;
  return new URL(url, ORIGEN).href;
}

class CacheFalso {
  constructor() {
    this.almacen = new Map();
  }

  async put(pedido, respuesta) {
    if (respuesta.status === 206) throw new TypeError('No se puede cachear una respuesta parcial.');
    this.almacen.set(clave(pedido), respuesta);
  }

  async match(pedido) {
    return this.almacen.get(clave(pedido));
  }

  get rutas() {
    return [...this.almacen.keys()].map((url) => new URL(url).pathname);
  }
}

class CachesFalso {
  constructor() {
    this.porNombre = new Map();
  }

  async open(nombre) {
    if (!this.porNombre.has(nombre)) this.porNombre.set(nombre, new CacheFalso());
    return this.porNombre.get(nombre);
  }

  async keys() {
    return [...this.porNombre.keys()];
  }

  async delete(nombre) {
    return this.porNombre.delete(nombre);
  }
}

/** El Request real no se puede construir con mode 'navigate'; alcanza con esto. */
export function pedidoFalso(ruta, { metodo = 'GET', modo = 'no-cors' } = {}) {
  return { url: new URL(ruta, ORIGEN).href, method: metodo, mode: modo };
}

export function crearEntorno({ modo = 'produccion', version = 'prueba' } = {}) {
  const fuente = readFileSync(rutaFuente, 'utf8')
    .replace('__VERSION_CACHE__', `paseo-${version}`)
    .replace('__MODO__', modo);

  const oyentes = new Map();
  const caches = new CachesFalso();

  const pedidosVistos = [];
  let responderFetch = async () => new Response('desde la red', { status: 200 });

  const self = {
    location: { origin: ORIGEN },
    addEventListener: (tipo, fn) => oyentes.set(tipo, fn),
    skipWaiting: async () => {
      registro.skipWaiting = true;
    },
    clients: {
      claim: async () => {
        registro.claim = true;
      },
    },
  };

  const registro = { skipWaiting: false, claim: false };

  const contexto = createContext({
    self,
    caches,
    URL,
    Response,
    console,
    fetch: (pedido, opciones) => {
      pedidosVistos.push({ url: clave(pedido), opciones });
      return responderFetch(pedido, opciones);
    },
  });

  runInContext(fuente, contexto);

  return {
    caches,
    registro,
    pedidosVistos,
    nombreCache: `paseo-${version}`,

    /** Cambia lo que devuelve la red. Recibe (pedido) y devuelve una Response. */
    definirRed(fn) {
      responderFetch = fn;
    },

    async instalar() {
      const pendientes = [];
      oyentes.get('install')({ waitUntil: (p) => pendientes.push(p) });
      await Promise.all(pendientes);
    },

    async activar() {
      const pendientes = [];
      oyentes.get('activate')({ waitUntil: (p) => pendientes.push(p) });
      await Promise.all(pendientes);
    },

    /**
     * Devuelve la Response con la que respondió el service worker, o `undefined`
     * si no llamó a respondWith (o sea: dejó pasar el pedido a la red).
     */
    async pedir(pedido) {
      let respondida;
      oyentes.get('fetch')({ request: pedido, respondWith: (p) => (respondida = p) });
      return respondida === undefined ? undefined : await respondida;
    },
  };
}
