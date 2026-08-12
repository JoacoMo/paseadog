import type { Metadata } from 'next';

import { BotonCerrarSesion } from '@/components/boton-cerrar-sesion';
import { obtenerPerfil, obtenerUsuario } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Perfil',
};

export default async function PaginaPerfil() {
  const [usuario, perfil] = await Promise.all([obtenerUsuario(), obtenerPerfil()]);

  return (
    <div className="px-4 pt-[calc(1.5rem_+_env(safe-area-inset-top))] pb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-tinta">Perfil</h1>

      <section className="mt-5 rounded-2xl border border-borde p-4">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-tinta-suave">Nombre</dt>
            <dd className="mt-0.5 font-medium text-tinta" data-seleccionable>
              {perfil?.nombre ?? 'Sin nombre'}
            </dd>
          </div>
          <div>
            <dt className="text-tinta-suave">Email</dt>
            <dd className="mt-0.5 font-medium text-tinta" data-seleccionable>
              {usuario?.email ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-tinta-suave">Barrio</dt>
            <dd className="mt-0.5 font-medium text-tinta">
              {perfil?.barrio ?? 'Todavía no lo cargaste'}
            </dd>
          </div>
        </dl>
      </section>

      <p className="mt-4 text-sm text-tinta-suave">
        En la próxima etapa vas a poder editar estos datos, cargar tu zona y ofrecerte como
        paseador.
      </p>

      <div className="mt-8">
        <BotonCerrarSesion />
      </div>
    </div>
  );
}
