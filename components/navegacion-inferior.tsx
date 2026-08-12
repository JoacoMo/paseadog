'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type ItemNavegacion = {
  readonly href: string;
  readonly etiqueta: string;
  readonly icono: ReactNode;
};

const propiedadesIcono = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

const IconoInicio = (
  <svg {...propiedadesIcono}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5.5 9.5V20a1 1 0 0 0 1 1H10v-5.5h4V21h3.5a1 1 0 0 0 1-1V9.5" />
  </svg>
);

const IconoPerros = (
  <svg {...propiedadesIcono}>
    <ellipse cx="12" cy="16.5" rx="3.4" ry="2.9" />
    <circle cx="5.8" cy="11.4" r="2" />
    <circle cx="10" cy="7.6" r="2" />
    <circle cx="14" cy="7.6" r="2" />
    <circle cx="18.2" cy="11.4" r="2" />
  </svg>
);

const IconoReservas = (
  <svg {...propiedadesIcono}>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M3 10h18M8 3v4M16 3v4" />
    <path d="M8.5 14.5h3" />
  </svg>
);

const IconoPerfil = (
  <svg {...propiedadesIcono}>
    <circle cx="12" cy="8.5" r="3.75" />
    <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
  </svg>
);

const items: readonly ItemNavegacion[] = [
  { href: '/', etiqueta: 'Inicio', icono: IconoInicio },
  { href: '/mis-perros', etiqueta: 'Mis perros', icono: IconoPerros },
  { href: '/reservas', etiqueta: 'Reservas', icono: IconoReservas },
  { href: '/perfil', etiqueta: 'Perfil', icono: IconoPerfil },
];

function estaActivo(rutaActual: string, href: string): boolean {
  if (href === '/') return rutaActual === '/';
  return rutaActual === href || rutaActual.startsWith(`${href}/`);
}

export function NavegacionInferior() {
  const rutaActual = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex h-[var(--spacing-barra)] w-full max-w-screen-sm items-stretch">
        {items.map((item) => {
          const activo = estaActivo(rutaActual, item.href);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={activo ? 'page' : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors ${
                  activo ? 'text-verde' : 'text-tinta-suave'
                }`}
              >
                {item.icono}
                <span>{item.etiqueta}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
