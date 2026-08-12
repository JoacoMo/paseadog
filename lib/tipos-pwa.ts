/**
 * Tipos del navegador que TypeScript todavía no trae en lib.dom.
 *
 * Sin esto habría que castear a `any` para leer `beforeinstallprompt` o
 * `navigator.standalone`, y no usamos `any` en este proyecto.
 */

export interface EventoInstalacion extends Event {
  /** Abre el diálogo nativo de instalación. Solo se puede llamar una vez. */
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{
    readonly outcome: 'accepted' | 'dismissed';
    readonly platform: string;
  }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: EventoInstalacion;
    appinstalled: Event;
    /** Evento propio: lo dispara el script del layout cuando guarda el evento. */
    'paseo:instalable': Event;
  }

  interface Window {
    /**
     * `beforeinstallprompt` se dispara muy temprano, muchas veces antes de que
     * React hidrate. El script inline del layout lo intercepta y lo deja acá
     * para que <PromptInstalacion /> lo encuentre cuando monta.
     */
    __paseoEventoInstalacion?: EventoInstalacion;
  }

  interface Navigator {
    /** Solo Safari en iOS: true cuando la app corre desde la pantalla de inicio. */
    readonly standalone?: boolean;
  }
}
