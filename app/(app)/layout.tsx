import type { ReactNode } from 'react';

import { NavegacionInferior } from '@/components/navegacion-inferior';

/**
 * Layout de las pantallas con sesión.
 *
 * Quién puede entrar acá lo decide el middleware, no este archivo: si no hay
 * sesión, la request ni llega. Igual, cada pantalla que lea datos vuelve a
 * pedir el usuario con getUser() — el middleware es una comodidad para
 * redirigir, no el control de acceso. El control de acceso es RLS.
 */
export default function LayoutApp({ children }: { readonly children: ReactNode }) {
  return (
    <>
      <div className="mx-auto flex min-h-dvh w-full max-w-screen-sm flex-col">
        {/* El padding de abajo reserva el alto de la barra + el área segura del
            teléfono, para que el último elemento de cada pantalla no quede tapado. */}
        <main className="con-barra-inferior flex-1 pb-[calc(var(--spacing-barra)_+_env(safe-area-inset-bottom))]">
          {children}
        </main>
      </div>

      <NavegacionInferior />
    </>
  );
}
