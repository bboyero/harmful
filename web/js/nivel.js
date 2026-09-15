// Ciclo de vida de nivel — init_level / finaliza_level de JUEGO.CC
import { SC_ESC, SPR } from './ctes.js';
import { E } from './estado.js';
import { loadLevel } from './assets.js';
import { composeBackground } from './scroll.js';
import { blitSpriteScaled, present } from './render.js';
import { drawTextBig } from './fuente.js';
import { lineaAlinea } from './fx.js';

// init_level(): nivel_ac++, carga el mapa, compone el fondo, cortinilla lineaAlinea
// y splash "LEVEL n" (como en el C). En modo ALEATORIO level_ac es el índice en
// levelList y el splash muestra el número real del mapa.
export function initLevel() {
  E.absolutoX = E.absolutoY = E.mapaX = E.mapaY = 0;
  E.level_ac++;
  const n = E.levelList ? E.levelList[E.level_ac - 1] : E.level_ac;
  return loadLevel(n).then(() => {
    composeBackground();
    lineaAlinea();
    blitSpriteScaled(E.play[0].H_x - E.absolutoX, E.play[0].H_y - E.absolutoY,
                     13, 13, E.anima, SPR.camHV, E.Pvirtual, 5);
    drawTextBig(175, 130, 'LEVEL ' + n, E.Pvirtual, 15);
    present();
    E.Tpuertas = 0;
  });
}

// finaliza_level(): derrota -> ESC (fuera del bucle); espera a la animación de
// salida; si no, carga el siguiente nivel
export function finalizeLevel() {
  if ((E.play[0].energia <= 0) && (E.play[1].energia <= 0)) {
    E.keys[SC_ESC] = 1;    // game over: fuera del bucle (como el C)
    E.gameOverFlag = true;
    return null;
  }
  if ((E.play[0].H_s_m < 8) || (E.play[1].H_s_m < 8)) return null;
  E.play[0].level_end = E.play[1].level_end = false;
  return initLevel().then(() => {
    E.play[1].H_x = E.play[0].H_x + 16;
    E.play[1].H_y = E.play[0].H_y + 16;
  });
}
