// Cronómetro de poderes temporizados — CRONO.CC (LEDs + paleta del LED)
import { SPR } from './ctes.js';
import { E } from './estado.js';
import { blitSprite } from './render.js';
import { setLutColor } from './paleta.js';

const CTR = 90;

export function startCrono(n) {
  setLutColor(114, 0, 161, 0);
  setLutColor(115, 0, 235, 0);
  E.cr_ini = E.crono = n * 18;
}

export function updateCrono() {
  const ledOff = SPR.led + 11 * 33; // frame "vacío"
  for (let i = 15; i >= 0; i--) {
    blitSprite(13 * i + CTR, 0, 11, 33, E.anima, ledOff, E.Pvirtual);
    blitSprite(13 * (15 - i) + 256 + CTR, 0, 11, 33, E.anima, ledOff, E.Pvirtual);
  }
  const quedan = ((16 * E.crono) / E.cr_ini) | 0;
  for (let i = quedan; i < 16; i++) {
    blitSprite(13 * (15 - i) + CTR, 0, 11, 33, E.anima, SPR.led, E.Pvirtual);
    blitSprite(13 * i + 256 + CTR, 0, 11, 33, E.anima, SPR.led, E.Pvirtual);
  }

  if ((quedan < 8) && (quedan > 4)) { setLutColor(114, 161, 161, 0); setLutColor(115, 235, 235, 0); }
  else if (quedan < 4) { setLutColor(114, 161, 0, 0); setLutColor(115, 235, 0, 0); }

  if (E.crono <= 10) {
    E.inmovil = E.play[0].repulsivo = E.play[1].repulsivo = E.inmune = false;
    E.crono = -1;
    E.play[0].invisible = E.play[1].invisible = false;
  }
}
