// Fuentes — pontextXY/pontext_M/poneletra_BIG de SVGA.CC
import { MAX_X } from './ctes.js';
import { E } from './estado.js';

const byte = [128, 64, 32, 16, 8, 4, 2, 1]; // MSB-first (JUEGO.CC:145)

// pontextXY: MINI 8x8, 1bpp, color fijo 15, avance 5 px.
// El C dibuja strlen+1 glifos (bug) — replicado.
export function drawTextMini(X, Y, texto, dst) {
  for (let lon = 0; lon <= texto.length; lon++) {
    const c = texto.charCodeAt(lon) << 3;
    for (let j = 0; j < 8; j++)
      for (let i = 0; i < 8; i++)
        if ((E.miniFNT[c + i] & byte[j]) !== 0)
          dst[(Y + i) * MAX_X + (X + j)] = 15;
    X += 5;
  }
}

// --- Helpers de legibilidad para pantallas pequeñas ---

// MINI 8x8 escalado con color a elegir (drawTextMini fija el 15)
export function miniEscala(X, Y, texto, dst, escala, color) {
  for (let lon = 0; lon < texto.length; lon++) {
    const c = texto.charCodeAt(lon) << 3;
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 8; j++)
        if ((E.miniFNT[c + i] & byte[j]) !== 0)
          for (let yy = 0; yy < escala; yy++)
            for (let xx = 0; xx < escala; xx++)
              dst[(Y + i * escala + yy) * MAX_X + (X + j * escala + xx)] = color;
    X += 5 * escala;
  }
}

// Rectángulo relleno (caja de contraste para textos)
export function caja(X, Y, w, h, dst, color) {
  for (let yy = Y; yy < Y + h; yy++)
    for (let xx = X; xx < X + w; xx++)
      dst[yy * MAX_X + xx] = color;
}

// Índices de paleta más oscuro/claro: garantizan contraste con CUALQUIER
// paleta (el 0 y el 15 no siempre son negro y blanco)
export function lumPaleta() {
  let oscuro = 0, claro = 0, lOsc = 1e9, lCla = -1;
  for (let i = 0; i < 256; i++) {
    const l = E.paleta[i * 3] * 0.299 + E.paleta[i * 3 + 1] * 0.587 + E.paleta[i * 3 + 2] * 0.114;
    if (l < lOsc) { lOsc = l; oscuro = i; }
    if (l > lCla) { lCla = l; claro = i; }
  }
  return [oscuro, claro];
}

// pontext_M: MIDLE 9x11 con índice de paleta por píxel (0=transparente),
// avance proporcional (última columna con tinta + 2)
export function drawTextMidle(X, Y, texto, dst) {
  // El C dibuja strlen+1 glifos: el extra es el NUL. En el original indexaba
  // memoria basura (invisible); aquí muestra el glifo 0 de MIDLE, la '!'.
  // A Borja le gusta más con la '!' — se queda.
  // El C leía basura también en los espacios (32<33 -> offset -1); aquí el
  // espacio avanza sin dibujar (el MENU usa MIDLE con frases).
  for (let lon = 0; lon <= texto.length; lon++) {
    const ch = texto.charCodeAt(lon);
    if (ch === 32) { X += 5; continue; }
    const off = (ch >= 33 ? ch - 33 : 0) * 99;
    let ltr = 0, pixel = 0;
    for (let j = 0; j < 11; j++)
      for (let i = 0; i < 9; i++) {
        const v = E.midleFNT[off + pixel];
        if (v !== 0) { dst[(Y + j) * MAX_X + (X + i)] = v; ltr = i; }
        pixel++;
      }
    X += ltr + 2;
  }
}

// poneletra_BIG: BIG 52x55, 1bpp bit-contiguo (offset en bits, no alineado a byte).
// Espacio = 10 px; avance = última columna con tinta (como el C).
export function drawTextBig(Coorx, Coory, ascii, dst, color) {
  let xreal = 0;
  for (let lon = 0; lon < ascii.length; lon++) {
    if (ascii.charCodeAt(lon) === 32) { xreal += 10; continue; }
    const glifo = ascii.charCodeAt(lon) - 33;
    let pixel = 0, xmayor = 0;
    for (let y = 0; y < 55; y++)
      for (let x = 0; x < 52; x++) {
        const pos = glifo * 2860 + pixel;
        if ((E.bigFNT[pos >> 3] & byte[pos & 7]) !== 0) {
          dst[(Coory + y) * MAX_X + (x + xreal + Coorx)] = color;
          if (x > xmayor) xmayor = x;
        }
        pixel++;
      }
    xreal += xmayor;
  }
}

// Ancho exacto que ocupará drawTextBig (mismo avance proporcional) para centrar
export function medirTextBig(texto) {
  let xreal = 0;
  for (let lon = 0; lon < texto.length; lon++) {
    if (texto.charCodeAt(lon) === 32) { xreal += 10; continue; }
    const glifo = texto.charCodeAt(lon) - 33;
    let pixel = 0, xmayor = 0;
    for (let y = 0; y < 55; y++)
      for (let x = 0; x < 52; x++) {
        const pos = glifo * 2860 + pixel;
        if ((E.bigFNT[pos >> 3] & byte[pos & 7]) !== 0 && x > xmayor) xmayor = x;
        pixel++;
      }
    xreal += xmayor;
  }
  return xreal;
}

