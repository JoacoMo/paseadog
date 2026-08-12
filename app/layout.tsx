import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

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

export default async function LayoutRaiz({ children }: { readonly children: ReactNode }) {
  // El nonce lo genera el middleware, uno por request. Sin él, la CSP bloquea
  // el script de abajo. Los scripts que arma Next se lo ponen solos.
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html lang="es-AR">
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: guionCapturaInstalacion }} />
      </head>
      <body className="antialiased">
        {children}
        <RegistroServiceWorker />
      </body>
    </html>
  );
}
