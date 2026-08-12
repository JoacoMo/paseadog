/**
 * Lee las variables de entorno de Supabase y falla temprano si faltan.
 *
 * Sin esto, olvidarte de cargar una variable en Vercel da un error críptico de
 * `fetch failed` recién cuando alguien intenta entrar. Preferimos que reviente
 * al arrancar y diga exactamente qué falta.
 *
 * Las dos son NEXT_PUBLIC_ a propósito: viajan al navegador y está bien que así
 * sea. La clave anónima no da permisos por sí sola, quien decide qué puede leer
 * o escribir cada usuario es Row Level Security. La clave de servicio
 * (service_role) NO se usa en este proyecto: saltea RLS por completo.
 */

function requerida(nombre: string, valor: string | undefined): string {
  if (valor === undefined || valor === '') {
    throw new Error(
      `Falta la variable de entorno ${nombre}. ` +
        'En local va en .env.local (copiá .env.example); en Vercel, en Project Settings → Environment Variables.',
    );
  }
  return valor;
}

export const URL_SUPABASE = requerida(
  'NEXT_PUBLIC_SUPABASE_URL',
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

export const CLAVE_ANONIMA_SUPABASE = requerida(
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
