import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mis perros',
};

export default function PaginaMisPerros() {
  return (
    <div className="px-4 pt-[calc(1.5rem_+_env(safe-area-inset-top))] pb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-tinta">Mis perros</h1>
      <p className="mt-2 text-sm text-tinta-suave">
        Acá vas a cargar a tus perros: nombre, raza, peso, porte y qué cosas hay que tener en
        cuenta cuando salen a pasear.
      </p>
    </div>
  );
}
