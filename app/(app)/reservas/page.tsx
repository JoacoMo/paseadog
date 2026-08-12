import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reservas',
};

export default function PaginaReservas() {
  return (
    <div className="px-4 pt-[calc(1.5rem_+_env(safe-area-inset-top))] pb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-tinta">Reservas</h1>
      <p className="mt-2 text-sm text-tinta-suave">
        Acá vas a ver los paseos que reservaste, el estado de cada uno y el reporte que deja el
        paseador cuando vuelve.
      </p>
    </div>
  );
}
