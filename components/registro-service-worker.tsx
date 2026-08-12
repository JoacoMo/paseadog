'use client';

import { useEffect } from 'react';

/**
 * Registra /sw.js. No dibuja nada.
 *
 * Se registra también en desarrollo a propósito: probar la instalación y el modo
 * offline en el teléfono es justamente lo que queremos poder hacer con
 * `next dev --experimental-https`. El service worker sabe distinguir el modo y
 * en desarrollo no cachea los assets de Next, así no te sirve código viejo.
 */
export function RegistroServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const control = new AbortController();

    const registrar = async () => {
      try {
        const registro = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        if (control.signal.aborted) return;

        // Si el usuario deja la PWA abierta días, esto busca una versión nueva
        // cada vez que vuelve a la app en lugar de esperar al próximo arranque.
        //
        // El listener va atado al AbortController y no a un booleano: `register`
        // es asincrónico, así que con StrictMode (que monta, desmonta y vuelve a
        // montar) se acumulaba un listener por montaje y ninguno se sacaba nunca.
        document.addEventListener(
          'visibilitychange',
          () => {
            if (document.visibilityState === 'visible') {
              void registro.update();
            }
          },
          { signal: control.signal },
        );
      } catch (error) {
        console.error('No se pudo registrar el service worker:', error);
      }
    };

    void registrar();

    return () => {
      control.abort();
    };
  }, []);

  return null;
}
