// Enemigos — ENEMIGOS.CC completo (IA greedy, colisiones por cajas, explosiones)
import { MAX_X, MAX_Y, max_ene, rabia, SOLDADO, MAGO, FANTASMA, MUERTE,
         Pcombate_Max, Pcombate_Min, SOLx, SOLy, SPR } from './ctes.js';
import { E } from './estado.js';
import { blitSpriteClipped, blitSpriteShadowClipped } from './render.js';
import { mapIndexAt } from './mapa.js';
import { play, isPlaying, vibrar } from './sonido.js';

// HayInterseccion con la lógica asimétrica del C (elige la anchura del rectángulo
// cuyo x1/y1 es mayor)
export function hayInterseccion(rec1, rec2) {
  let AlturaMayor, AnchuraMayor;
  if (rec2.y1 > rec1.y1) AlturaMayor = rec1.y2 - rec1.y1;
  else AlturaMayor = rec2.y2 - rec2.y1;
  if (rec2.x1 > rec1.x1) AnchuraMayor = rec1.x2 - rec1.x1;
  else AnchuraMayor = rec2.x2 - rec2.x1;
  return (Math.abs(rec1.x1 - rec2.x1) < AnchuraMayor) && (Math.abs(rec1.y1 - rec2.y1) < AlturaMayor);
}

// dado(x,y,rec): punto estrictamente dentro del rectángulo
export function pointInRect(x, y, rec) {
  return (x > rec.x1) && (x < rec.x2) && (y > rec.y1) && (y < rec.y2);
}

// lectura segura de propiedad (el C lee fuera del array en los bordes del mapa)
function propAtSafe(i) {
  return (i >= 0 && i < E.ancho * E.alto) ? E.propiedad[i] : 0;
}

// init_personaje: parámetros por tipo + aleatorios iniciales
export function initEnemyType(n, tipo) {
  const e = E.enemigo[n];
  switch (tipo) {
    case MAGO:     e.tipo = MAGO; e.F_disparo = 15; e.F_cuerpo = 5;  e.energia = 10;  e.Fmax = 7; e.vel = 2; break;
    case SOLDADO:  e.tipo = SOLDADO; e.F_cuerpo = 12; e.energia = 20; e.Fmax = 7; e.vel = 3; break;
    case FANTASMA: e.tipo = FANTASMA; e.F_cuerpo = 30; e.energia = 20; e.Fmax = 7; e.vel = 4; break;
    case MUERTE:   e.tipo = MUERTE; e.F_cuerpo = 1; e.energia = 200; e.Fmax = 7; e.vel = 2; break;
  }
  e.secuencia = (Math.random() * 7) | 0;
  e.ultimo = 255;
  e.aburrido = 50;
  e.direccion = (Math.random() * 7) | 0;  // quirk del C: rand()%7 (0..6)
  e.s_m = 0;
}

// E_arriba/derecha/abajo/izquierda: movimiento + reversión si la baldosa del punto
// (X,Y) o la contigua en la dirección no está vacía
function E_arriba() {
  const e = E.enemigo[E.num];
  e.Y -= e.vel;
  const prop = mapIndexAt(e.X, e.Y);
  if (propAtSafe(prop) !== 0) { e.Y += e.vel; e.ultimo = 255; return; }
  if (propAtSafe(prop + 1) !== 0) { e.Y += e.vel; e.ultimo = 255; }
}
function E_derecha() {
  const e = E.enemigo[E.num];
  e.X += e.vel;
  const prop = mapIndexAt(e.X, e.Y);
  if (propAtSafe(prop + 1) !== 0) { e.X -= e.vel; e.ultimo = 255; return; }
  if (propAtSafe(prop + E.ancho) !== 0) { e.X -= e.vel; e.ultimo = 255; }
}
function E_abajo() {
  const e = E.enemigo[E.num];
  e.Y += e.vel;
  const prop = mapIndexAt(e.X, e.Y);
  if (propAtSafe(prop + E.ancho) !== 0) { e.Y -= e.vel; e.ultimo = 255; return; }
  if (propAtSafe(prop + 1) !== 0) { e.Y -= e.vel; e.ultimo = 255; }
}
function E_izquierda() {
  const e = E.enemigo[E.num];
  e.X -= e.vel;
  const prop = mapIndexAt(e.X, e.Y);
  if (propAtSafe(prop) !== 0) { e.X += e.vel; e.ultimo = 255; return; }
  if (propAtSafe(prop + E.ancho) !== 0) { e.X += e.vel; e.ultimo = 255; }
}

// desplazaE
export function desplazaE() {
  const d = E.enemigo[E.num].direccion;
  switch (d) {
    case 0: E_arriba(); break;
    case 1: E_derecha(); E_arriba(); break;
    case 2: E_derecha(); break;
    case 3: E_derecha(); E_abajo(); break;
    case 4: E_abajo(); break;
    case 5: E_izquierda(); E_abajo(); break;
    case 6: E_izquierda(); break;
    case 7: E_izquierda(); E_arriba(); break;
  }
}

// choque_entre_ellos: solape 13x13 con otro enemigo vivo
export function choqueEntreEllos() {
  const e = E.enemigo[E.num];
  const A = { x1: e.X, y1: e.Y, x2: e.X + 13, y2: e.Y + 13 };
  for (let i = 0; i < max_ene; i++) {
    if (i === E.num) continue;
    const o = E.enemigo[i];
    if (o.energia <= 0) continue;
    if (hayInterseccion(A, { x1: o.X, y1: o.Y, x2: o.X + 13, y2: o.Y + 13 })) return true;
  }
  return false;
}

// choque(n): enemigo vs jugador n, cajas 16x16, solo en pantalla (x>0, y>0 estrictos)
export function choque(n) {
  const e = E.enemigo[E.num];
  if (e.energia <= 0) return false;
  const x = e.X - E.absolutoX, y = e.Y - E.absolutoY;
  if ((x > 0) && (x < MAX_X) && (y > 0) && (y < MAX_Y)) {
    E.EL.x1 = e.X; E.EL.y1 = e.Y; E.EL.x2 = e.X + 16; E.EL.y2 = e.Y + 16;
    E.YO.x1 = E.play[n].H_x; E.YO.y1 = E.play[n].H_y;
    E.YO.x2 = E.YO.x1 + 16; E.YO.y2 = E.YO.y1 + 16;
    return hayInterseccion(E.YO, E.EL);
  }
  return false;
}

// choqueyo_el(n): melee del jugador (cajas 13x13) con daño y puntos
export function choqueYoEl(n) {
  const e = E.enemigo[E.num];
  if (e.energia <= 0) return false;
  const x = e.X - E.absolutoX, y = e.Y - E.absolutoY;
  if ((x > 0) && (x < MAX_X) && (y > 0) && (y < MAX_Y)) {
    E.EL.x1 = e.X; E.EL.y1 = e.Y; E.EL.x2 = e.X + 13; E.EL.y2 = e.Y + 13;
    E.YO.x1 = E.play[n].H_x; E.YO.y1 = E.play[n].H_y;
    E.YO.x2 = E.YO.x1 + 13; E.YO.y2 = E.YO.y1 + 13;
    if (hayInterseccion(E.YO, E.EL)) {
      if (e.tipo !== MUERTE) {
        if (E.play[n].combate) { e.energia -= Pcombate_Max; E.play[n].puntos += Pcombate_Max; }
        else { e.energia -= Pcombate_Min; E.play[n].puntos += Pcombate_Min; }
      }
      return true;
    }
  }
  return false;
}

// mueveE_aleatorio
export function enemyWander() {
  const e = E.enemigo[E.num];
  if (e.ultimo === 255) e.direccion = e.ultimo = (Math.random() * 8) | 0;
  e.aburrido = (e.aburrido + 1) & 0xFF;
  if (e.aburrido === 50) e.ultimo = 255;  // quirk: aburrido empieza en 50 y nunca vuelve
  desplazaE();
  if (choqueEntreEllos() || choque(0) || choque(1)) {
    e.secuencia = E.backs;
    e.X = E.backx; e.Y = E.backy;
    e.ultimo = 255;
  }
}

// quejarse: sonido aleatorio de daño, solo si no suena nada (resto_sample==0).
// Devuelve true si ha sonado el grito (para hacer la vibración más intensa).
function quejarse() {
  if (!isPlaying()) {
    const n = (Math.random() * 20) | 0;
    if (n >= 1 && n <= 3) {
      play('dado' + n);
      return true; // grito
    }
  }
  return false;
}

// compruebo_choquesE: daño por contacto según tipo
export function comprueboChoquesE() {
  const e = E.enemigo[E.num];
  if (choqueEntreEllos()) {
    e.secuencia = E.backs;
    e.X = E.backx; e.Y = E.backy;
    // (el C no toca ultimo aquí — la línea está comentada)
  }
  if (choque(0)) {
    const antes = E.play[0].energia;
    switch (e.tipo) {
      case SOLDADO:
      case MAGO:     if (E.veces % rabia === 0) E.play[0].energia -= (e.F_cuerpo - E.play[0].armadura); break;
      case FANTASMA: e.energia = 0; E.play[0].energia -= (e.F_cuerpo - E.play[0].armadura); break;
      case MUERTE:   play('electr'); E.play[0].energia -= e.F_cuerpo; e.energia--; break;
    }
    if (E.play[0].energia !== antes) {
      // golpe recibido: vibración; más intensa si suena el grito
      vibrar(quejarse() ? [60, 40, 150] : 45);
    }
    e.secuencia = E.backs;
    e.X = E.backx; e.Y = E.backy;
    e.ultimo = 255;
    return;
  }
  if (choque(1)) {
    const antes = E.play[1].energia;
    switch (e.tipo) {
      case SOLDADO:
      case MAGO:     if (E.veces % rabia === 0) E.play[1].energia -= (e.F_cuerpo - E.play[1].armadura); break;
      case FANTASMA: e.energia = 0; E.play[1].energia -= (e.F_cuerpo - E.play[1].armadura); break;
      case MUERTE:   play('electr'); E.play[1].energia -= e.F_cuerpo; e.energia--; break;
    }
    if (E.play[1].energia !== antes) {
      vibrar(quejarse() ? [60, 40, 150] : 45);
    }
    e.secuencia = E.backs;
    e.X = E.backx; e.Y = E.backy;
    e.ultimo = 255;
    return;
  }
}

// mueveE_ataca: IA greedy hacia el jugador más cercano (Manhattan)
export function enemyChase() {
  const e = E.enemigo[E.num];
  if (E.inmovil) return;

  let Vx = Math.abs(E.play[0].H_x - e.X), Vy = Math.abs(E.play[0].H_y - e.Y);
  let Rx = Math.abs(E.play[1].H_x - e.X), Ry = Math.abs(E.play[1].H_y - e.Y);
  let n = ((Vx + Vy) > (Rx + Ry)) ? 1 : 0;
  if (E.play[0].invisible) n = 1; else if (E.play[1].invisible) n = 0;
  if (E.play[n].invisible) { enemyWander(); return; }

  if (e.tipo === MAGO) {
    if (n === 0) { if ((Vx + Vy) > 200) { enemyWander(); return; } }
    else { if ((Rx + Ry) > 200) { enemyWander(); return; } }
    if (E.veces % rabia === 0) enemyShoot();
  }

  // fuera de la pantalla no se mueve
  const x = e.X - E.absolutoX, y = e.Y - E.absolutoY;
  if ((x < -16) || (x > MAX_X) || (y < -16) || (y > MAX_Y)) return;

  // dirección por celdas de 64 px, refinado a 4 px si coincide
  Vx = (E.play[n].H_x / 64) | 0; Rx = (e.X / 64) | 0;
  Vy = (E.play[n].H_y / 64) | 0; Ry = (e.Y / 64) | 0;
  if ((Vx === Rx) && (Vy === Ry)) {
    Vx = (E.play[n].H_x / 4) | 0; Rx = (e.X / 4) | 0;
    Vy = (E.play[n].H_y / 4) | 0; Ry = (e.Y / 4) | 0;
  }

  if (Vx > Rx) e.direccion = 2;
  else if (Vx < Rx) e.direccion = 6;   // si Vx==Rx la dirección anterior persiste (como el C)

  if (Vy > Ry) {
    if (e.direccion === 2) e.direccion = 3;
    else if (e.direccion === 6) e.direccion = 5;
    else e.direccion = 4;
  } else if (Vy < Ry) {
    if (e.direccion === 2) e.direccion = 1;
    else if (e.direccion === 6) e.direccion = 7;
    else e.direccion = 0;
  }

  if (E.play[n].repulsivo) { e.direccion += 4; if (e.direccion > 7) e.direccion -= 8; }
  desplazaE();
  comprueboChoquesE();
}

// mueveE
export function moveEnemy() {
  const e = E.enemigo[E.num];
  if (e.energia <= 0) return;
  E.backx = e.X; E.backy = e.Y; E.backs = e.secuencia;
  enemyChase();
  if ((e.X !== E.backx) || (e.Y !== E.backy)) e.secuencia = (e.secuencia + 1) & 0xFF;
}

// poneE: sprite o explosión
export function drawEnemy() {
  const e = E.enemigo[E.num];
  const x = e.X - E.absolutoX, y = e.Y - E.absolutoY;
  if ((x < -10) || (x > MAX_X) || (y < -10) || (y > MAX_Y)) return;
  if (e.energia <= 0) {
    if (e.s_m > 5) return;
    const base = (e.tipo === FANTASMA) ? SPR.explo_b : SPR.explo;
    blitSpriteClipped(x, y, 19, 16, E.anima, base + e.s_m * 304, E.Pvirtual);
    e.s_m++;
    return;
  }
  if (e.secuencia > e.Fmax) e.secuencia = 0;
  let base;
  switch (e.tipo) {
    case SOLDADO:  base = SPR.camHG; break;
    case MAGO:     base = SPR.camHA; break;
    case FANTASMA: base = SPR.camFT; break;
    case MUERTE:   base = SPR.camMT; break;
  }
  const off = base + 1352 * e.direccion + 169 * e.secuencia;
  blitSpriteShadowClipped(x + SOLx, y + SOLy, 13, 13, E.anima, off, E.Pvirtual);
  blitSpriteClipped(x, y, 13, 13, E.anima, off, E.Pvirtual);
}

// disparaE: el enemigo dispara si su slot de proyectil está libre
export function enemyShoot() {
  const e = E.enemigo[E.num];
  if (e.D_d === 255) {
    play('disparo');
    e.D_d = e.direccion;
    e.D_x = e.X; e.D_y = e.Y; e.D_r = 0;
  }
}
