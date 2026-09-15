// Efectos de pantalla — lineaAlinea() de FX.CC: cortinilla de revelado del nivel.
// Dos bandas por filas alternas: las pares se rellenan de izquierda a derecha y
// las impares de derecha a izquierda, con volcado en cada paso.
import { MAX_X, MAX_Y } from './ctes.js';
import { E } from './estado.js';
import { present } from './render.js';

export function lineaAlinea() {
  let vel = 10;
  for (let scrollx = 0; scrollx <= MAX_X; scrollx += vel) {
    const n = Math.min(scrollx + 1, MAX_X);
    for (let i = 0; i < MAX_Y; i += 2) {
      // fila par: columnas 0..scrollx <- Pfondo columnas MAX_X-scrollx..MAX_X
      E.Pvirtual.set(E.Pfondo.subarray(i * MAX_X + (MAX_X - scrollx), i * MAX_X + (MAX_X - scrollx) + n), i * MAX_X);
      // fila impar: columnas MAX_X-scrollx..MAX_X <- Pfondo columnas 0..scrollx
      E.Pvirtual.set(E.Pfondo.subarray((i + 1) * MAX_X, (i + 1) * MAX_X + n), (i + 1) * MAX_X + (MAX_X - scrollx));
    }
    present();
    if (scrollx > 580) vel = 5;
  }
}
