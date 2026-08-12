import type { ReactNode } from 'react';

/**
 * Pantalla centrada de un solo mensaje: sin conexión, no encontrada, error.
 *
 * No lleva 'use client' a propósito: no tiene interactividad, así que sirve
 * tanto desde un componente de servidor (offline, not-found) como desde uno de
 * cliente (error.tsx, que sí tiene que serlo por el botón de reintentar).
 *
 * El alto descuenta `--alto-reservado`, que vale distinto según dónde se use:
 * en las pantallas con barra de navegación incluye el alto de la barra, y en
 * las de login solo el área segura del teléfono. Sin ese descuento el contenido
 * queda apenas más abajo del centro y la pantalla scrollea unos píxeles.
 */
export function PantallaMensaje({
  icono,
  titulo,
  detalle,
  accion,
}: {
  readonly icono: ReactNode;
  readonly titulo: string;
  readonly detalle: string;
  readonly accion?: ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100dvh_-_var(--alto-reservado))] flex-col items-center justify-center px-8 text-center">
      <div className="text-verde">{icono}</div>

      <h1 className="mt-5 text-xl font-semibold text-tinta">{titulo}</h1>
      <p className="mt-2 text-sm text-tinta-suave">{detalle}</p>

      {accion === undefined ? null : <div className="mt-6">{accion}</div>}
    </div>
  );
}

/** Mismo botón para las tres pantallas, así no se van despegando con el tiempo. */
export const claseBoton =
  'inline-block rounded-xl bg-verde px-5 py-3 text-sm font-semibold text-white active:bg-verde-oscuro';
