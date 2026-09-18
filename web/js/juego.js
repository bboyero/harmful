// Lógica del juego — JUEGO.CC + ENJUEGO.CC + INT08.CC (tick a 18,2 Hz)
import {
  MAX_X, MAX_Y, VEL, SOLx, SOLy, TICS_SEG, PUERTAS, max_ene,
  arma_vel, arma_alcance, arma_fuerza,
  H2O, SLD, MINA, desDER, desIZQ, desARR, desABJ, FRGL, EXT, GEN, DOOR, TRAMPA,
  CABLE, SOLIDOF, TRANS, LLAVE, FOOD, FOODF, POTF, POT, ARMADURA, COMBATE,
  MAGIA, INMOVIL, REPULSIVO, INVISIBLE, VENENO,
  SOLDADO, FANTASMA, MUERTE,
  SC_ESC, SC_F01, SC_DER, SC_IZQ, SC_ARR, SC_ABJ, SC_SPC, SC_CERO,
  SPR, MOBJ,
} from './ctes.js';
import { E } from './estado.js';
import {
  copyBackgroundToScreen, blitSprite, blitSpriteShadow,
} from './render.js';
import { drawTextMini, drawTextMidle } from './fuente.js';
import { mapIndexAt, setTile } from './mapa.js';
import { updateCamera } from './scroll.js';
import { finalizeLevel } from './nivel.js';
import { choqueYoEl, hayInterseccion, pointInRect, moveEnemy, drawEnemy } from './enemigos.js';
import { activateGenerator, destroyGenerator } from './generado.js';
import { startCrono, updateCrono } from './crono.js';
import { rotatePalette, restorePalette, whiteFlash } from './paleta.js';
import { initNube, mueveNubes } from './nubes.js';
import { play, vibrar } from './sonido.js';

// ---------------------------------------------------------------------------
// Jugador
// ---------------------------------------------------------------------------

// init_players(): una sola vez al empezar la partida (PLAYERS=1)
export function initPlayers() {
  E.crono = -100;
  E.keys[SC_ESC] = 0;
  E.gameOverFlag = false;
  E.play[0].H_s_m = E.play[1].H_s_m = 0;
  E.play[0].llaves = E.play[1].llaves = 0;
  E.play[0].pot = E.play[1].pot = 0;
  E.play[0].armadura = E.play[1].armadura = 0;
  E.play[0].combate = E.play[1].combate = E.play[0].magia = E.play[1].magia = false;
  E.play[0].repulsivo = E.play[1].repulsivo = false;
  E.play[0].invisible = E.play[1].invisible = true; // "por defecto no se ven"
  E.inmovil = E.inmune = false;
  E.play[0].energia = 2000;
  E.play[1].H_x = E.play[1].H_y = 9999999;
  E.play[1].energia = 0;
  E.play[1].H_s_m = E.play[0].H_s_m = 9;
  E.play[1].level_end = true; // en 1 jugador, el jugador 2 "ya terminó"
  E.play[0].level_end = false;
  E.play[0].invisible = false;
}

// poneH: dibuja al jugador actual (sombra + sprite)
export function poneH() {
  const p = E.play[E.jug];
  const x = p.H_x - E.absolutoX, y = p.H_y - E.absolutoY;
  const base = (E.jug === 0) ? SPR.camHV : SPR.camHR;
  const off = base + 1352 * p.H_d + 169 * p.H_s;
  blitSpriteShadow(x + SOLx, y + SOLy, 13, 13, E.anima, off, E.Pvirtual);
  blitSprite(x, y, 13, 13, E.anima, off, E.Pvirtual);
}

// secuencia_salir(n): animación de salida de nivel
export function exitSequence(n) {
  E.jug = n;
  const p = E.play[n];
  p.H_d = p.H_s_m;
  p.H_s_m++;
  poneH();
  if (p.H_s_m > 7) { p.H_x = p.H_y = 99999999; }
}

// derecha/izquierda/arriba/abajo: fijan H_d y reposo
function derecha() { E.play[E.jug].H_d = 2; E.reposo = false; }
function izquierda() { E.play[E.jug].H_d = 6; E.reposo = false; }
function arriba() {
  const p = E.play[E.jug];
  if (p.H_d === 2) p.H_d = 1; else if (p.H_d === 6) p.H_d = 7; else p.H_d = 0;
  E.reposo = false;
}
function abajo() {
  const p = E.play[E.jug];
  if (p.H_d === 2) p.H_d = 3; else if (p.H_d === 6) p.H_d = 5; else p.H_d = 4;
  E.reposo = false;
}

// ctrl_jugadores: prioridad DER>IZQ, ARR>ABJ; disparar o poción suprime el movimiento
export function controlPlayer() {
  const k = E.keys;
  if (k[SC_DER]) derecha(); else if (k[SC_IZQ]) izquierda();
  if (k[SC_ARR]) arriba(); else if (k[SC_ABJ]) abajo();
  if (k[SC_SPC]) shoot(); else if (k[SC_CERO]) throwPotion(); else if (!E.reposo) mueve_hombre();
  E.reposo = true;
  mirarPies();
}

// Sondas de colisión (analizaDER/IZQ/ARR/ABJ unificados): 2 puntos por eje,
// inset 4 px del borde de avance (sprite 13x13)
const PROBES = {
  0: [[4, 4], [9, 4]],   // ARR
  2: [[9, 4], [9, 9]],   // DER
  4: [[4, 9], [9, 9]],   // ABJ
  6: [[4, 4], [4, 9]],   // IZQ
};

function revertAxis(dir, avance) {
  const p = E.play[E.jug];
  if (dir === 2) p.H_x -= avance;
  else if (dir === 6) p.H_x += avance;
  else if (dir === 0) p.H_y += avance;
  else p.H_y -= avance;
}

export function probeStep(dir, avance) {
  const p = E.play[E.jug];
  for (const [ox, oy] of PROBES[dir]) {
    const prop = mapIndexAt(p.H_x + ox, p.H_y + oy);
    if (prop < 0 || prop >= E.ancho * E.alto) return; // el C leería fuera del array
    switch (E.propiedad[prop]) {
      case SOLIDOF: case FRGL: case FRGL + 1: case FRGL + 2: case GEN: case SLD:
        revertAxis(dir, avance); return;
      case H2O:
        drown(); return;
      case DOOR:
        if (p.llaves > 0) { openDoors(prop); p.llaves--; }
        else revertAxis(dir, avance);
        return;
      case LLAVE: case FOOD: case FOODF: case POTF: case POT: case ARMADURA:
      case COMBATE: case MAGIA: case INMOVIL: case REPULSIVO: case INVISIBLE:
      case VENENO:
        pickUp(prop); return;
      case TRAMPA: play('trampa'); openTrap(prop); return;
      case MINA: stepOnMine(prop); return;
      case TRANS: teleport(prop); return;
      case EXT: exitLevel(prop); return;
    }
  }
}

// mueve_derecha/izquierda/arriba/abajo (clamp de pantalla + avance + sonda)
function mueve_derecha() {
  const p = E.play[E.jug];
  if (p.H_x - E.absolutoX > MAX_X - 20) return;
  p.H_x += VEL; probeStep(2, VEL);
  p.H_s = (p.H_s + 1) & 7;
}
function mueve_izquierda() {
  const p = E.play[E.jug];
  if (p.H_x - E.absolutoX < 16) return;
  p.H_x -= VEL; probeStep(6, VEL);
  p.H_s = (p.H_s + 1) & 7;
}
function mueve_arriba() {
  const p = E.play[E.jug];
  if (p.H_y - E.absolutoY < 16) return;
  p.H_y -= VEL; probeStep(0, VEL);
  p.H_s = (p.H_s + 1) & 7;
}
function mueve_abajo() {
  const p = E.play[E.jug];
  if (p.H_y - E.absolutoY > MAX_Y - 16) return;
  p.H_y += VEL; probeStep(4, VEL);
  p.H_s = (p.H_s + 1) & 7;
}

// mueve_hombre: dos ejes secuenciales (diagonal = 4 px por eje y por tick)
export function mueve_hombre() {
  E.Tpuertas = 0;
  switch (E.play[E.jug].H_d) {
    case 0: mueve_arriba(); break;
    case 1: mueve_arriba(); mueve_derecha(); break;
    case 2: mueve_derecha(); break;
    case 3: mueve_derecha(); mueve_abajo(); break;
    case 4: mueve_abajo(); break;
    case 5: mueve_abajo(); mueve_izquierda(); break;
    case 6: mueve_izquierda(); break;
    case 7: mueve_izquierda(); mueve_arriba(); break;
  }
}

// Deslizadores (hielo): ±2 px/tick automático (mirar_pies en ENJUEGO.CC)
function mirarPies() {
  const p = E.play[E.jug];
  const prop = mapIndexAt(p.H_x + 9, p.H_y + 4);
  if (prop < 0 || prop >= E.ancho * E.alto) return;
  switch (E.propiedad[prop]) {
    case desDER: desliza_derecha(); break;
    case desIZQ: desliza_izquierda(); break;
    case desARR: desliza_arriba(); break;
    case desABJ: desliza_abajo(); break;
  }
}
function desliza_derecha() {
  const p = E.play[E.jug];
  if (p.H_x - E.absolutoX > MAX_X - 20) return;
  p.H_x += 2; probeStep(2, 2);
}
function desliza_izquierda() {
  const p = E.play[E.jug];
  if (p.H_x - E.absolutoX < 16) return;
  p.H_x -= 2; probeStep(6, 2);
}
function desliza_arriba() {
  const p = E.play[E.jug];
  if (p.H_y - E.absolutoY < 16) return;
  p.H_y -= 2; probeStep(0, 2);
}
function desliza_abajo() {
  const p = E.play[E.jug];
  if (p.H_y - E.absolutoY > MAX_Y - 16) return;
  p.H_y += 2; probeStep(4, 2);
}

// mueve_play(Activo, Inactivo): input, melee, disparo al otro, empuje
export function movePlayer(Activo, Inactivo) {
  E.jug = Activo;
  const p = E.play[E.jug];
  p.H_x_back = p.H_x; p.H_y_back = p.H_y; p.H_s_back = p.H_s;

  controlPlayer();

  // melee solo si me he movido
  if (p.H_s !== p.H_s_back) {
    for (E.num = 0; E.num < max_ene; E.num++) {
      if (choqueYoEl(E.jug)) { p.H_x = p.H_x_back; p.H_y = p.H_y_back; break; }
    }
  }

  // mi disparo vs el otro jugador (9x9 vs 13x13)
  const other = E.play[Inactivo];
  const EL = { x1: other.H_x, y1: other.H_y, x2: other.H_x + 13, y2: other.H_y + 13 };
  const YO = { x1: p.D_x, y1: p.D_y, x2: p.D_x + 9, y2: p.D_y + 9 };
  if (hayInterseccion(YO, EL)) {
    p.D_d = 255; p.D_x = p.D_y = 0;
    other.energia -= arma_fuerza;
  }

  // choqueP0_P1 (13x13): retrocedo y empujo al otro
  if (hayInterseccion(
    { x1: E.play[0].H_x, y1: E.play[0].H_y, x2: E.play[0].H_x + 13, y2: E.play[0].H_y + 13 },
    { x1: E.play[1].H_x, y1: E.play[1].H_y, x2: E.play[1].H_x + 13, y2: E.play[1].H_y + 13 })) {
    p.H_x = p.H_x_back; p.H_y = p.H_y_back;
    E.jug = Inactivo;
    const tmp = other.H_d, tmp1 = other.H_s;
    other.H_d = E.play[Activo].H_d;
    mueve_hombre();
    other.H_d = tmp; other.H_s = tmp1; // no cambia ni dirección ni secuencia
    E.jug = Activo;
  }
}

// mueve_players: jugadores + F1 + enemigos + disparos (orden exacto del C)
export function movePlayers() {
  if ((E.play[0].energia > 0) && (!E.play[0].level_end)) movePlayer(0, 1);
  if ((E.play[1].energia > 0) && (!E.play[1].level_end)) movePlayer(1, 0);

  if (E.keys[SC_F01]) E.marcador = 1 - E.marcador;

  for (E.num = 0; E.num < max_ene; E.num++) {
    moveEnemy();
    drawEnemy();
    advanceShot(E.enemigo[E.num], E.num);
    const en = E.enemigo[E.num];
    if (en.energia <= 0) continue; // los muertos no me acercan

    let rec = { x1: E.play[0].H_x, y1: E.play[0].H_y, x2: E.play[0].H_x + 16, y2: E.play[0].H_y + 16 };
    if (pointInRect(en.D_x + 5, en.D_y + 5, rec)) {
      en.D_d = 255;
      E.play[0].energia -= arma_fuerza;
    }
    if ((E.play[1].energia > 0) && (!E.play[1].level_end)) {
      rec = { x1: E.play[1].H_x, y1: E.play[1].H_y, x2: E.play[1].H_x + 16, y2: E.play[1].H_y + 16 };
      if (pointInRect(en.D_x + 5, en.D_y + 5, rec)) {
        en.D_d = 255;
        E.play[1].energia -= arma_fuerza;
      }
    }
  }

  E.num = 9999; // para poder dar al último
  if ((E.play[1].energia > 0) && (!E.play[1].level_end)) {
    E.jug = 1; poneH();
    advanceShot(E.play[1], 9999);
  }
  if ((E.play[0].energia > 0) && (!E.play[0].level_end)) {
    E.jug = 0; poneH();
    advanceShot(E.play[0], 9999);
  }
}

// ---------------------------------------------------------------------------
// Objetos y baldosas especiales (JUEGO.CC)
// ---------------------------------------------------------------------------

// coger: recoger objeto (propiedad -> 0, baldosa -> la siguiente)
export function pickUp(prop) {
  const p = E.play[E.jug];
  switch (E.propiedad[prop]) {
    case LLAVE: play('llaves'); p.llaves++; p.puntos += 100; break;
    case POTF:
    case POT: play('pocion'); p.pot++; p.puntos += 100; break;
    case FOODF:
    case FOOD: play('comer'); p.energia += 100; p.puntos += 100; break;
    case VENENO: p.energia -= 100; vibrar(60); break;
    case ARMADURA:
      if (p.armadura > 0) { p.pot++; break; }
      p.armadura = 5; p.puntos += 100; break;
    case COMBATE:
      if (p.combate) { p.pot++; break; }
      p.combate = true; p.puntos += 100; break;
    case MAGIA:
      if (p.magia) { p.pot++; break; }
      p.magia = true; p.puntos += 100; break;
    case INMOVIL:
      E.inmovil = true; p.repulsivo = p.invisible = false;
      startCrono(20); p.puntos += 100; break;
    case REPULSIVO:
      p.repulsivo = true; E.inmovil = p.invisible = false;
      startCrono(20); p.puntos += 100; break;
    case INVISIBLE:
      p.repulsivo = E.inmovil = false; p.invisible = true;
      startCrono(20); p.puntos += 100; break;
  }
  E.propiedad[prop] = 0;
  E.mapa[prop]++;
  setTile(prop, E.mapa[prop]);
}

// pisa_mina: -50 a jugadores/enemigos en 48x48 + reacción en cadena
export function stepOnMine(prop) {
  play('mina');
  E.propiedad[prop] = 0;
  E.mapa[prop]++;
  setTile(prop, E.mapa[prop]);

  // slot libre para la explosión (s_m>5)
  let slot = -1;
  for (let i = 0; i < max_ene; i++) if (E.enemigo[i].s_m > 5) { slot = i; break; }
  if (slot !== -1) {
    const e = E.enemigo[slot];
    e.s_m = 0;
    e.X = (prop % E.ancho) * 16;
    e.Y = ((prop / E.ancho) | 0) * 16;
  }

  const x = (prop % E.ancho) * 16;
  const y = ((prop / E.ancho) | 0) * 16;
  const YO = { x1: x - 16, y1: y - 16, x2: x + 32, y2: y + 32 };
  let alcanzado = false;
  if (hayInterseccion(YO, { x1: E.play[0].H_x, y1: E.play[0].H_y, x2: E.play[0].H_x + 13, y2: E.play[0].H_y + 13 })) {
    E.play[0].energia -= 50;
    alcanzado = true;
  }
  if (hayInterseccion(YO, { x1: E.play[1].H_x, y1: E.play[1].H_y, x2: E.play[1].H_x + 13, y2: E.play[1].H_y + 13 })) {
    E.play[1].energia -= 50;
    alcanzado = true;
  }
  if (alcanzado) vibrar([80, 40, 120]); // la mina alcanzó al jugador
  for (let i = 0; i < max_ene; i++) {
    if (E.enemigo[i].energia <= 0) continue;
    if (hayInterseccion(YO, { x1: E.enemigo[i].X, y1: E.enemigo[i].Y, x2: E.enemigo[i].X + 13, y2: E.enemigo[i].Y + 13 }))
      E.enemigo[i].energia -= 50;
  }
  alLado(prop + E.ancho);
  alLado(prop - E.ancho);
  alLado(prop + 1);
  alLado(prop - 1);
}

// al_lado: reacción en cadena de la mina
function alLado(cual) {
  if (cual < 0 || cual >= E.ancho * E.alto) return; // saneado
  switch (E.propiedad[cual]) {
    case MINA: stepOnMine(cual); break;
    case FOODF: breakFood(cual); break;
    case POTF:
    case ARMADURA:
    case COMBATE:
    case MAGIA:
    case VENENO: breakPotion(cual); break;
  }
}

// rompe_pot: flash + -10 a enemigos en pantalla
export function breakPotion(prop) {
  play('cristal');
  whiteFlash(); // to_white + pon_paleta + restaurar paleta_back (sin delay en JS)
  E.propiedad[prop] = 0;
  E.mapa[prop]++;
  setTile(prop, E.mapa[prop]);
  for (E.num = 0; E.num < max_ene; E.num++) {
    const en = E.enemigo[E.num];
    const x = en.X - E.absolutoX, y = en.Y - E.absolutoY;
    if ((x < -16) || (x > MAX_X) || (y < -16) || (y > MAX_Y)) continue;
    en.energia -= 10; E.play[E.jug].puntos += 10;
  }
  restorePalette();
}

// rompe_comida
export function breakFood(prop) {
  play('cristal');
  E.propiedad[prop] = 0;
  E.mapa[prop]++;
  setTile(prop, E.mapa[prop]);
}

// rompe_pared: pared frágil (3 fases)
export function breakWall(prop) {
  E.propiedad[prop]++;
  E.mapa[prop]++;
  if (E.propiedad[prop] === 13) E.propiedad[prop] = 0;
  setTile(prop, E.mapa[prop]);
}

// abrir: flood-fill iterativo de puertas (orden del C: abajo, arriba, der, izq)
export function openDoors(prop) {
  const stack = [prop];
  while (stack.length) {
    const p = stack.pop();
    if (p < 0 || p >= E.ancho * E.alto) continue;
    if (E.propiedad[p] !== DOOR) continue;
    E.propiedad[p] = 0;
    setTile(p, 343); // blindaje
    stack.push(p - 1, p + 1, p - E.ancho, p + E.ancho);
  }
}

// puertas: quita TODAS las puertas del nivel (a los 30 s)
export function openAllDoors() {
  E.Tpuertas = 0;
  for (let b = 0; b < E.alto; b++)
    for (let a = 0; a < E.ancho; a++) {
      const prop = b * E.ancho + a;
      if (E.propiedad[prop] === DOOR) {
        E.propiedad[prop] = 0;
        setTile(prop, 343);
      }
    }
}

// abre_trampa: flood-fill por TRAMPA/CABLE/SOLIDOF (los SOLIDOF -> blindaje)
export function openTrap(prop) {
  const stack = [prop];
  while (stack.length) {
    const p = stack.pop();
    if (p < 0 || p >= E.ancho * E.alto) continue;
    const pr = E.propiedad[p];
    if (pr !== TRAMPA && pr !== CABLE && pr !== SOLIDOF) continue;
    if (pr === SOLIDOF) setTile(p, 343);
    E.propiedad[p] = 0;
    stack.push(p - 1, p + 1, p - E.ancho, p + E.ancho);
  }
}

// ahogar: muerte instantánea (energía -100 la marca como ahogado)
export function drown() {
  play('choff');
  E.play[E.jug].energia = -100;
  vibrar([100, 50, 200]); // golpe fuerte: ahogamiento
}

// transportador: teletransporte a otra TRANS visible
export function teleport(estoy) {
  play('transp');
  for (let b = E.mapaY + 4; b < (MAX_Y / 16) - 4; b++)
    for (let a = E.mapaX + 4; a < (MAX_X / 16) - 4; a++) {
      let prop = b * E.ancho + a;
      if (prop === estoy) continue; // no proceso mi posición actual
      if (E.propiedad[prop] === TRANS) {
        switch (E.veces % 8) {
          case 0: prop -= E.ancho; break;
          case 1: prop -= (E.ancho + 1); break;
          case 2: prop++; break;
          case 3: prop += (E.ancho + 1); break;
          case 4: prop += E.ancho; break;
          case 5: prop += (E.ancho - 1); break;
          case 6: prop--; break;
          case 7: prop -= (E.ancho - 1); break;
        }
        if (prop >= 0 && prop < E.ancho * E.alto && E.propiedad[prop] === 0) {
          // no aparezco encima de nada
          E.play[E.jug].H_x = (prop % E.ancho) * 16;
          E.play[E.jug].H_y = ((prop / E.ancho) | 0) * 16;
        }
        return;
      }
    }
}

// salir: tocar la salida del nivel
export function exitLevel(prop) {
  play('salida');
  const p = E.play[E.jug];
  p.H_x = (prop % E.ancho) * 16;
  p.H_y = ((prop / E.ancho) | 0) * 16;
  p.level_end = true;
  p.H_s_m = 0;
}

// ---------------------------------------------------------------------------
// Arma y poción (JUEGO.CC)
// ---------------------------------------------------------------------------

// disparar
export function shoot() {
  E.Tpuertas = 0;
  const p = E.play[E.jug];
  if (p.D_d === 255) {
    play('disparo');
    p.D_d = p.H_d;
    p.D_x = p.H_x; p.D_y = p.H_y; p.D_r = 0;
  }
}

// pon_disparo: avanza el proyectil (jugador o enemigo), choques y daños
export function advanceShot(owner, selfIdx) {
  if (owner.D_d === 255) return;
  switch (owner.D_d) {
    case 0: owner.D_y -= arma_vel; break;
    case 1: owner.D_y -= arma_vel; owner.D_x += arma_vel; break;
    case 2: owner.D_x += arma_vel; break;
    case 3: owner.D_y += arma_vel; owner.D_x += arma_vel; break;
    case 4: owner.D_y += arma_vel; break;
    case 5: owner.D_y += arma_vel; owner.D_x -= arma_vel; break;
    case 6: owner.D_x -= arma_vel; break;
    case 7: owner.D_y -= arma_vel; owner.D_x -= arma_vel; break;
  }
  // ¿se ha estrellado? (caracteristica(D_x+5, D_y+5))
  const cx = owner.D_x + 5, cy = owner.D_y + 5;
  if (cx >= 0 && cy >= 0 && cx < E.ancho * 16 && cy < E.alto * 16) {
    const prop = mapIndexAt(cx, cy);
    switch (E.propiedad[prop]) {
      case SOLIDOF: case SLD: case FOOD: case POT: case DOOR:
        play('choque'); owner.D_d = 255; return;
      case FRGL: case FRGL + 1: case FRGL + 2:
        breakWall(prop); owner.D_d = 255; return;
      case FOODF: case VENENO:
        breakFood(prop); owner.D_d = 255; return;
      case POTF: case MAGIA:
        breakPotion(prop); owner.D_d = 255; return;
      case MINA:
        stepOnMine(prop); owner.D_d = 255; return;
    }
  }
  // dibujar si está en pantalla
  const x = owner.D_x - E.absolutoX, y = owner.D_y - E.absolutoY;
  if ((x >= 0) && (x < MAX_X) && (y >= 0) && (y < MAX_Y)) {
    const off = SPR.bola + 81 * owner.D_d;
    blitSprite(x, y, 9, 9, E.anima, off, E.Pvirtual);
    blitSpriteShadow(x + SOLx + 2, y + SOLy + 2, 9, 9, E.anima, off, E.Pvirtual);
  } else { owner.D_d = 255; return; }

  // ¿he dado a alguien?
  const YO = { x1: owner.D_x, y1: owner.D_y, x2: owner.D_x + 9, y2: owner.D_y + 9 };
  for (let i = 0; i < max_ene; i++) {
    const en = E.enemigo[i];
    if (en.energia <= 0) continue;
    if (i === selfIdx) continue; // no me doy
    if (hayInterseccion(YO, { x1: en.X, y1: en.Y, x2: en.X + 16, y2: en.Y + 16 })) {
      owner.D_d = 255;
      if (en.tipo !== MUERTE) en.energia -= arma_fuerza;
      owner.puntos += arma_fuerza;
      return;
    }
  }
  // ¿he dado al generador?
  for (E.gn = 0; E.gn < E.max_gen; E.gn++) {
    const g = E.generador[E.gn];
    if (g.energia <= 0) continue;
    if (hayInterseccion(YO, { x1: g.X, y1: g.Y, x2: g.X + 16, y2: g.Y + 16 })) {
      owner.D_d = 255;
      g.energia -= arma_fuerza;
      if (g.energia <= 0) destroyGenerator();
      owner.puntos += arma_fuerza;
      return;
    }
  }

  owner.D_r += arma_vel;
  if (owner.D_r >= arma_alcance) { owner.D_d = 255; return; }
}

// tira_pot: poción contra todos los enemigos en pantalla
export function throwPotion() {
  const p = E.play[E.jug];
  if (p.pot > 0) p.pot--; else return;
  for (E.num = 0; E.num < max_ene; E.num++) {
    const en = E.enemigo[E.num];
    const x = en.X - E.absolutoX, y = en.Y - E.absolutoY;
    if ((x < -16) || (x > MAX_X) || (y < -16) || (y > MAX_Y)) continue;
    if (en.tipo === MUERTE) { en.energia = 0; p.puntos += 1000; continue; }
    if (p.magia) { en.energia -= 30; p.puntos += 30; }
    else { en.energia -= 20; p.puntos += 20; }
  }
  if (p.magia) {
    for (E.gn = 0; E.gn < E.max_gen; E.gn++) {
      const g = E.generador[E.gn];
      const x = g.X - E.absolutoX, y = g.Y - E.absolutoY;
      if ((x < -16) || (x > MAX_X) || (y < -16) || (y > MAX_Y)) continue;
      g.energia -= 30; p.puntos += 30;
      destroyGenerator();
    }
  }
  restorePalette(); // movedata paleta_back -> paleta + pon_paleta (sin delay)
}

// ---------------------------------------------------------------------------
// Marcador (pon_marcador, PLAYERS=1)
// ---------------------------------------------------------------------------

export function drawHUD() {
  const p = E.play[0];
  // Marcador EXACTAMENTE como el original (pon_marcador de ENJUEGO.CC):
  // energía con MIDLE 9x11 (colores por píxel, con el glifo extra del bug
  // strlen+1 que a Borja le gusta), puntos con MINI 8x8, iconos en su sitio.
  drawTextMidle(0, 3, String(p.energia), E.Pvirtual);
  drawTextMini(50, 3, String(p.puntos), E.Pvirtual);
  for (let i = 0; i < p.llaves; i++) blitSprite(i * 5, 13, 16, 16, E.mobj, MOBJ.mkey, E.Pvirtual);
  for (let i = 0; i < p.pot; i++) blitSprite(i * 5, 23, 16, 16, E.mobj, MOBJ.mpot, E.Pvirtual);
  let i = 0;
  if (p.magia) { blitSprite(i * 10, 36, 16, 16, E.mobj, MOBJ.mmagia, E.Pvirtual); i++; }
  if (p.armadura) { blitSprite(i * 10, 36, 16, 16, E.mobj, MOBJ.marmadura, E.Pvirtual); i++; }
  if (p.combate) { blitSprite(i * 10, 36, 16, 16, E.mobj, MOBJ.mcombate, E.Pvirtual); i++; }
}

// ---------------------------------------------------------------------------
// Tick (INT08.CC tic_handler + cuerpo de jugar())
// ---------------------------------------------------------------------------

// tic_handler: 1/s de hambre, cronómetro de puertas, crono de poderes
export function tickBookkeeping() {
  E.tic++;
  E.crono--;
  if (E.tic === TICS_SEG) {
    E.tic = 0;
    E.Tpuertas++;
    if (!E.play[0].level_end) E.play[0].energia--;
    if (!E.play[1].level_end) E.play[1].energia--;
  }
}

// gameTick: un frame del juego en el orden exacto de jugar()
// Devuelve null, o una promesa de finaliza_level (cambio de nivel en curso)
export function gameTick() {
  tickBookkeeping();
  copyBackgroundToScreen();                       // fondo antes que los sprites
  for (E.gn = 0; E.gn < E.max_gen; E.gn++) activateGenerator();
  movePlayers();
  if (E.play[0].H_s_m < 8) exitSequence(0);
  if (E.play[1].H_s_m < 8) exitSequence(1);
  initNube(); mueveNubes();
  updateCamera();
  if (E.marcador) drawHUD();
  if (E.Tpuertas === PUERTAS) openAllDoors();
  if (E.crono > -1) updateCrono();

  E.veces++;
  rotatePalette();

  if (E.play[0].energia <= 0) { E.play[0].H_x = E.play[0].H_y = 99999999; E.play[0].level_end = true; }
  if (E.play[1].energia <= 0) { E.play[1].H_x = E.play[1].H_y = 99999999; E.play[1].level_end = true; }
  if (E.play[0].level_end && E.play[1].level_end) return finalizeLevel();
  return null;
}
