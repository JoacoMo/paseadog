import { z } from 'zod';

/**
 * Esquemas de los formularios de autenticación.
 *
 * Un solo esquema por formulario, usado en los dos lados: react-hook-form lo
 * usa para avisarle al usuario mientras escribe, y el Server Action lo vuelve a
 * correr sobre lo que llega. Esa segunda validación no es redundante: el Server
 * Action es un endpoint HTTP y cualquiera puede llamarlo con lo que quiera, sin
 * pasar por el formulario.
 *
 * Los límites de `nombre` (2 a 80) son los mismos que el CHECK de la tabla
 * `perfiles`. Si cambian allá, cambian acá.
 */

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Escribí un email válido, por ejemplo nombre@correo.com.' }));

const contrasena = z
  .string()
  .min(8, { error: 'La contraseña necesita al menos 8 caracteres.' })
  .max(72, { error: 'La contraseña no puede pasar de 72 caracteres.' });

const nombre = z
  .string()
  .trim()
  .min(2, { error: 'Poné tu nombre, al menos 2 letras.' })
  .max(80, { error: 'El nombre no puede pasar de 80 caracteres.' });

export const esquemaLogin = z.object({
  email,
  // En login no exigimos largo mínimo: la contraseña ya existe y puede ser de
  // antes de esta regla. Si está mal, lo dice Supabase, no el formulario.
  contrasena: z.string().min(1, { error: 'Escribí tu contraseña.' }),
});

export const esquemaRegistro = z.object({
  nombre,
  email,
  contrasena,
});

export type DatosLogin = z.infer<typeof esquemaLogin>;
export type DatosRegistro = z.infer<typeof esquemaRegistro>;
