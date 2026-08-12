/**
 * Genera los íconos PNG de la PWA sin depender de ninguna librería.
 *
 * Codifica los PNG a mano (Node ya trae zlib) para que el repo no arrastre una
 * dependencia de imágenes solo para esto. Los archivos generados se commitean;
 * este script se corre a mano cuando cambia el diseño del ícono:
 *
 *   npm run iconos
 *
 * Dibuja una huella blanca sobre fondo verde (#1f7a4d).
 */

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const carpetaIconos = join(raiz, 'public', 'iconos');

const VERDE = [31, 122, 77];
const BLANCO = [255, 255, 255];

// ---------------------------------------------------------------- PNG a mano

const tablaCrc = (() => {
  const tabla = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabla[n] = c >>> 0;
  }
  return tabla;
})();

function crc32(datos) {
  let c = 0xffffffff;
  for (let i = 0; i < datos.length; i += 1) c = tablaCrc[(c ^ datos[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function trozo(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length, 0);

  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo), 0);

  return Buffer.concat([largo, cuerpo, crc]);
}

function codificarPng(tamano, dibujar) {
  // Cada fila lleva adelante un byte de filtro (0 = sin filtro).
  const crudo = Buffer.alloc(tamano * (tamano * 4 + 1));
  let i = 0;

  for (let y = 0; y < tamano; y += 1) {
    crudo[i] = 0;
    i += 1;
    for (let x = 0; x < tamano; x += 1) {
      const [r, g, b, a] = dibujar(x, y);
      crudo[i] = r;
      crudo[i + 1] = g;
      crudo[i + 2] = b;
      crudo[i + 3] = a;
      i += 4;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tamano, 0);
  ihdr.writeUInt32BE(tamano, 4);
  ihdr[8] = 8; // 8 bits por canal
  ihdr[9] = 6; // color RGBA
  ihdr[10] = 0; // compresión deflate
  ihdr[11] = 0; // filtro estándar
  ihdr[12] = 0; // sin entrelazado

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo('IHDR', ihdr),
    trozo('IDAT', deflateSync(crudo, { level: 9 })),
    trozo('IEND', Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------------- Dibujo

/** Coordenadas normalizadas 0..1 dentro del cuadrado. */
function dentroDelFondo(u, v, radio) {
  if (radio <= 0) return true;
  const dx = Math.max(radio - u, 0, u - (1 - radio));
  const dy = Math.max(radio - v, 0, v - (1 - radio));
  return Math.hypot(dx, dy) <= radio;
}

const DEDOS = [
  [0.245, 0.385, 0.082],
  [0.4, 0.285, 0.088],
  [0.6, 0.285, 0.088],
  [0.755, 0.385, 0.082],
];

function dentroDeLaHuella(u, v) {
  const almohadilla = ((u - 0.5) / 0.202) ** 2 + ((v - 0.635) / 0.166) ** 2 <= 1;
  if (almohadilla) return true;

  return DEDOS.some(([cx, cy, r]) => Math.hypot(u - cx, v - cy) <= r);
}

/** Suaviza los bordes muestreando 4x4 puntos por píxel. */
const MUESTRAS = 4;

function crearDibujante({ tamano, radio, escala }) {
  return (px, py) => {
    let fondo = 0;
    let huella = 0;

    for (let sy = 0; sy < MUESTRAS; sy += 1) {
      for (let sx = 0; sx < MUESTRAS; sx += 1) {
        const u = (px + (sx + 0.5) / MUESTRAS) / tamano;
        const v = (py + (sy + 0.5) / MUESTRAS) / tamano;

        if (dentroDelFondo(u, v, radio)) fondo += 1;
        if (dentroDeLaHuella((u - 0.5) / escala + 0.5, (v - 0.5) / escala + 0.5)) huella += 1;
      }
    }

    const total = MUESTRAS * MUESTRAS;
    const alfaFondo = fondo / total;
    if (alfaFondo === 0) return [0, 0, 0, 0];

    // La huella nunca se dibuja fuera del fondo.
    const alfaHuella = Math.min(huella / total, alfaFondo);
    const mezcla = alfaHuella / alfaFondo;

    return [
      Math.round(VERDE[0] * (1 - mezcla) + BLANCO[0] * mezcla),
      Math.round(VERDE[1] * (1 - mezcla) + BLANCO[1] * mezcla),
      Math.round(VERDE[2] * (1 - mezcla) + BLANCO[2] * mezcla),
      Math.round(alfaFondo * 255),
    ];
  };
}

function generarPng({ tamano, radio, escala }) {
  return codificarPng(tamano, crearDibujante({ tamano, radio, escala }));
}

/** Un .ico moderno es un encabezado corto seguido de un PNG tal cual. */
function envolverEnIco(png, tamano) {
  const encabezado = Buffer.alloc(22);
  encabezado.writeUInt16LE(0, 0); // reservado
  encabezado.writeUInt16LE(1, 2); // tipo: ícono
  encabezado.writeUInt16LE(1, 4); // cantidad de imágenes
  encabezado.writeUInt8(tamano === 256 ? 0 : tamano, 6);
  encabezado.writeUInt8(tamano === 256 ? 0 : tamano, 7);
  encabezado.writeUInt8(0, 8); // paleta
  encabezado.writeUInt8(0, 9); // reservado
  encabezado.writeUInt16LE(1, 10); // planos
  encabezado.writeUInt16LE(32, 12); // bits por píxel
  encabezado.writeUInt32LE(png.length, 14);
  encabezado.writeUInt32LE(22, 18); // dónde empieza la imagen

  return Buffer.concat([encabezado, png]);
}

// ------------------------------------------------------------------ Salidas

mkdirSync(carpetaIconos, { recursive: true });

const archivos = [
  // Íconos comunes: esquinas redondeadas propias y algo de aire alrededor.
  { nombre: 'icono-192.png', tamano: 192, radio: 0.22, escala: 0.78 },
  { nombre: 'icono-512.png', tamano: 512, radio: 0.22, escala: 0.78 },
  // Maskable: fondo a sangre y contenido dentro del 80% central, porque Android
  // recorta el ícono con la forma que tenga configurada el usuario.
  { nombre: 'icono-maskable-512.png', tamano: 512, radio: 0, escala: 0.6 },
  // iOS ignora la transparencia y aplica su propia máscara: cuadrado lleno.
  { nombre: 'apple-touch-icon-180.png', tamano: 180, radio: 0, escala: 0.72 },
];

for (const { nombre, tamano, radio, escala } of archivos) {
  const png = generarPng({ tamano, radio, escala });
  writeFileSync(join(carpetaIconos, nombre), png);
  console.log(`iconos: public/iconos/${nombre} (${png.length} bytes)`);
}

const favicon = generarPng({ tamano: 64, radio: 0.22, escala: 0.8 });
writeFileSync(join(raiz, 'public', 'favicon.ico'), envolverEnIco(favicon, 64));
console.log('iconos: public/favicon.ico');
