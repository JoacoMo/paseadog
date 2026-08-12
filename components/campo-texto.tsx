'use client';

import { useId, useState, type ComponentPropsWithoutRef, type Ref } from 'react';

type Props = Omit<ComponentPropsWithoutRef<'input'>, 'id' | 'className'> & {
  readonly etiqueta: string;
  readonly error?: string | undefined;
  readonly ayuda?: string;
  readonly ref?: Ref<HTMLInputElement>;
};

/**
 * Campo de texto con etiqueta y error.
 *
 * Dos detalles que no son estéticos:
 *
 * - `text-base` (16px) es obligatorio. Con menos de 16px, Safari en iOS hace
 *   zoom solo al tocar el campo y la pantalla queda corrida.
 * - El error se anuncia con aria-describedby y aria-invalid, así un lector de
 *   pantalla lo lee al llegar al campo en vez de dejarlo mudo.
 */
export function CampoTexto({ etiqueta, error, ayuda, ref, type = 'text', ...props }: Props) {
  const id = useId();
  const idError = `${id}-error`;
  const idAyuda = `${id}-ayuda`;

  const [verContrasena, setVerContrasena] = useState(false);
  const esContrasena = type === 'password';
  const tipoReal = esContrasena && verContrasena ? 'text' : type;

  const descritoPor = [error !== undefined ? idError : null, ayuda !== undefined ? idAyuda : null]
    .filter((valor) => valor !== null)
    .join(' ');

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-tinta">
        {etiqueta}
      </label>

      <div className="relative mt-1.5">
        <input
          {...props}
          id={id}
          ref={ref}
          type={tipoReal}
          aria-invalid={error !== undefined}
          aria-describedby={descritoPor === '' ? undefined : descritoPor}
          className={`w-full rounded-xl border bg-white px-3.5 py-3 text-base text-tinta placeholder:text-tinta-suave/60 ${
            esContrasena ? 'pr-12' : ''
          } ${error === undefined ? 'border-borde' : 'border-error'}`}
        />

        {esContrasena ? (
          <button
            type="button"
            onClick={() => setVerContrasena((valor) => !valor)}
            aria-label={verContrasena ? 'Ocultar la contraseña' : 'Mostrar la contraseña'}
            aria-pressed={verContrasena}
            className="absolute inset-y-0 right-0 flex items-center px-3.5 text-tinta-suave"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
              <circle cx="12" cy="12" r="2.75" />
              {verContrasena ? <path d="m3 3 18 18" /> : null}
            </svg>
          </button>
        ) : null}
      </div>

      {ayuda === undefined ? null : (
        <p id={idAyuda} className="mt-1.5 text-xs text-tinta-suave">
          {ayuda}
        </p>
      )}

      {error === undefined ? null : (
        <p id={idError} className="mt-1.5 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
