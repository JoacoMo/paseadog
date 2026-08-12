import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { NavegacionInferior } from '@/components/navegacion-inferior';
import { RegistroServiceWorker } from '@/components/registro-service-worker';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Paseo — paseadores de perros en tu barrio',
    template: '%s · Paseo',
  },
  description:
    'Encontrá paseadores de perros cerca tuyo, reservá un paseo y enterate cómo le fue a tu perro.',
  applicationName: 'Paseo',
  appleWebApp: {
    capable: true,
    title: 'Paseo',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/iconos/icono-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/iconos/icono-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/iconos/apple-touch-icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
  formatDetection: {
    // Sin esto, iOS convierte cualquier número (kg del perro, precios) en un link de teléfono.
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#1f7a4d',
  width: 'device-width',
  initialScale: 1,
  // `cover` hace que el contenido llegue hasta abajo del todo en teléfonos con
  // notch. Es lo que habilita que env(safe-area-inset-*) tenga valores reales.
  viewportFit: 'cover',
};

/**
 * `beforeinstallprompt` se dispara antes de que React hidrate. Este script corre
 * mientras el navegador parsea el HTML y guarda el evento para el prompt.
 */
const guionCapturaInstalacion = `
(function () {
  window.addEventListener('beforeinstallprompt', function (evento) {
    evento.preventDefault();
    window.__paseoEventoInstalacion = evento;
    window.dispatchEvent(new Event('paseo:instalable'));
  });
})();
`;

export default function LayoutRaiz({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="es-AR">
      <head>
        <script dangerouslySetInnerHTML={{ __html: guionCapturaInstalacion }} />
      </head>
      <body className="antialiased">
        <div className="mx-auto flex min-h-dvh w-full max-w-screen-sm flex-col">
          {/* El padding de abajo reserva el alto de la barra + el área segura del
              teléfono, para que el último elemento de cada pantalla no quede tapado. */}
          <main className="flex-1 pb-[calc(var(--spacing-barra)_+_env(safe-area-inset-bottom))]">
            {children}
          </main>
        </div>

        <NavegacionInferior />
        <RegistroServiceWorker />
      </body>
    </html>
  );
}
