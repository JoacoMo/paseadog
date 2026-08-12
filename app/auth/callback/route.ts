import { NextResponse, type NextRequest } from 'next/server';

import { crearClienteServidor } from '@/lib/supabase/server';

/**
 * Adonde vuelve el usuario cuando toca el link del mail de confirmación.
 *
 * Sin esta ruta el registro queda por la mitad: Supabase confirma la cuenta pero
 * la sesión nunca llega a las cookies de la app, y el usuario vuelve al login
 * sin entender por qué le pide entrar de nuevo.
 *
 * Se aceptan las dos formas que manda Supabase según cómo esté configurada la
 * plantilla del mail:
 *   - `code`: flujo PKCE, que es el que usa @supabase/ssr por defecto.
 *   - `token_hash` + `type`: el que sale de usar {{ .TokenHash }} en la plantilla.
 */

function destinoSeguro(valor: string | null): string {
  if (valor === null || !valor.startsWith('/')) return '/';
  if (valor.startsWith('//') || valor.startsWith('/\\')) return '/';
  return valor;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const tipo = searchParams.get('type');
  const siguiente = destinoSeguro(searchParams.get('next'));

  const supabase = await crearClienteServidor();

  if (code !== null) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error === null) return NextResponse.redirect(`${origin}${siguiente}`);
  } else if (tokenHash !== null && tipo !== null) {
    const { error } = await supabase.auth.verifyOtp({
      type: tipo as 'signup' | 'email' | 'recovery' | 'email_change' | 'invite',
      token_hash: tokenHash,
    });
    if (error === null) return NextResponse.redirect(`${origin}${siguiente}`);
  }

  // El link vencido o ya usado es el caso más común: los de confirmación duran
  // 24 horas. El login muestra el aviso a partir de este parámetro.
  return NextResponse.redirect(`${origin}/login?aviso=confirmacion-fallida`);
}
