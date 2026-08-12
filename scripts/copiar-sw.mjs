/**
 * Copia lib/service-worker.js a public/sw.js.
 *
 * Next solo sirve archivos estáticos desde public/, y un service worker no puede
 * controlar rutas que estén por encima de la suya. Por eso el fuente vive en
 * lib/ (donde lo editás) y la copia servida vive en la raíz del sitio.
 *
 * Corre solo con `npm run dev` y `npm run build` (scripts predev y prebuild).
 *
 * Uso: node scripts/copiar-sw.mjs [--desarrollo]
 */

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const origen = join(raiz, 'lib', 'service-worker.js');
const destino = join(raiz, 'public', 'sw.js');

const esDesarrollo = process.argv.includes('--desarrollo');

const fuente = readFileSync(origen, 'utf8');

/**
 * El nombre del cache decide cuándo se tira lo viejo.
 * - En producción: hash del contenido. Si el service worker no cambió, el cache
 *   sobrevive al deploy y el usuario no vuelve a descargar todo.
 * - En desarrollo: la hora de arranque. Cada `npm run dev` empieza limpio, así
 *   no perseguís bugs causados por un cache de hace tres cambios.
 */
const version = esDesarrollo
  ? `dev-${Date.now()}`
  : createHash('sha256').update(fuente).digest('hex').slice(0, 12);

const salida =
  `// GENERADO AUTOMÁTICAMENTE por scripts/copiar-sw.mjs — no edites este archivo.\n` +
  `// Editá lib/service-worker.js y volvé a correr \`npm run dev\` o \`npm run build\`.\n\n` +
  fuente.replace('__VERSION_CACHE__', `paseo-${version}`).replace('__MODO__', esDesarrollo ? 'desarrollo' : 'produccion');

if (salida.includes('__VERSION_CACHE__') || salida.includes('__MODO__')) {
  console.error(
    'Error: quedaron marcadores sin reemplazar en el service worker. Revisá lib/service-worker.js.',
  );
  process.exit(1);
}

mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, salida, 'utf8');

console.log(`sw: public/sw.js actualizado (cache paseo-${version}, modo ${esDesarrollo ? 'desarrollo' : 'produccion'})`);
