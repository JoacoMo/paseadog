import { URL_SUPABASE } from './supabase/entorno';

/**
 * Content-Security-Policy con nonce por request.
 *
 * Es lo que quedó pendiente en la Etapa 0: una CSP que sirva necesita un nonce
 * distinto en cada request, y para generarlo hace falta middleware. Ahora que el
 * middleware existe por la sesión, la CSP entra acá.
 *
 * Cómo funciona: el middleware genera un nonce, lo pone en la CSP y además en un
 * encabezado del request. Next detecta el nonce en la CSP y se lo pone solo a
 * los scripts que genera; el script inline del layout lo lee de `x-nonce`.
 *
 * `strict-dynamic` hace que, con el nonce puesto, la lista blanca de dominios se
 * ignore y solo corra lo que cargó un script ya confiable. Es la forma
 * recomendada: no depende de mantener una lista de dominios al día.
 *
 * `style-src` sí lleva 'unsafe-inline'. Next inyecta estilos críticos en línea y
 * no hay forma de nonce-arlos de manera confiable. Es mucho menos grave que en
 * scripts: con estilos no se ejecuta código.
 */

const ORIGEN_SUPABASE = new URL(URL_SUPABASE).origin;
const ORIGEN_SUPABASE_WS = ORIGEN_SUPABASE.replace(/^https:/, 'wss:');

export function generarNonce(): string {
  // Web Crypto y no node:crypto: el middleware corre en el runtime Edge.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

export function armarCsp(nonce: string, esDesarrollo: boolean): string {
  const directivas = [
    `default-src 'self'`,
    // 'unsafe-eval' solo en desarrollo: lo necesita el refresco en caliente.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${esDesarrollo ? "'unsafe-eval'" : ''}`,
    `style-src 'self' 'unsafe-inline'`,
    // blob: y data: para las fotos de perros antes de subirlas (vista previa).
    `img-src 'self' blob: data: ${ORIGEN_SUPABASE}`,
    `font-src 'self'`,
    // wss: para Realtime, que llega en una etapa próxima.
    `connect-src 'self' ${ORIGEN_SUPABASE} ${ORIGEN_SUPABASE_WS}`,
    `worker-src 'self'`,
    `manifest-src 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ];

  return directivas
    .join('; ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
