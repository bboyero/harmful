// Cámara y composición del fondo — pone_fondo_completo y ponefondoDER/IZQ/ABJ/ARR
// (SCROLL.CC) + scroll() (JUEGO.CC). Réplica 1:1 incluyendo el "envoltorio"
// de bytes del original cuando posenbaldosaX/Y != 0.
import { MAX_X, MAX_Y } from './ctes.js';
import { E } from './estado.js';
import { blitTileClipped } from './render.js';

// ponbaldosa: copia 4 bytes de baldosas[origen+i*16] a destino+i*MAX_X
function ponbaldosa(offOrigen, offDestino, lineas) {
  for (let i = 0; i < lineas; i++)
    for (let c = 0; c < 4; c++)
      E.Pfondo[offDestino + i * MAX_X + c] = E.baldosas[offOrigen + i * 16 + c];
}

// pone_fondo_completo: compone Pfondo entero centrado en el jugador 0
export function composeBackground() {
  E.posenbaldosaX = E.posenbaldosaY = 0;
  // OJO: en C MAX_Y/32 es división ENTERA (400/32 = 12, no 12.5)
  let firstX = ((E.play[0].H_x / 16) | 0) - ((MAX_X / 32) | 0);
  let firstY = ((E.play[0].H_y / 16) | 0) - ((MAX_Y / 32) | 0);
  if (firstX + (MAX_X / 16) > E.ancho) firstX = E.ancho - (MAX_X / 16);
  else if (firstX < 0) firstX = 0;
  if (firstY + (MAX_Y / 16) > E.alto) firstY = E.alto - (MAX_Y / 16);
  else if (firstY < 0) firstY = 0;
  E.mapaX = firstX; E.mapaY = firstY;
  E.absolutoX = firstX * 16; E.absolutoY = firstY * 16;

  for (let y = 0; y < MAX_Y / 16; y++)
    for (let x = 0; x < MAX_X / 16; x++)
      blitTileClipped(x * 16, y * 16, E.mapa[(firstY + y) * E.ancho + (firstX + x)], E.Pfondo);
}

// ponefondoDER
export function scrollRight() {
  if (E.topeX === E.absolutoX) return;
  for (let i = 0; i < MAX_Y; i++)          // scrollDER: filas 4 px a la izquierda
    E.Pfondo.copyWithin(i * MAX_X, i * MAX_X + 4, i * MAX_X + MAX_X);
  E.absolutoX += 4;
  let Nro = E.mapaY * E.ancho + E.mapaX + (MAX_X / 16);
  let offOrigen = E.mapa[Nro] * 256 + (E.posenbaldosaY * 16 + E.posenbaldosaX);
  let offDestino = 16 - E.posenbaldosaY;
  ponbaldosa(offOrigen, MAX_X - 4, offDestino);  // primera baldosa (parcial)
  Nro += E.ancho;
  offOrigen = E.mapa[Nro] * 256 + E.posenbaldosaX;
  for (let filas = 0; filas < MAX_Y / 16; filas++) {
    ponbaldosa(offOrigen, offDestino * MAX_X + (MAX_X - 4), 16);
    offDestino += 16;
    Nro += E.ancho;
    offOrigen = E.mapa[Nro] * 256 + E.posenbaldosaX;
  }
  E.posenbaldosaX += 4;
  if (E.posenbaldosaX > 15) { E.posenbaldosaX = 0; E.mapaX++; }
}

// ponefondoIZQ
export function scrollLeft() {
  if (E.absolutoX === 0) return;
  for (let i = 0; i < MAX_Y; i++)          // scrollIZQ: filas 4 px a la derecha
    E.Pfondo.copyWithin(i * MAX_X + 4, i * MAX_X, i * MAX_X + (MAX_X - 4));
  E.absolutoX -= 4;
  E.posenbaldosaX -= 4;
  if (E.posenbaldosaX < 0) { E.posenbaldosaX = 12; E.mapaX--; }
  let Nro = E.mapaY * E.ancho + E.mapaX;
  let offOrigen = E.mapa[Nro] * 256 + (E.posenbaldosaY * 16 + E.posenbaldosaX);
  let offDestino = 16 - E.posenbaldosaY;
  ponbaldosa(offOrigen, 0, offDestino);
  Nro += E.ancho;
  offOrigen = E.mapa[Nro] * 256 + E.posenbaldosaX;
  for (let filas = 0; filas < MAX_Y / 16; filas++) {
    ponbaldosa(offOrigen, offDestino * MAX_X, 16);
    Nro += E.ancho;
    offOrigen = E.mapa[Nro] * 256 + E.posenbaldosaX;
    offDestino += 16;
  }
}

// ponefondoABJ
export function scrollDown() {
  if (E.topeY === E.absolutoY) return;
  for (let i = 0; i < MAX_Y; i++)          // scrollABJ: filas 4 px hacia arriba
    E.Pfondo.copyWithin(i * MAX_X, (i + 4) * MAX_X, (i + 4) * MAX_X + MAX_X);
  E.absolutoY += 4;
  let Nro = (E.mapaY + (MAX_Y / 16)) * E.ancho + E.mapaX;
  let offOrigen = E.mapa[Nro] * 256 + (E.posenbaldosaY * 16 + E.posenbaldosaX);
  // 4 filas de 16 bytes (copia ciega: puede envolver a la fila siguiente del tile)
  for (let k = 0; k < 4; k++)
    for (let c = 0; c < 16; c++)
      E.Pfondo[MAX_X * (MAX_Y - 4 + k) + c] = E.baldosas[offOrigen + k * 16 + c];

  let offsetDestino = 16 - E.posenbaldosaX;
  Nro++;
  let offOrigen2 = E.mapa[Nro] * 256 + (E.posenbaldosaY * 16);
  let resto = 16 - E.posenbaldosaX;
  for (let filas = 0; filas < MAX_X / 16; filas++) {
    let mover = MAX_X - resto;
    if (mover > 16) mover = 16;
    for (let k = 0; k < 4; k++)
      for (let c = 0; c < mover; c++)
        E.Pfondo[offsetDestino + MAX_X * (MAX_Y - 4 + k) + c] = E.baldosas[offOrigen2 + k * 16 + c];
    offsetDestino += 16; resto += 16;
    Nro++;
    offOrigen2 = E.mapa[Nro] * 256 + E.posenbaldosaY * 16;
  }
  E.posenbaldosaY += 4;
  if (E.posenbaldosaY > 15) { E.posenbaldosaY = 0; E.mapaY++; }
}

// ponefondoARR
export function scrollUp() {
  if (E.absolutoY === 0) return;
  for (let i = MAX_Y - 1; i >= 0; i--)     // scrollARR: filas 4 px hacia abajo
    E.Pfondo.copyWithin((i + 4) * MAX_X, i * MAX_X, i * MAX_X + MAX_X);
  E.absolutoY -= 4;
  E.posenbaldosaY -= 4;
  if (E.posenbaldosaY < 0) { E.posenbaldosaY = 12; E.mapaY--; }
  let Nro = E.mapaY * E.ancho + E.mapaX;
  let offOrigen = E.mapa[Nro] * 256 + (E.posenbaldosaY * 16 + E.posenbaldosaX);
  for (let k = 0; k < 4; k++)
    for (let c = 0; c < 16; c++)
      E.Pfondo[k * MAX_X + c] = E.baldosas[offOrigen + k * 16 + c];

  let offsetDestino = 16 - E.posenbaldosaX;
  Nro++;
  let offOrigen2 = E.mapa[Nro] * 256 + (E.posenbaldosaY * 16);
  let resto = 16 - E.posenbaldosaX;
  for (let filas = 0; filas < MAX_X / 16; filas++) {
    let mover = MAX_X - resto;
    if (mover > 16) mover = 16;
    for (let k = 0; k < 4; k++)
      for (let c = 0; c < mover; c++)
        E.Pfondo[k * MAX_X + offsetDestino + c] = E.baldosas[offOrigen2 + k * 16 + c];
    offsetDestino += 16; resto += 16;
    Nro++;
    offOrigen2 = E.mapa[Nro] * 256 + E.posenbaldosaY * 16;
  }
}

// scroll() de JUEGO.CC: objetivo = centro de pantalla, 1 paso de 4 px por tick
export function updateCamera() {
  const ox = ((E.absolutoX + (MAX_X / 2)) / 16) | 0;
  const oy = ((E.absolutoY + (MAX_Y / 2)) / 16) | 0;
  let Cjx, Cjy;
  if (!E.play[0].level_end && !E.play[1].level_end) {
    Cjx = ((E.play[0].H_x + E.play[1].H_x) / 32) | 0;
    Cjy = ((E.play[0].H_y + E.play[1].H_y) / 32) | 0;
  } else if (!E.play[0].level_end) {
    Cjx = (E.play[0].H_x / 16) | 0;
    Cjy = (E.play[0].H_y / 16) | 0;
  } else {
    Cjx = (E.play[1].H_x / 16) | 0;
    Cjy = (E.play[1].H_y / 16) | 0;
  }
  if (Cjx > ox) scrollRight(); else if (Cjx < ox) scrollLeft();
  if (Cjy > oy) scrollDown(); else if (Cjy < oy) scrollUp();
}
