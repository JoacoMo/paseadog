'use client';

import { createBrowserClient } from '@supabase/ssr';

import { CLAVE_ANONIMA_SUPABASE, URL_SUPABASE } from './entorno';
import type { Database } from './tipos-base';

/**
 * Cliente de Supabase para el navegador.
 *
 * Ojo con para qué se usa: por la regla 2 del proyecto, el cliente NO escribe
 * contra la base. Toda escritura pasa por un Server Action. Esto queda para
 * lecturas desde componentes cliente (TanStack Query) y, más adelante, para
 * suscribirse a Realtime, que sí necesita una conexión desde el navegador.
 *
 * `createBrowserClient` ya devuelve siempre la misma instancia, así que llamarlo
 * en varios componentes no abre varias conexiones.
 */
export function crearClienteNavegador() {
  return createBrowserClient<Database>(URL_SUPABASE, CLAVE_ANONIMA_SUPABASE);
}
