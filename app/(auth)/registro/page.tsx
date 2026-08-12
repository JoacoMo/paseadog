import type { Metadata } from 'next';

import { FormularioRegistro } from '@/components/formulario-registro';

export const metadata: Metadata = {
  title: 'Crear cuenta',
};

export default function PaginaRegistro() {
  return (
    <>
      <h2 className="mb-5 text-lg font-semibold text-tinta">Creá tu cuenta</h2>
      <FormularioRegistro />
    </>
  );
}
