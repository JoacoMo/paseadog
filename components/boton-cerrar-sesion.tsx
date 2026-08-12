import { cerrarSesion } from '@/lib/acciones/autenticacion';

/**
 * Cerrar sesión con un <form> y un Server Action, no con un onClick.
 *
 * Así funciona aunque el JavaScript todavía no haya hidratado o haya fallado —
 * que en un teléfono con mala señal pasa — y de paso no hace falta que este
 * componente sea de cliente.
 */
export function BotonCerrarSesion() {
  return (
    <form action={cerrarSesion}>
      <button
        type="submit"
        className="w-full rounded-xl border border-borde px-4 py-3.5 text-sm font-semibold text-error active:bg-error/5"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
