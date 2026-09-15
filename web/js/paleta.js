// Paleta: LUT RGBA + efectos (pon_paleta/Setpal/rotar/to_white/to_black/to_gray de FX.CC)
import { E } from './estado.js';

export let lut32; // Uint32Array(256) RGBA little-endian

export function initPalette() {
  lut32 = new Uint32Array(256);
  applyPalette();
}

// Setpal(i,r,g,b): escribe el color i en la paleta "hardware" (v6 -> v8)
export function setLutColor(i, r, g, b) {
  lut32[i] = 0xff000000 | (c6to8(b) << 16) | (c6to8(g) << 8) | c6to8(r);
}

export function c6to8(v) { return (v << 2) | (v >> 4); }

// pon_paleta(): aplica la paleta deseada (E.paleta) al hardware
export function applyPalette() {
  const p = E.paleta;
  for (let i = 0; i < 256; i++) setLutColor(i, p[i * 3], p[i * 3 + 1], p[i * 3 + 2]);
}

// to_white(): memset paleta=63
export function paletteToWhite() { E.paleta.fill(63); }

// to_black(): memset paleta=0
export function paletteToBlack() { E.paleta.fill(0); }

// to_gray(): gris = (4r+10g+2b)>>4
export function paletteToGray() {
  const p = E.paleta;
  for (let i = 0; i < 256; i++) {
    const g = (4 * p[i * 3] + 10 * p[i * 3 + 1] + 2 * p[i * 3 + 2]) >> 4;
    p[i * 3] = p[i * 3 + 1] = p[i * 3 + 2] = g;
  }
}

// Restaura la paleta desde la copia de seguridad (movedata paleta_back -> paleta)
export function restorePalette() {
  E.paleta.set(E.paletaBack);
  applyPalette();
}

// rotar(): animación de los colores de agua/luces cada tick (FX.CC / JUEGO.CC:199)
export function rotatePalette() {
  const rota = E.rota;
  setLutColor(118, rota << 1, 0, 0);
  setLutColor(246, (63 - (rota << 1)) >> 1, 0, 0);
  setLutColor(124, 63 - (rota << 1), 0, 0);
  setLutColor(252, (63 - (rota << 1)) >> 1, 0, 0);
  setLutColor(121, 0, 63 - (rota << 1), 0);
  setLutColor(249, 0, (63 - (rota << 1)) >> 1, 0);
  setLutColor(122, 0, rota << 1, 0);
  setLutColor(250, 0, ((48 - (rota << 1)) >> 1) & 63, 0);
  setLutColor(123, 0, 32 - (rota << 1), 0);
  setLutColor(251, 0, ((32 - (rota << 1)) >> 1) & 63, 0);

  if (E.rota_s === 0) { E.rota++; if (E.rota === 30) E.rota_s = 1; }
  else { E.rota--; if (E.rota === 0) E.rota_s = 0; }
}

// Flash blanco de rompe_pot: to_white + pon_paleta, y a los 20 ms (delay del C)
// se restaura paleta_back. Con setTimeout para que el flash sea visible entre presents.
let flashTimer = null;
export function whiteFlash() {
  for (let i = 0; i < 256; i++) setLutColor(i, 63, 63, 63);
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { flashTimer = null; restorePalette(); }, 20);
}
