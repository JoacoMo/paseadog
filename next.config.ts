import type { NextConfig } from 'next';

const esProduccion = process.env.NODE_ENV === 'production';

/**
 * Encabezados de seguridad para toda la app.
 *
 * No hay Content-Security-Policy todavía: una CSP seria en App Router necesita
 * nonce por request, y eso se resuelve en el middleware. El middleware lo vamos
 * a crear en la etapa de autenticación (@supabase/ssr), así que la CSP entra ahí
 * y no antes, para no dejar una CSP con 'unsafe-inline' que no protege de nada.
 */
const encabezadosSeguridad = [
  // Evita que el navegador adivine el tipo de contenido (protege de XSS por MIME sniffing).
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Nadie puede meter la app dentro de un iframe (clickjacking).
  { key: 'X-Frame-Options', value: 'DENY' },
  // Al salir hacia otro dominio solo se manda el origen, nunca la ruta completa.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Solo la propia app puede pedir cámara y ubicación. El resto, apagado.
  // `browsing-topics` y no `interest-cohort`: FLoC se dio de baja en 2023 y
  // Chrome tira "Unrecognized feature" en la consola por cada pedido si se lo
  // sigue nombrando. Topics es lo que ocupó su lugar y sí se reconoce.
  {
    key: 'Permissions-Policy',
    value: [
      'camera=(self)',
      'geolocation=(self)',
      'microphone=()',
      'payment=(self)',
      'usb=()',
      'browsing-topics=()',
    ].join(', '),
  },
  // Aísla el contexto de navegación de otras ventanas que nos hayan abierto.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

// HSTS solo en producción: en desarrollo con --experimental-https el certificado
// es autofirmado y clavar HSTS en localhost te complica volver a http.
const encabezadosProduccion = esProduccion
  ? [
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
    ]
  : [];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/:ruta*',
        headers: [...encabezadosSeguridad, ...encabezadosProduccion],
      },
      {
        // El service worker nunca se cachea: si el navegador se queda con una
        // versión vieja, la app queda congelada para ese usuario hasta que
        // desinstale la PWA. Service-Worker-Allowed le permite tomar scope raíz.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          { key: 'Content-Type', value: 'text/javascript; charset=utf-8' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Content-Type', value: 'application/manifest+json; charset=utf-8' },
        ],
      },
    ];
  },
};

export default nextConfig;
