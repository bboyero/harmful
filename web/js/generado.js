// Generadores de enemigos — GENERADO.CC (activa_generador, destruye_generador)
import { MAX_X, MAX_Y, max_ene } from './ctes.js';
import { E } from './estado.js';
import { mapIndexAt, setTile } from './mapa.js';
import { choqueEntreEllos, choque, initEnemyType } from './enemigos.js';

export function activateGenerator() {
  const g = E.generador[E.gn];
  const x = g.X - E.absolutoX, y = g.Y - E.absolutoY;
  if ((x < -16) || (x > MAX_X) || (y < -16) || (y > MAX_Y)) return;
  if ((g.energia <= 0) || (E.veces % g.vel !== 0)) return;

  // primer slot con s_m>5 (explotado o vacío); el C contaba con un fantasma
  let num = -1;
  for (let i = 0; i < max_ene; i++) if (E.enemigo[i].s_m > 5) { num = i; break; }
  if (num === -1) return; // no hay sitio
  E.num = num;

  // ruleta de 8 posiciones alrededor del generador
  E.ruleta++;
  if (E.ruleta > 7) E.ruleta = 0;
  const e = E.enemigo[E.num];
  switch (E.ruleta) {
    case 0: e.X = g.X;     e.Y = g.Y - 16; break;
    case 1: e.X = g.X + 16; e.Y = g.Y - 16; break;
    case 2: e.X = g.X + 16; e.Y = g.Y;      break;
    case 3: e.X = g.X + 16; e.Y = g.Y + 16; break;
    case 4: e.X = g.X;     e.Y = g.Y + 16; break;
    case 5: e.X = g.X - 16; e.Y = g.Y + 16; break;
    case 6: e.X = g.X - 16; e.Y = g.Y;      break;
    case 7: e.X = g.X - 16; e.Y = g.Y - 16; break;
  }
  if (choqueEntreEllos() || choque(0) || choque(1)) return;
  const prop = mapIndexAt(e.X, e.Y);
  if (prop < 0 || prop >= E.ancho * E.alto) return; // el C leería fuera del array
  if (E.propiedad[prop] !== 0) return;

  e.tipo = g.tipo;
  initEnemyType(E.num, e.tipo);
  e.energia = g.energia;
}

export function destroyGenerator() {
  const g = E.generador[E.gn];
  const prop = ((g.Y / 16) | 0) * E.ancho + ((g.X / 16) | 0);
  E.propiedad[prop] = 0;
  setTile(prop, 522); // imagen del generador destruido
}
