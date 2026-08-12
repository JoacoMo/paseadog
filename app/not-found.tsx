import type { Metadata } from 'next';
import Link from 'next/link';

import { claseBoton, PantallaMensaje } from '@/components/pantalla-mensaje';

export const metadata: Metadata = {
  title: 'Pantalla no encontrada',
};

/**
 * Sin este archivo, Next muestra su 404 propio: fondo blanco y "This page could
 * not be found", en inglés y sin la barra de navegación.
 */
export default function NoEncontrada() {
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
          <circle cx="11" cy="11" r="7" />
          <path d="m16.5 16.5 4 4" />
          <path d="M11 8v3.5" />
          <circle cx="11" cy="14.4" r="0.6" fill="currentColor" />
        </svg>
      }
      titulo="No encontramos esta pantalla"
      detalle="El link puede estar mal escrito o apuntar a algo que ya no existe. Volvé al inicio y buscá desde ahí."
      accion={
        <Link href="/" className={claseBoton}>
          Volver al inicio
        </Link>
      }
    />
  );
}
