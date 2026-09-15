// Primitivas de render — putico/putico_sombra/putico_CTRL/putico_escala/putimage_CTRL
// y volcado2SVGA (present) de SVGA.CC, sobre buffers de índices de paleta.
import { MAX_X, MAX_Y } from './ctes.js';
import { E } from './estado.js';
import { lut32 } from './paleta.js';
import { recolocarControles } from './entrada-tactil.js';

const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');
let imgData = ctx.createImageData(MAX_X, MAX_Y);
let buf32 = new Uint32Array(imgData.data.buffer);
let modoW = MAX_X, modoH = MAX_Y; // 640x400 en el juego, 640x480 en los menús (0x101)

// Franjas laterales del canvas en el modo juego: el canvas se ENSANCHA con
// dos bandas negras y el juego se pinta centrado. Los controles táctiles
// viven DENTRO de esas bandas (dentro del canvas): en móviles reales el
// compositor recorta lo que sale de la caja del canvas, así que esta es la
// única forma que funciona en TODOS los dispositivos sin depender de su
// geometría (viewport, insets, márgenes...). Solo en pantallas apaisadas.
const BAND = 100; // px de juego por banda
let conBanda = false;

// volcado2SVGA()/menu2SVGA(): índices de paleta -> RGBA -> canvas
export function present() {
  presentBuf(E.Pvirtual, MAX_X, MAX_Y);
}

export function presentBuf(buf, w, h) {
  // ¿modo juego con franjas? (solo 640x400 y pantalla apaisada)
  const quiero = (w === MAX_X && h === MAX_Y)
    && (typeof window === 'undefined' || (window.innerWidth / Math.max(1, window.innerHeight)) >= 1.45);
  const BW = w + (quiero ? 2 * BAND : 0);
  if (canvas.width !== BW || canvas.height !== h || quiero !== conBanda) {
    canvas.width = BW;
    canvas.height = h;
    imgData = ctx.createImageData(BW, h);
    buf32 = new Uint32Array(imgData.data.buffer);
    conBanda = quiero;
    // OJO: modoW/modoH se actualizan ANTES de resizeCanvas — si no, el
    // escalado se calcula con las dimensiones del modo ANTERIOR y el canvas
    // queda estirado (y los controles con geometría vieja).
    modoW = BW; modoH = h;
    resizeCanvas(); // al cambiar de modo (400<->480) reajusta el CSS
  }
  modoW = BW; modoH = h;
  const lut = lut32;
  if (quiero) {
    // Franjas laterales: si hay un bezel del usuario (assets/bezel.png),
    // se pinta su diseño; si no, bandas negras. El juego va centrado.
    if (bezelBuf) {
      buf32.set(bezelBuf);
    } else {
      for (let y = 0; y < h; y++) {
        const r = y * BW;
        for (let x = 0; x < BAND; x++) {
          buf32[r + x] = 0;
          buf32[r + BAND + MAX_X + x] = 0;
        }
      }
    }
    for (let y = 0; y < h; y++) {
      const r = y * BW;
      const sr = y * MAX_X;
      for (let x = 0; x < MAX_X; x++) buf32[r + BAND + x] = lut[buf[sr + x]];
    }
  } else {
    for (let i = 0; i < w * h; i++) buf32[i] = lut[buf[i]];
  }
  ctx.putImageData(imgData, 0, 0);
}

// Bezel personalizado del usuario: imagen 840x400 (el centro 640x400 queda
// tapado por el juego; las franjas de 100 px a cada lado son el bezel).
// Se prerenderiza a un buffer y presentBuf lo pinta cada frame. Si el fichero
// no existe, se usan bandas negras.
let bezelBuf = null;
export async function cargarBezel() {
  const img = new Image();
  img.src = 'assets/bezel.png';
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
  const c = document.createElement('canvas');
  c.width = MAX_X + 2 * BAND;
  c.height = MAX_Y;
  const cx = c.getContext('2d');
  // estirado directo al canvas (840x400): el bezel debe ajustarse al canvas
  cx.drawImage(img, 0, 0, c.width, c.height);
  const d = cx.getImageData(0, 0, c.width, c.height);
  bezelBuf = new Uint32Array(d.data.buffer);
}

// Escalado entero con letterbox (CSS pixelated en index.html).
// Resta los insets del área segura (edge-to-edge de Android 15+: barras del
// sistema y notch ocupan parte de innerWidth/innerHeight) y permite escala < 1
// si la pantalla visible es más pequeña que 640x400 (móvil en horizontal).
export function resizeCanvas() {
  const cs = getComputedStyle(document.documentElement);
  const sat = parseFloat(cs.getPropertyValue('--sat')) || 0;
  const sar = parseFloat(cs.getPropertyValue('--sar')) || 0;
  const sab = parseFloat(cs.getPropertyValue('--sab')) || 0;
  const sal = parseFloat(cs.getPropertyValue('--sal')) || 0;
  const w = window.innerWidth - sal - sar;
  const h = window.innerHeight - sat - sab;
  let escala = Math.floor(Math.min(w / modoW, h / modoH));
  if (escala < 1) escala = Math.min(w / modoW, h / modoH); // caber aunque sea < 1x
  canvas.style.width = (modoW * escala) + 'px';
  canvas.style.height = (modoH * escala) + 'px';
  // el contenedor #wrap (controles táctiles) acompaña al canvas
  const wrap = document.getElementById('wrap');
  if (wrap) {
    wrap.style.width = (modoW * escala) + 'px';
    wrap.style.height = (modoH * escala) + 'px';
  }
  // el canvas cambió de tamaño: los controles de los márgenes también.
  // (OJO: recolocar en setEstado veía la geometría VIEJA del menú 640x480 —
  // el canvas no pasa a 640x400 hasta el primer present() posterior.)
  recolocarControles();
}

// movedata(Pfondo -> Pvirtual, MAX_X*MAX_Y)
export function copyBackgroundToScreen() {
  E.Pvirtual.set(E.Pfondo.subarray(0, MAX_X * MAX_Y));
}

// putico: blit con transparencia (índice 0)
export function blitSprite(x, y, w, h, src, srcOff, dst) {
  for (let r = 0; r < h; r++) {
    const di = (y + r) * MAX_X + x;
    const si = srcOff + r * w;
    for (let c = 0; c < w; c++) {
      const v = src[si + c];
      if (v !== 0) dst[di + c] = v;
    }
  }
}

// putico_sombra: color = destino+128 y si <128 +128  <=>  destino|128
export function blitSpriteShadow(x, y, w, h, src, srcOff, dst) {
  for (let r = 0; r < h; r++) {
    const di = (y + r) * MAX_X + x;
    const si = srcOff + r * w;
    for (let c = 0; c < w; c++) {
      if (src[si + c] !== 0) dst[di + c] |= 0x80;
    }
  }
}

// putico_CTRL: blit con transparencia y recorte
export function blitSpriteClipped(x, y, w, h, src, srcOff, dst) {
  for (let r = 0; r < h; r++) {
    const cy = y + r;
    if (cy < 0 || cy >= MAX_Y) continue;
    const di = cy * MAX_X + x;
    const si = srcOff + r * w;
    for (let c = 0; c < w; c++) {
      const cx = x + c;
      if (cx < 0 || cx >= MAX_X) continue;
      const v = src[si + c];
      if (v !== 0) dst[di + c] = v;
    }
  }
}

// putico_sombra_CTRL: sombra con recorte
export function blitSpriteShadowClipped(x, y, w, h, src, srcOff, dst) {
  for (let r = 0; r < h; r++) {
    const cy = y + r;
    if (cy < 0 || cy >= MAX_Y) continue;
    const di = cy * MAX_X + x;
    const si = srcOff + r * w;
    for (let c = 0; c < w; c++) {
      const cx = x + c;
      if (cx < 0 || cx >= MAX_X) continue;
      if (src[si + c] !== 0) dst[di + c] |= 0x80;
    }
  }
}

// putico_escala: blit con transparencia y escala entera (intro del nivel)
export function blitSpriteScaled(x, y, w, h, src, srcOff, dst, escala) {
  let pixel = 0;
  for (let cy = 0; cy < h * escala; cy += escala) {
    for (let cx = 0; cx < w * escala; cx += escala) {
      const v = src[srcOff + pixel];
      if (v !== 0) {
        for (let iy = 0; iy < escala; iy++)
          for (let ix = 0; ix < escala; ix++)
            dst[(y + cy + iy) * MAX_X + (x + cx + ix)] = v;
      }
      pixel++;
    }
  }
}

// putimage_CTRL: baldosa 16x16 opaca con recorte (para mutar Pfondo)
export function blitTileClipped(x, y, tileIdx, dst) {
  const srcOff = tileIdx * 256;
  for (let r = 0; r < 16; r++) {
    const cy = y + r;
    if (cy < 0 || cy >= MAX_Y) continue;
    const di = cy * MAX_X + x;
    const si = srcOff + r * 16;
    for (let c = 0; c < 16; c++) {
      const cx = x + c;
      if (cx < 0 || cx >= MAX_X) continue;
      dst[di + c] = E.baldosas[si + c];
    }
  }
}

// putpixel
export function putPixel(x, y, color, dst) { dst[y * MAX_X + x] = color; }
