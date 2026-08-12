'use client';

import { useCallback, useEffect, useState } from 'react';

import type { EventoInstalacion } from '@/lib/tipos-pwa';

const CLAVE_DESCARTADO = 'paseo:instalacion-descartada';

/**
 * 'evaluando' es el estado inicial y no dibuja nada: la detección depende de
 * APIs del navegador, así que en el servidor no sabemos qué mostrar y arrancar
 * con algo visible causaría un parpadeo en la hidratación.
 */
type Estado = 'evaluando' | 'oculto' | 'android' | 'ios';

function estaInstalada(): boolean {
  const enStandalone = window.matchMedia('(display-mode: standalone)').matches;
  // Safari en iOS todavía no reporta display-mode, usa su propiedad vieja.
  const enStandaloneIOS = navigator.standalone === true;
  return enStandalone || enStandaloneIOS;
}

function esIOS(): boolean {
  const agente = navigator.userAgent;
  const esIPhone = /iPhone|iPod/.test(agente);
  // Desde iPadOS 13 el iPad se presenta como Macintosh; lo que lo delata es que
  // tiene pantalla táctil.
  const esIPad = /iPad/.test(agente) || (/Macintosh/.test(agente) && navigator.maxTouchPoints > 1);
  return esIPhone || esIPad;
}

function fueDescartado(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_DESCARTADO) === 'si';
  } catch {
    // Safari en modo privado tira excepción al tocar localStorage.
    return false;
  }
}

function recordarDescarte(): void {
  try {
    window.localStorage.setItem(CLAVE_DESCARTADO, 'si');
  } catch {
    // Si no se puede guardar, el aviso vuelve a aparecer. No es grave.
  }
}

export function PromptInstalacion() {
  const [estado, setEstado] = useState<Estado>('evaluando');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (estaInstalada() || fueDescartado()) {
      setEstado('oculto');
      return;
    }

    if (esIOS()) {
      setEstado('ios');
      return;
    }

    // Android / escritorio: solo mostramos el aviso si el navegador ya nos dijo
    // que la app es instalable. Si nunca dispara beforeinstallprompt, no hay
    // nada que ofrecer y el aviso no aparece.
    if (window.__paseoEventoInstalacion) {
      setEstado('android');
    }

    const alSerInstalable = () => setEstado('android');
    const alInstalarse = () => {
      window.__paseoEventoInstalacion = undefined;
      setEstado('oculto');
    };

    window.addEventListener('paseo:instalable', alSerInstalable);
    window.addEventListener('appinstalled', alInstalarse);

    return () => {
      window.removeEventListener('paseo:instalable', alSerInstalable);
      window.removeEventListener('appinstalled', alInstalarse);
    };
  }, []);

  const instalar = useCallback(async () => {
    const evento: EventoInstalacion | undefined = window.__paseoEventoInstalacion;

    if (!evento) {
      setError(
        'No se pudo abrir el instalador. Abrí el menú de tu navegador (⋮) y elegí «Instalar app».',
      );
      return;
    }

    try {
      await evento.prompt();
      const { outcome } = await evento.userChoice;

      // El evento se consume con un solo prompt(): el navegador dispara uno nuevo
      // más adelante si corresponde.
      window.__paseoEventoInstalacion = undefined;

      if (outcome === 'accepted') {
        setEstado('oculto');
      } else {
        recordarDescarte();
        setEstado('oculto');
      }
    } catch {
      setError(
        'No se pudo abrir el instalador. Abrí el menú de tu navegador (⋮) y elegí «Instalar app».',
      );
    }
  }, []);

  const descartar = useCallback(() => {
    recordarDescarte();
    setEstado('oculto');
  }, []);

  if (estado === 'evaluando' || estado === 'oculto') return null;

  return (
    <aside className="rounded-2xl border border-borde bg-verde-suave p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-tinta">Instalá Paseo en tu teléfono</h2>
          <p className="mt-1 text-sm text-tinta-suave">
            {estado === 'ios'
              ? 'Se abre a pantalla completa y la tenés a mano cuando querés sacar a pasear al perro.'
              : 'Ocupa poco, se abre a pantalla completa y funciona aunque tengas mala señal.'}
          </p>
        </div>

        <button
          type="button"
          onClick={descartar}
          aria-label="Cerrar el aviso de instalación"
          className="-m-2 shrink-0 rounded-full p-2 text-tinta-suave"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      {estado === 'ios' ? (
        <ol className="mt-3 space-y-2 text-sm text-tinta">
          <li className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-verde">
              1
            </span>
            <span>
              Tocá{' '}
              <span className="inline-flex items-center gap-1 font-semibold">
                Compartir
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M12 15V3m0 0L8.5 6.5M12 3l3.5 3.5" />
                  <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
                </svg>
              </span>{' '}
              abajo en la barra de Safari.
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-verde">
              2
            </span>
            <span>
              Bajá y elegí <span className="font-semibold">Agregar a pantalla de inicio</span>.
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-verde">
              3
            </span>
            <span>
              Confirmá con <span className="font-semibold">Agregar</span>.
            </span>
          </li>
        </ol>
      ) : (
        <>
          <button
            type="button"
            onClick={() => void instalar()}
            className="mt-3 w-full rounded-xl bg-verde px-4 py-3 text-sm font-semibold text-white active:bg-verde-oscuro"
          >
            Instalar Paseo
          </button>

          {error === null ? null : (
            <p role="alert" className="mt-2 text-sm text-tinta">
              {error}
            </p>
          )}
        </>
      )}
    </aside>
  );
}
