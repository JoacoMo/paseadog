'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { CampoTexto } from '@/components/campo-texto';
import { registrarse } from '@/lib/acciones/autenticacion';
import { esquemaRegistro, type DatosRegistro } from '@/lib/esquemas/autenticacion';

type Entrada = z.input<typeof esquemaRegistro>;

export function FormularioRegistro() {
  // Si el proyecto tiene "Confirm email" prendido, el alta no abre sesión: hay
  // que tocar el link del mail. En ese caso el formulario se reemplaza por el
  // aviso, porque volver a apretar "Crear cuenta" no arregla nada.
  const [emailAConfirmar, setEmailAConfirmar] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Entrada, unknown, DatosRegistro>({
    resolver: zodResolver(esquemaRegistro),
    defaultValues: { nombre: '', email: '', contrasena: '' },
  });

  const enviar = handleSubmit(async (datos) => {
    const resultado = await registrarse(datos);

    if (resultado.ok) {
      setEmailAConfirmar(resultado.email);
      return;
    }

    if (resultado.campo === undefined) {
      setError('root', { message: resultado.mensaje });
    } else {
      setError(resultado.campo, { message: resultado.mensaje });
    }
  });

  if (emailAConfirmar !== null) {
    return (
      <div className="rounded-2xl border border-borde bg-verde-suave p-5 text-center">
        <h2 className="text-base font-semibold text-tinta">Revisá tu email</h2>
        <p className="mt-2 text-sm text-tinta-suave">
          Le mandamos un mensaje a <span className="font-medium text-tinta">{emailAConfirmar}</span>.
          Tocá el link que trae para confirmar tu cuenta y ya podés entrar.
        </p>
        <p className="mt-3 text-sm text-tinta-suave">
          Si no lo ves, fijate en el correo no deseado.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block rounded-xl bg-verde px-5 py-3 text-sm font-semibold text-white active:bg-verde-oscuro"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={(evento) => void enviar(evento)} noValidate className="space-y-4">
      <CampoTexto
        etiqueta="¿Cómo te llamás?"
        type="text"
        autoComplete="name"
        autoCapitalize="words"
        placeholder="Joaquín"
        error={errors.nombre?.message}
        {...register('nombre')}
      />

      <CampoTexto
        etiqueta="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect="off"
        placeholder="nombre@correo.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <CampoTexto
        etiqueta="Contraseña"
        type="password"
        autoComplete="new-password"
        ayuda="Al menos 8 caracteres."
        error={errors.contrasena?.message}
        {...register('contrasena')}
      />

      {errors.root?.message === undefined ? null : (
        <p
          role="alert"
          className="rounded-xl border border-error/30 bg-error/5 px-3.5 py-3 text-sm text-tinta"
        >
          {errors.root.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-verde px-4 py-3.5 text-sm font-semibold text-white active:bg-verde-oscuro disabled:opacity-60"
      >
        {isSubmitting ? 'Creando la cuenta…' : 'Crear cuenta'}
      </button>

      <p className="pt-2 text-center text-sm text-tinta-suave">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="font-semibold text-verde">
          Iniciá sesión
        </Link>
      </p>
    </form>
  );
}
