// Menús y pantallas del original (creditos/menu/ayuda de JUEGO.CC + DAC2PTR/
// menu2SVGA/putico/poneabc/black_hole de SVGA.CC/FX.CC), en modo 0x101 (640x480).
// Los .DAC son 640x480 RLE con paleta de 768 B al final.
// Como en main() del C: creditos() -> sb_play(trampa) -> bucle switch(menu()).
import { SC_ARR, SC_ABJ, SC_ENTER, SC_ESC, MAX_X } from './ctes.js';
import { E } from './estado.js';
import { loadDAC, loadRaw } from './assets.js';
import { applyPalette, paletteToBlack, setLutColor } from './paleta.js';
import { presentBuf, blitSprite } from './render.js';
import { miniEscala } from './fuente.js';
import { vibrar, reintentarMusica } from './sonido.js';

const MENU_W = 640, MENU_H = 480;

const Pmenus = new Uint8Array(MENU_W * MENU_H); // Pmenus del C
let DACs = {};
let abcFNT = null;

// tap sobre la pantalla = ENTER (el C no tenía táctil; los botones ▲▼ hacen
// stopPropagation para no contar como tap). Se guarda la posición en coords de
// canvas 640x480 para poder elegir opción tocándola directamente.
let tap = null; // {x, y} o null
const wrap = document.getElementById('wrap');
if (wrap) wrap.addEventListener('pointerdown', (e) => {
  const r = wrap.getBoundingClientRect();
  const escala = r.width / MENU_W;
  tap = { x: (e.clientX - r.left) / escala, y: (e.clientY - r.top) / escala };
  // pulso táctil en los menús, como el teclado de un móvil (15 ms; en
  // partida no: ahí ya vibran los golpes)
  if (!document.body.classList.contains('en-juego')) vibrar(15);
  reintentarMusica(); // el primer toque desbloquea la música si el autoplay la frenó
});

// (El menú usa solo el arte original: sin etiquetas superpuestas. La selección
// táctil es tocando la fila de la opción.)

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

// carga de los .DAC de menú + fuente ABC (el texto de la intro)
export async function cargarMenus() {
  const nombres = ['OVERFLOW.DAC', 'HARMFUL.DAC', 'BICHO.DAC', 'MENU1.DAC', 'AYUDA.DAC', 'START.DAC', 'MODO.DAC', 'INTRO.DAC', 'GAMEOVER.DAC'];
  const cargas = await Promise.all(nombres.map(loadDAC));
  for (let i = 0; i < nombres.length; i++) DACs[nombres[i]] = cargas[i];
  abcFNT = await loadRaw('ABC.FNT');
}

// Imagen del game over (GAMEOVER.DAC, 640x400, desde gameover.png) para
// pintarla en Pvirtual desde main.js (la paleta gris del FIN la apaga igual
// que al texto del original)
export function gameOverPix() {
  return DACs['GAMEOVER.DAC'] ? DACs['GAMEOVER.DAC'].pix : null;
}

// to_black(): negro total (paleta + imagen)
function negro() {
  paletteToBlack();
  applyPalette();
  Pmenus.fill(0);
}

// DAC2PTR + menu2SVGA: imagen y paleta del .DAC
function mostrarDAC(nombre) {
  const d = DACs[nombre];
  Pmenus.set(d.pix);
  E.paleta.set(d.pal);
  applyPalette();
}

// fade desde negro hasta la paleta actual (el fade_to que el C llamaba y que
// quedaba a medias; aquí se ve de verdad)
async function fundir(ms) {
  const p = E.paleta;
  const t0 = performance.now();
  while (true) {
    const k = Math.min(1, (performance.now() - t0) / ms);
    for (let i = 0; i < 256; i++)
      setLutColor(i, p[i * 3] * k, p[i * 3 + 1] * k, p[i * 3 + 2] * k);
    presentBuf(Pmenus, MENU_W, MENU_H);
    if (k >= 1) return;
    await dormir(16);
  }
}

// (El efecto black_hole del original — rotación de paleta al elegir opción —
// se eliminó a petición de Borja: la transición es inmediata.)

// creditos(): OVERFLOW (1 s) -> HARMFUL (500 ms) -> BICHO (1 s), negro entre medias
export async function creditos() {
  mostrarDAC('OVERFLOW.DAC'); await fundir(400); await dormir(1000);
  negro();
  mostrarDAC('HARMFUL.DAC'); await fundir(400); await dormir(500);
  negro();
  mostrarDAC('BICHO.DAC'); await fundir(400); await dormir(1000);
  negro();
}

// (Los botones táctiles ▲▼ del menú se eliminaron: en táctil se elige la
// opción tocándola directamente; el teclado sigue con ARR/ABJ/ENTER.)

// menu(): menu1.dac con cursor animado. ARR/ABJ mueven la opción, ENTER elige,
// ESC = SALIR (como el C). Devuelve la opción 0..3 tras el black_hole.
// Solo el arte original: sin etiquetas ni botones superpuestos. En táctil se
// elige tocando la fila de la opción directamente (el teclado sigue igual).
export function menu() {
  return new Promise((resolve) => {
    tap = null; // descarta toques pendientes (p. ej. el tap que salió del FIN:
    // si no, ese mismo toque elegía una opción al instante y el menú ni se veía)
    mostrarDAC('MENU1.DAC');
    let op = 0;

    function paso(now) {
      if (E.keys[SC_ABJ]) { E.keys[SC_ABJ] = 0; op++; if (op > 3) op = 0; }
      else if (E.keys[SC_ARR]) { E.keys[SC_ARR] = 0; op--; if (op < 0) op = 3; }

      Pmenus.set(DACs['MENU1.DAC'].pix);
      if (modoActual() === 'aleatorio') miniEscala(20, 437, 'MODO: ALEATORIO', Pmenus, 2, 15);
      presentBuf(Pmenus, MENU_W, MENU_H);

      if (E.keys[SC_ESC]) { E.keys[SC_ESC] = 0; op = 3; E.keys[SC_ENTER] = 1; }
      if (E.keys[SC_ENTER] || tap) {
        if (tap && !E.keys[SC_ENTER]) {
          // tap sobre una fila: zonas alineadas con los rótulos del NUEVO
          // arte (New Game ~121-128, Options ~161-204, Help ~262-292,
          // Quit ~345-386; el título está en 68-113). Fronteras a medio
          // camino entre rótulos.
          const F = [153, 229, 321];
          op = tap.y < F[0] ? 0 : tap.y < F[1] ? 1 : tap.y < F[2] ? 2 : 3;
        }
        E.keys[SC_ENTER] = 0;
        tap = null;
        resolve(op); // transición inmediata (sin black_hole)
        return;
      }
      requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  });
}

// Pantalla de intro: arte nuevo (INTRO.DAC, desde intro.png) + el texto ABC
// del original letra a letra encima, como el start.dac de antes.
export async function startScreen() {
  const lineas = [
    'Hello intrepid warrior{ Are you',
    'ready for rescue to the princess',
    'Leia from the Dark Castle?',
    'Them come on||||',
  ];
  mostrarDAC('INTRO.DAC');
  presentBuf(Pmenus, MENU_W, MENU_H);
  let nodelay = false;
  for (let l = 0; l < lineas.length; l++) {
    nodelay = await ponerLinea(l, lineas[l], nodelay);
  }
  await dormir(500); // delay(500) del C
}

// poneabc línea a línea (SVGA.CC): glifos 16x16 de la fuente ABC a partir del
// ASCII '0'; letra a letra con delay(400-rand()%3*130) o al instante si nodelay
async function ponerLinea(l, linea, nodelay) {
  let ya = nodelay;
  for (let lon = 0; lon < linea.length; lon++) {
    for (let i = 0; i < 128; i++) if (E.keys[i]) ya = true;
    if (tap) { tap = null; ya = true; } // en táctil no hay teclas: el tap acelera
    if (!ya) await dormir(400 - ((Math.random() * 3) | 0) * 130);
    const X = 50, Y = 100 + l * 20;
    blitSprite(X + lon * 16, Y, 16, 16, abcFNT, (linea.charCodeAt(lon) - 48) * 256, Pmenus);
    presentBuf(Pmenus, MENU_W, MENU_H);
  }
  return ya;
}

// ayuda(): pantalla de ayuda, ESC (o tap) para volver al menú
export function ayuda() {
  return new Promise((resolve) => {
    mostrarDAC('AYUDA.DAC');
    presentBuf(Pmenus, MENU_W, MENU_H);
    function paso() {
      if (E.keys[SC_ESC] || tap) { E.keys[SC_ESC] = 0; tap = null; resolve(); return; }
      requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  });
}

// SALIR: en el C terminaba el programa imprimiendo los créditos (main()).
// Aquí los mostramos en pantalla y ENTER (o tap) vuelve al menú.
// Los textos a MINI x3: la MINI 1x del original es ilegible en pantallas
// modernas (fuente condensada de 3-4 px).
export function salir() {
  return new Promise((resolve) => {
    Pmenus.fill(0);
    E.paleta.set(E.paletaBack); // paleta del juego para el texto
    applyPalette();
    miniEscala(140, 170, 'Graficos: Borja Boyero', Pmenus, 3, 15);
    miniEscala(140, 215, '(c)Borja Boyero. 1996-97', Pmenus, 3, 15);
    miniEscala(140, 270, 'PULSA ENTER PARA VOLVER', Pmenus, 3, 15);
    presentBuf(Pmenus, MENU_W, MENU_H);
    function paso() {
      if (E.keys[SC_ENTER] || tap) { E.keys[SC_ENTER] = 0; tap = null; resolve(); return; }
      requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  });
}

// MODO DE JUEGO (la opción 1 del menú, "2 JUGADORES" en el arte, era un case
// muerto en el C): NORMAL (1..15 en orden) o ALEATORIO (los 15 barajados).
// Se guarda en localStorage: persiste entre sesiones también en la app Android.
const MODO_KEY = 'harmful-modo';

export function modoActual() {
  try { return localStorage.getItem(MODO_KEY) === 'aleatorio' ? 'aleatorio' : 'normal'; } catch (e) { return 'normal'; }
}

export function modo() {
  return new Promise((resolve) => {
    // Pantalla de modo con el arte propio (MODO.DAC, generado desde modo.png
    // como MENU1.DAC): NORMAL en y~185-200 y ALEATORIO en y~281-303.
    mostrarDAC('MODO.DAC');
    let op = modoActual() === 'aleatorio' ? 1 : 0;

    function paso() {
      presentBuf(Pmenus, MENU_W, MENU_H);
      if (E.keys[SC_ABJ]) { E.keys[SC_ABJ] = 0; op = 1; }
      else if (E.keys[SC_ARR]) { E.keys[SC_ARR] = 0; op = 0; }
      if (E.keys[SC_ESC]) { E.keys[SC_ESC] = 0; tap = null; resolve(); return; }
      if (E.keys[SC_ENTER] || tap) {
        if (tap && !E.keys[SC_ENTER]) {
          // tap sobre la opción: NORMAL arriba, ALEATORIO abajo (frontera 240)
          op = tap.y < 240 ? 0 : 1;
        }
        E.keys[SC_ENTER] = 0;
        tap = null;
        try { localStorage.setItem(MODO_KEY, op === 1 ? 'aleatorio' : 'normal'); } catch (e) {}
        resolve();
        return;
      }
      requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  });
}
