'use client';

import './globals.css';

/**
 * Último recurso: se usa solo si revienta el layout raíz, y reemplaza todo el
 * documento. Por eso trae su propio <html> y <body> y no hereda nada de
 * app/layout.tsx — tampoco la barra de navegación, que en este estado no tiene
 * a dónde llevar.
 */
export default function ErrorGlobal({
  error,
  reset,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}) {
  return (
    <html lang="es-AR">
      <body className="antialiased">
        <div className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-verde"
            aria-hidden
          >
            <path d="M12 3.8 21.2 20H2.8z" />
            <path d="M12 10v4" />
            <circle cx="12" cy="17.2" r="0.6" fill="currentColor" />
          </svg>

          <h1 className="mt-5 text-xl font-semibold text-tinta">No pudimos abrir Paseo</h1>
          <p className="mt-2 text-sm text-tinta-suave">
            Hubo un error al arrancar la app. Probá de nuevo; si sigue pasando, cerrala del todo y
            volvé a abrirla.
          </p>

          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-xl bg-verde px-5 py-3 text-sm font-semibold text-white active:bg-verde-oscuro"
          >
            Reintentar
          </button>

          {error.digest === undefined ? null : (
            <p className="mt-3 text-xs text-tinta-suave">
              Código del error: <span data-seleccionable>{error.digest}</span>
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
