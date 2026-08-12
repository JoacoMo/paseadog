'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { esquemaLogin, esquemaRegistro } from '@/lib/esquemas/autenticacion';
import { traducirErrorAuth, type CampoDelError } from '@/lib/supabase/errores';
import { crearClienteServidor } from '@/lib/supabase/server';

export type ResultadoError = {
  readonly ok: false;
  readonly mensaje: string;
  readonly campo?: CampoDelError;
};

export type ResultadoRegistro =
  | { readonly ok: true; readonly requiereConfirmacion: boolean; readonly email: string }
  | ResultadoError;

const ERROR_DATOS: ResultadoError = {
  ok: false,
  mensaje: 'Revisá los datos del formulario.',
};

/**
 * Solo se acepta volver a una ruta interna.
 *
 * Sin este filtro, alguien podría mandarte un link a
 * /login?volver=https://sitio-falso.com y, después de que pongas tu contraseña,
 * la app te llevaría sola hasta ahí. `//` y `/\` los descartamos porque el
 * navegador los interpreta como "otro dominio", no como una ruta nuestra.
 */
function destinoSeguro(volver: string | undefined): string {
  if (volver === undefined || !volver.startsWith('/')) return '/';
  if (volver.startsWith('//') || volver.startsWith('/\\')) return '/';
  return volver;
}

export async function iniciarSesion(
  datosCrudos: unknown,
  volver?: string,
): Promise<ResultadoError> {
  // El formulario ya validó, pero un Server Action es un endpoint HTTP: se puede
  // llamar sin pasar por el formulario. Se valida de nuevo, siempre.
  const validado = esquemaLogin.safeParse(datosCrudos);
  if (!validado.success) return ERROR_DATOS;

  const supabase = await crearClienteServidor();

  const { error } = await supabase.auth.signInWithPassword({
    email: validado.data.email,
    password: validado.data.contrasena,
  });

  if (error !== null) {
    const { mensaje, campo } = traducirErrorAuth(error);
    return campo === undefined ? { ok: false, mensaje } : { ok: false, mensaje, campo };
  }

  revalidatePath('/', 'layout');
  // redirect() lanza una excepción que Next intercepta: va afuera de todo
  // try/catch, si no, se la come el catch y la navegación no pasa.
  redirect(destinoSeguro(volver));
}

export async function registrarse(datosCrudos: unknown): Promise<ResultadoRegistro> {
  const validado = esquemaRegistro.safeParse(datosCrudos);
  if (!validado.success) return ERROR_DATOS;

  const { nombre, email, contrasena } = validado.data;
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase.auth.signUp({
    email,
    password: contrasena,
    options: {
      // El trigger crear_perfil_nuevo_usuario() lee de acá el nombre para armar
      // la fila en `perfiles`. Si no viaja, el perfil queda como "Sin nombre".
      data: { nombre },
    },
  });

  if (error !== null) {
    const { mensaje, campo } = traducirErrorAuth(error);
    return campo === undefined ? { ok: false, mensaje } : { ok: false, mensaje, campo };
  }

  /*
   * Si el email ya existe, Supabase NO devuelve error: contesta como si el alta
   * hubiera salido bien, pero con `identities` vacío. Lo hace a propósito, para
   * que nadie pueda usar el registro como forma de averiguar qué direcciones
   * tienen cuenta. Del lado nuestro hay que detectarlo así.
   */
  if (data.user !== null && data.user.identities?.length === 0) {
    return {
      ok: false,
      mensaje: 'Ese email ya está registrado. Iniciá sesión o recuperá tu contraseña.',
      campo: 'email',
    };
  }

  // Con "Confirm email" prendido en Supabase, el alta no abre sesión: primero
  // hay que tocar el link del mail.
  if (data.session === null) {
    return { ok: true, requiereConfirmacion: true, email };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function cerrarSesion(): Promise<void> {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();

  revalidatePath('/', 'layout');
  redirect('/login');
}
