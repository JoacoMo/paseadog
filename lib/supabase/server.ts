import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { CLAVE_ANONIMA_SUPABASE, URL_SUPABASE } from './entorno';
import type { Database } from './tipos-base';

/**
 * Cliente de Supabase para el servidor: Server Components, Server Actions y
 * Route Handlers.
 *
 * En Next 16 `cookies()` es asincrónico, así que esta función también lo es.
 *
 * El `try/catch` de `setAll` no es pereza. Desde un Server Component no se
 * pueden escribir cookies: cuando React empieza a mandar HTML ya no hay
 * encabezados que modificar, y Next tira una excepción. Ignorarlo es correcto
 * porque el middleware corre antes de cada request y ya dejó la sesión
 * refrescada con las cookies al día; lo que se pierde acá es una reescritura
 * redundante. En Server Actions y Route Handlers sí funciona y sí se aplica.
 */
export async function crearClienteServidor() {
  const almacen = await cookies();

  return createServerClient<Database>(URL_SUPABASE, CLAVE_ANONIMA_SUPABASE, {
    cookies: {
      getAll() {
        return almacen.getAll();
      },
      setAll(cookiesNuevas) {
        try {
          for (const { name, value, options } of cookiesNuevas) {
            almacen.set(name, value, options);
          }
        } catch {
          // Server Component: no hay dónde escribir. Lo resolvió el middleware.
        }
      },
    },
  });
}

/**
 * Usuario autenticado, o `null`.
 *
 * Usa `getUser()` y no `getSession()` a propósito: `getSession()` solo lee la
 * cookie y confía en lo que dice, así que un token adulterado pasaría. `getUser()`
 * lo valida contra Supabase. En el servidor, siempre `getUser()`.
 */
export async function obtenerUsuario() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Perfil del usuario logueado, con el nombre que creó el trigger de la base.
 * Devuelve `null` si no hay sesión.
 */
export async function obtenerPerfil() {
  const supabase = await crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) return null;

  const { data } = await supabase
    .from('perfiles')
    .select('id, nombre, telefono, foto_url, barrio, es_dueno, es_paseador, verificado, creado_en')
    .eq('id', user.id)
    .single();

  return data;
}
