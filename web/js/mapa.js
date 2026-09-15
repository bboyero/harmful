// Acceso y mutación del mapa — caracteristica() + patrón "mutar y repintar Pfondo"
import { E } from './estado.js';
import { blitTileClipped } from './render.js';

// caracteristica(x,y) = (y/16)*ancho + (x/16)
export function mapIndexAt(x, y) {
  return ((y / 16) | 0) * E.ancho + ((x / 16) | 0);
}

// Mutar la baldosa y repintarla en Pfondo (el patrón que el C repite en
// coger/puertas/minas/trampas/generadores/rompe_*)
export function setTile(prop, tileIdx) {
  E.mapa[prop] = tileIdx;
  const x = (prop % E.ancho) * 16;
  const y = ((prop / E.ancho) | 0) * 16;
  blitTileClipped(x - E.absolutoX, y - E.absolutoY, tileIdx, E.Pfondo);
}
