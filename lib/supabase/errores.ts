import { AuthError } from '@supabase/supabase-js';

/**
 * Traduce los errores de Supabase Auth al castellano.
 *
 * Supabase contesta en inglés y con textos pensados para quien programa
 * ("Invalid login credentials", "AuthApiError: ..."). Nada de eso puede llegar
 * a la pantalla. Cada mensaje de acá tiene que decir qué pasó y qué hacer.
 *
 * Se traduce por `code`, que es estable, y no por el texto del mensaje, que
 * Supabase cambia entre versiones. El texto queda solo como red de emergencia
 * para los códigos que todavía no existían cuando se escribió esto.
 */

/** A qué campo del formulario corresponde el error, si corresponde a alguno. */
export type CampoDelError = 'email' | 'contrasena' | 'nombre';

export type ErrorTraducido = {
  readonly mensaje: string;
  readonly campo?: CampoDelError;
};

const POR_CODIGO: Record<string, ErrorTraducido> = {
  invalid_credentials: {
    mensaje: 'Email o contraseña incorrectos. Fijate que no tengas activado el bloqueo de mayúsculas.',
  },
  email_not_confirmed: {
    mensaje:
      'Todavía no confirmaste tu email. Buscá el mensaje que te mandamos y tocá el link. Revisá también el correo no deseado.',
    campo: 'email',
  },
  user_already_exists: {
    mensaje: 'Ese email ya está registrado. Iniciá sesión o recuperá tu contraseña.',
    campo: 'email',
  },
  email_exists: {
    mensaje: 'Ese email ya está registrado. Iniciá sesión o recuperá tu contraseña.',
    campo: 'email',
  },
  email_address_invalid: {
    mensaje: 'Ese email no parece válido. Revisá que esté bien escrito.',
    campo: 'email',
  },
  weak_password: {
    mensaje: 'Esa contraseña es muy fácil de adivinar. Probá con una más larga, mezclando palabras.',
    campo: 'contrasena',
  },
  same_password: {
    mensaje: 'La contraseña nueva tiene que ser distinta de la actual.',
    campo: 'contrasena',
  },
  over_request_rate_limit: {
    mensaje: 'Probaste muchas veces seguidas. Esperá un minuto y volvé a intentar.',
  },
  over_email_send_rate_limit: {
    mensaje: 'Ya te mandamos varios mails seguidos. Esperá unos minutos antes de pedir otro.',
    campo: 'email',
  },
  signup_disabled: {
    mensaje: 'Por ahora el registro está cerrado. Escribinos si querés que te avisemos cuando abra.',
  },
  provider_disabled: {
    mensaje: 'Esa forma de iniciar sesión no está habilitada.',
  },
  user_not_found: {
    mensaje: 'No encontramos una cuenta con ese email.',
    campo: 'email',
  },
  session_not_found: {
    mensaje: 'Tu sesión venció. Volvé a iniciar sesión.',
  },
  captcha_failed: {
    mensaje: 'No pudimos verificar que no seas un robot. Recargá la página y probá de nuevo.',
  },
  validation_failed: {
    mensaje: 'Revisá los datos: hay algo que no tiene el formato esperado.',
  },
};

/** Para versiones de Supabase que todavía no mandan `code`. */
const POR_TEXTO: readonly (readonly [RegExp, ErrorTraducido])[] = [
  [/invalid login credentials/i, POR_CODIGO.invalid_credentials!],
  [/email not confirmed/i, POR_CODIGO.email_not_confirmed!],
  [/user already registered|already been registered/i, POR_CODIGO.user_already_exists!],
  [/password should be at least|password is too short/i, POR_CODIGO.weak_password!],
  [/rate limit|too many requests/i, POR_CODIGO.over_request_rate_limit!],
  [/unable to validate email|invalid email/i, POR_CODIGO.email_address_invalid!],
];

const GENERICO: ErrorTraducido = {
  mensaje: 'No pudimos completar la operación. Probá de nuevo en un momento.',
};

const SIN_RED: ErrorTraducido = {
  mensaje: 'No pudimos conectarnos. Fijate el wifi o los datos móviles y volvé a intentar.',
};

export function traducirErrorAuth(error: unknown): ErrorTraducido {
  if (!(error instanceof AuthError)) {
    // Ni siquiera llegamos a Supabase: casi siempre es falta de conexión.
    console.error('Error no esperado en auth:', error);
    return SIN_RED;
  }

  if (error.code !== undefined) {
    const conocido = POR_CODIGO[error.code];
    if (conocido !== undefined) return conocido;
  }

  for (const [patron, traduccion] of POR_TEXTO) {
    if (patron.test(error.message)) return traduccion;
  }

  // Sin traducción: al usuario le va algo genérico y el detalle queda en el log.
  console.error(`Error de auth sin traducir (code=${error.code ?? 'sin código'}):`, error.message);
  return GENERICO;
}
