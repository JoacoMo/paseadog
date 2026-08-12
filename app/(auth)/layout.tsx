import type { ReactNode } from 'react';

/**
 * Layout de login y registro: sin barra de navegación, porque todavía no hay
 * a dónde navegar. El logo arriba y el formulario centrado.
 */
export default function LayoutAuth({ children }: { readonly children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 pt-[calc(2rem_+_env(safe-area-inset-top))] pb-[calc(2rem_+_env(safe-area-inset-bottom))]">
      <div className="mb-8 flex flex-col items-center text-center">
        <svg
          width="52"
          height="52"
          viewBox="0 0 24 24"
          aria-hidden
          className="text-verde"
          fill="currentColor"
        >
          <ellipse cx="12" cy="16.2" rx="4.1" ry="3.5" />
          <ellipse cx="4.9" cy="10.6" rx="2.4" ry="2.9" />
          <ellipse cx="9.6" cy="6.6" rx="2.4" ry="3.1" />
          <ellipse cx="14.4" cy="6.6" rx="2.4" ry="3.1" />
          <ellipse cx="19.1" cy="10.6" rx="2.4" ry="2.9" />
        </svg>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-tinta">Paseo</h1>
        <p className="mt-1 text-sm text-tinta-suave">Paseadores de perros en tu barrio</p>
      </div>

      {children}
    </div>
  );
}
