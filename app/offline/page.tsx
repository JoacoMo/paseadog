import type { Metadata } from 'next';
import Link from 'next/link';

import { claseBoton, PantallaMensaje } from '@/components/pantalla-mensaje';

export const metadata: Metadata = {
  title: 'Sin conexión',
};

/**
 * Esta pantalla la sirve el service worker desde el cache cuando una navegación
 * falla por falta de red. Tiene que renderizarse sin datos y sin JavaScript:
 * si dependiera de algo del servidor, no habría nada que mostrar justo cuando
 * hace falta.
 */
export default function PaginaOffline() {
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
          <path d="M2 3.5 21.5 21" />
          <path d="M5 12.5a10 10 0 0 1 3.5-2.2M2.5 8.5a15 15 0 0 1 4-2.4M17.5 9.6a10 10 0 0 1 1.5.9M13 5.6a15 15 0 0 1 8.5 2.9" />
          <path d="M8.5 16a5 5 0 0 1 5.2-1" />
          <circle cx="12" cy="19.5" r="0.6" fill="currentColor" />
        </svg>
      }
      titulo="Estás sin conexión"
      detalle="No pudimos cargar esta pantalla porque el teléfono no tiene internet. Fijate el wifi o los datos móviles y volvé a intentar."
      accion={
        <Link href="/" className={claseBoton}>
          Volver al inicio
        </Link>
      }
    />
  );
}
