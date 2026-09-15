// Nubes decorativas — init_nube/mueve_nubes de JUEGO.CC + carga() de NUBES.DAT.
// 9 sprites concatenados con tamaños hardcodeados en el C; aparecen bajo la
// pantalla cada 100 ticks y suben hacia la derecha hasta salir del campo.
import { MAX_X, MAX_Y, SOLx, SOLy } from './ctes.js';
import { E } from './estado.js';
import { blitSpriteClipped, blitSpriteShadowClipped } from './render.js';

const NUBE_SIZES = [[80, 119], [52, 78], [22, 78], [20, 49], [32, 72],
                    [18, 32], [15, 32], [19, 65], [36, 89]];
const CAMPOX = 90;   // lugares donde desaparece la nube
const CAMPOY = 125;

// Al cargar: offsets secuenciales y velocidad aleatoria 1..4 (carga(), JUEGO.CC:348-361)
export function initNubes() {
  let off = 0;
  for (let i = 0; i < 9; i++) {
    const n = E.nube[i];
    n.off = off;
    n.Lx = NUBE_SIZES[i][0];
    n.Ly = NUBE_SIZES[i][1];
    off += n.Lx * n.Ly;
    n.vel = ((Math.random() * 4) | 0) + 1;
    n.activa = false;
    n.x = 0; n.y = 0;
  }
}

// init_nube: cada 100 ticks activa todas las nubes inactivas
// (el C itera i<=NUBES_MAX con un acceso fuera de rango — saneado)
export function initNube() {
  if (E.veces % 100 !== 0) return;
  for (let i = 0; i < 9; i++) {
    const n = E.nube[i];
    if (!n.activa) {
      n.activa = true;
      n.x = E.absolutoX + ((Math.random() * MAX_X) | 0);
      n.y = E.absolutoY + (MAX_Y + CAMPOY);
    }
  }
}

// mueve_nubes: sube (y-=vel) y deriva a la derecha; sombra a +40,+40 (SOL*10)
export function mueveNubes() {
  for (let i = 0; i < 9; i++) {
    const n = E.nube[i];
    if (!n.activa) continue;
    n.y -= n.vel;
    n.x++;
    blitSpriteShadowClipped(n.x - E.absolutoX + (SOLx * 10), n.y - E.absolutoY + (SOLy * 10),
                            n.Lx, n.Ly, E.nubes, n.off, E.Pvirtual);
    blitSpriteClipped(n.x - E.absolutoX, n.y - E.absolutoY, n.Lx, n.Ly, E.nubes, n.off, E.Pvirtual);
    if ((n.x < E.absolutoX - CAMPOX) || (n.x > E.absolutoX + MAX_X + CAMPOX)) n.activa = false;
    if ((n.y < E.absolutoY - CAMPOY) || (n.y > E.absolutoY + MAX_Y + CAMPOY)) n.activa = false;
  }
}
