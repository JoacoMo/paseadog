import { PromptInstalacion } from '@/components/prompt-instalacion';
import { obtenerPerfil } from '@/lib/supabase/server';

/** Primer nombre: "Joaquín Morales" → "Joaquín". Para saludar sin sonar formal. */
function primerNombre(nombre: string): string {
  return nombre.split(' ')[0] ?? nombre;
}

export default async function PaginaInicio() {
  const perfil = await obtenerPerfil();

  return (
    <div className="px-4 pt-[calc(1.5rem_+_env(safe-area-inset-top))] pb-6">
      <header>
        <p className="text-sm font-medium text-verde">Paseo</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-tinta">
          {perfil === null ? 'Paseadores cerca tuyo' : `Hola, ${primerNombre(perfil.nombre)}`}
        </h1>
        <p className="mt-2 text-sm text-tinta-suave">
          Todavía no hay paseadores para mostrarte. En la próxima etapa vas a poder cargar a tu
          perro y ver quién pasea en tu barrio.
        </p>
      </header>

      <div className="mt-6">
        <PromptInstalacion />
      </div>

      <section className="mt-6 rounded-2xl border border-dashed border-borde p-4">
        <h2 className="text-sm font-semibold text-tinta">Próximamente</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-tinta-suave">
          <li>Buscar paseadores por distancia desde tu casa</li>
          <li>Filtrar por porte del perro y experiencia del paseador</li>
          <li>Reservar un paseo y recibir el reporte al final</li>
        </ul>
      </section>
    </div>
  );
}
