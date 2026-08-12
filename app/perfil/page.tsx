import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Perfil',
};

export default function PaginaPerfil() {
  return (
    <div className="px-4 pt-[calc(1.5rem_+_env(safe-area-inset-top))] pb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-tinta">Perfil</h1>
      <p className="mt-2 text-sm text-tinta-suave">
        Acá van a estar tus datos, tu zona y la opción de ofrecerte como paseador.
      </p>
    </div>
  );
}
