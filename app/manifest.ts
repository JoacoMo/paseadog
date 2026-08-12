import type { MetadataRoute } from 'next';

/**
 * Next sirve esto en /manifest.webmanifest e inyecta el <link rel="manifest">
 * en todas las páginas. No hay que agregarlo a mano en el layout.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Paseo',
    short_name: 'Paseo',
    description: 'Encontrá paseadores de perros en tu barrio.',
    lang: 'es-AR',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#1f7a4d',
    background_color: '#ffffff',
    categories: ['lifestyle', 'social'],
    icons: [
      {
        src: '/iconos/icono-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/iconos/icono-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        // El maskable va a pantalla completa sin bordes transparentes: Android
        // le aplica la máscara del sistema (círculo, squircle, etc).
        src: '/iconos/icono-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
