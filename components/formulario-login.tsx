'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { CampoTexto } from '@/components/campo-texto';
import { iniciarSesion } from '@/lib/acciones/autenticacion';
import { esquemaLogin, type DatosLogin } from '@/lib/esquemas/autenticacion';

type Entrada = z.input<typeof esquemaLogin>;

export function FormularioLogin({ volver }: { readonly volver?: string }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Entrada, unknown, DatosLogin>({
    resolver: zodResolver(esquemaLogin),
    defaultValues: { email: '', contrasena: '' },
  });

  const enviar = handleSubmit(async (datos) => {
    const resultado = await iniciarSesion(datos, volver);

    // Si la sesión abrió, el Server Action redirige y esto no llega a correr.
    if (resultado.campo === undefined) {
      setError('root', { message: resultado.mensaje });
    } else {
      setError(resultado.campo === 'nombre' ? 'root' : resultado.campo, {
        message: resultado.mensaje,
      });
    }
  });

  return (
    <form onSubmit={(evento) => void enviar(evento)} noValidate className="space-y-4">
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
        autoComplete="current-password"
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
        {isSubmitting ? 'Entrando…' : 'Entrar'}
      </button>

      <p className="pt-2 text-center text-sm text-tinta-suave">
        ¿Todavía no tenés cuenta?{' '}
        <Link href="/registro" className="font-semibold text-verde">
          Registrate
        </Link>
      </p>
    </form>
  );
}
