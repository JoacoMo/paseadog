import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { armarCsp, generarNonce } from '@/lib/csp';
import { CLAVE_ANONIMA_SUPABASE, URL_SUPABASE } from '@/lib/supabase/entorno';
import type { Database } from '@/lib/supabase/tipos-base';

/**
 * Esto es lo que hasta Next 15 se llamaba `middleware.ts`.
 *
 * Next 16 deprecó ese nombre y pide `proxy.ts`, con la función exportada como
 * `proxy` en vez de `middleware`. Es solo el cambio de nombre: la API, el
 * `config.matcher` y el runtime son los mismos. Se migró ahora para no arrancar
 * el proyecto sobre una convención que ya avisa que se va.
 *
 * Corre antes que cualquier pantalla y hace dos cosas:
 *   1. Refresca la sesión de Supabase y decide quién puede pasar.
 *   2. Genera el nonce de la CSP, que necesita ser distinto en cada request.
 */

const esDesarrollo = process.env.NODE_ENV !== 'production';

/** Rutas que se ven sin sesión. Todo lo demás pide estar logueado. */
const RUTAS_PUBLICAS = ['/login', '/registro', '/offline', '/auth/callback'];

/** Rutas a las que no tiene sentido entrar ya logueado. */
const RUTAS_SOLO_ANONIMO = ['/login', '/registro'];

function esPublica(ruta: string): boolean {
  return RUTAS_PUBLICAS.some((publica) => ruta === publica || ruta.startsWith(`${publica}/`));
}

export async function proxy(request: NextRequest) {
  const nonce = generarNonce();
  const csp = armarCsp(nonce, esDesarrollo);

  // El nonce viaja en los encabezados del *request*: Next los lee y se lo pone
  // solo a los scripts que genera. `x-nonce` es para nuestro script inline.
  const encabezados = new Headers(request.headers);
  encabezados.set('x-nonce', nonce);
  encabezados.set('Content-Security-Policy', csp);

  let respuesta = NextResponse.next({ request: { headers: encabezados } });

  const supabase = createServerClient<Database>(URL_SUPABASE, CLAVE_ANONIMA_SUPABASE, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesNuevas) {
        // Las cookies refrescadas van a los dos lados: al request (para que lo
        // que renderice después en este mismo ciclo vea la sesión nueva) y a la
        // respuesta (para que el navegador se las guarde).
        for (const { name, value } of cookiesNuevas) {
          request.cookies.set(name, value);
        }

        respuesta = NextResponse.next({ request: { headers: encabezados } });

        for (const { name, value, options } of cookiesNuevas) {
          respuesta.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() y no getSession(): getSession() confía en la cookie sin validarla.
  // Esta llamada además es la que refresca el token cuando está por vencer.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ruta = request.nextUrl.pathname;

  /** Copia a la redirección las cookies que Supabase acaba de refrescar. */
  const redirigirA = (destino: URL) => {
    const redireccion = NextResponse.redirect(destino);
    for (const cookie of respuesta.cookies.getAll()) {
      redireccion.cookies.set(cookie);
    }
    redireccion.headers.set('Content-Security-Policy', csp);
    return redireccion;
  };

  if (user === null && !esPublica(ruta)) {
    const destino = request.nextUrl.clone();
    destino.pathname = '/login';
    destino.search = '';
    // A dónde quería ir, para devolverlo ahí después de entrar. Se guarda solo
    // la ruta, nunca una URL completa: si aceptáramos una absoluta, cualquiera
    // podría armar un link que después del login te manda a otro sitio.
    if (ruta !== '/') destino.searchParams.set('volver', ruta);
    return redirigirA(destino);
  }

  if (user !== null && RUTAS_SOLO_ANONIMO.includes(ruta)) {
    const destino = request.nextUrl.clone();
    destino.pathname = '/';
    destino.search = '';
    return redirigirA(destino);
  }

  respuesta.headers.set('Content-Security-Policy', csp);
  return respuesta;
}

export const config = {
  matcher: [
    /*
     * Todo menos:
     * - _next/static y _next/image: assets con hash, no necesitan sesión
     * - sw.js y manifest.webmanifest: los pide el navegador sin cookies
     * - iconos y favicon: estáticos
     *
     * Importa que el service worker quede afuera: si el middleware lo
     * redirigiera al login, el navegador registraría el HTML del login como
     * service worker y la PWA quedaría rota hasta desinstalarla.
     */
    '/((?!_next/static|_next/image|sw\\.js|manifest\\.webmanifest|iconos/|favicon\\.ico).*)',
  ],
};
