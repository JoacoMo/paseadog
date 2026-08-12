import type { Metadata } from 'next';

import { FormularioLogin } from '@/components/formulario-login';

export const metadata: Metadata = {
  title: 'Entrar',
};

/**
 * `volver` lo pone el middleware cuando te frena en una pantalla con sesión, para
 * devolverte ahí después de entrar. El Server Action lo valida antes de usarlo:
 * solo acepta rutas internas.
 */
export default async function PaginaLogin({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly volver?: string; readonly aviso?: string }>;
}) {
  const { volver, aviso } = await searchParams;

  return (
    <>
      <h2 className="mb-5 text-lg font-semibold text-tinta">Entrá a tu cuenta</h2>

      {aviso === 'confirmacion-fallida' ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-error/30 bg-error/5 px-3.5 py-3 text-sm text-tinta"
        >
          Ese link de confirmación no sirve más: o ya lo usaste, o pasaron más de 24 horas.
          Registrate de nuevo con el mismo email y te mandamos otro.
        </p>
      ) : null}

      <FormularioLogin volver={volver} />
    </>
  );
}
