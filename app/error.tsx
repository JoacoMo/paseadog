'use client';

import { useEffect } from 'react';

import { claseBoton, PantallaMensaje } from '@/components/pantalla-mensaje';

/**
 * Atrapa los errores de render de cualquier pantalla. Tiene que ser componente
 * de cliente: React necesita un límite de error real y el botón reintenta sin
 * recargar toda la app.
 *
 * `digest` es el identificador que Next le pone al error en producción, donde el
 * mensaje real no se manda al navegador. Mostrarlo sirve para que el usuario nos
 * lo pueda pasar cuando reporta el problema.
 */
export default function ErrorDePantalla({
  error,
  reset,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    console.error('Error en una pantalla de Paseo:', error);
  }, [error]);

  return (
    <PantallaMensaje
      icono={
        <svg
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 3.8 21.2 20H2.8z" />
          <path d="M12 10v4" />
          <circle cx="12" cy="17.2" r="0.6" fill="currentColor" />
        </svg>
      }
      titulo="Se nos rompió algo"
      detalle="No pudimos mostrar esta pantalla. Probá de nuevo; si sigue pasando, cerrá la app y volvé a abrirla."
      accion={
        <div className="flex flex-col items-center gap-3">
          <button type="button" onClick={reset} className={claseBoton}>
            Reintentar
          </button>

          {error.digest === undefined ? null : (
            <p className="text-xs text-tinta-suave">
              Código del error: <span data-seleccionable>{error.digest}</span>
            </p>
          )}
        </div>
      }
    />
  );
}
