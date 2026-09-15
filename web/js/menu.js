// Menús y pantallas del original (creditos/menu/ayuda de JUEGO.CC + DAC2PTR/
// menu2SVGA/putico/poneabc/black_hole de SVGA.CC/FX.CC), en modo 0x101 (640x480).
// Los .DAC son 640x480 RLE con paleta de 768 B al final.
// Como en main() del C: creditos() -> sb_play(trampa) -> bucle switch(menu()).
import { SC_ARR, SC_ABJ, SC_ENTER, SC_ESC, MAX_X } from './ctes.js';
import { E } from './estado.js';
import { loadDAC, loadRaw } from './assets.js';
import { applyPalette, paletteToBlack, setLutColor } from './paleta.js';
import { presentBuf, blitSprite } from './render.js';
import { drawTextBig, medirTextBig, drawTextMini, miniEscala, caja, lumPaleta } from './fuente.js';

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
});

// Etiqueta de opción legible: caja de contraste + texto MINI x2. La fila
// seleccionada se invierte (caja clara/texto oscuro).
function etiqueta(X, Y, texto, dst, seleccionada, oscuro, claro) {
  const w = texto.length * 10 - 2;
  const cajaColor = seleccionada ? claro : oscuro;
  const tinta = seleccionada ? oscuro : claro;
  caja(X - 6, Y - 4, w + 12, 24, dst, cajaColor);
  miniEscala(X, Y, texto, dst, 2, tinta);
}

// (El menú usa solo el arte original: sin etiquetas superpuestas. La selección
// táctil es tocando la fila de la opción.)

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

// carga de los .DAC de menú + fuente ABC (cargaFNT: 80 glifos 16x16 a partir de '0')
export async function cargarMenus() {
  const nombres = ['OVERFLOW.DAC', 'HARMFUL.DAC', 'BICHO.DAC', 'MENU1.DAC', 'AYUDA.DAC', 'START.DAC'];
  const cargas = await Promise.all(nombres.map(loadDAC));
  for (let i = 0; i < nombres.length; i++) DACs[nombres[i]] = cargas[i];
  abcFNT = await loadRaw('ABC.FNT');
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

// Pantalla de jugar(): start.dac + texto de intro (poneabc), 500 ms y al juego
export async function startScreen() {
  const lineas = [
    'Hello intrepid warrior{ Are you',
    'ready for rescue to the princess',
    'Leia from the Dark Castle?',
    'Them come on||||',
  ];
  mostrarDAC('START.DAC');
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
export function salir() {
  return new Promise((resolve) => {
    Pmenus.fill(0);
    E.paleta.set(E.paletaBack); // paleta del juego para el texto
    applyPalette();
    drawTextMini(140, 170, 'Graficos: Borja Boyero', Pmenus);
    drawTextMini(140, 210, '(c)Borja Boyero. 1996-97', Pmenus);
    drawTextMini(140, 250, 'PULSA ENTER PARA VOLVER', Pmenus);
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
    Pmenus.fill(0);
    E.paleta.set(E.paletaBack);
    applyPalette();
    const [oscuro, claro] = lumPaleta();
    let op = modoActual() === 'aleatorio' ? 1 : 0;

    const dibujar = () => {
      Pmenus.fill(0);
      drawTextBig((MAX_X - medirTextBig('MODO')) / 2 | 0, 60, 'MODO', Pmenus, 15);
      for (let i = 0; i < 2; i++) {
        const y = 180 + i * 80;
        etiqueta(170, y - 4, (op === i ? '> ' : '  ') + (i === 0 ? 'NORMAL' : 'ALEATORIO'), Pmenus, op === i, oscuro, claro);
        miniEscala(170, y + 22, i === 0 ? 'Niveles 1 a 15 en orden' : 'Los 15 niveles barajados', Pmenus, 2, claro);
      }
      const pista = wrap && wrap.classList.contains('touch-on')
        ? 'TOCA UNA OPCION PARA ELEGIRLA'
        : 'PULSA ENTER PARA ELEGIR, ESC PARA VOLVER';
      miniEscala((MAX_X - pista.length * 10) / 2 | 0, 424, pista, Pmenus, 2, claro);
      presentBuf(Pmenus, MENU_W, MENU_H);
    };
    dibujar();

    function paso() {
      if (E.keys[SC_ABJ]) { E.keys[SC_ABJ] = 0; op = 1; dibujar(); }
      else if (E.keys[SC_ARR]) { E.keys[SC_ARR] = 0; op = 0; dibujar(); }
      if (E.keys[SC_ESC]) { E.keys[SC_ESC] = 0; tap = null; resolve(); return; }
      if (E.keys[SC_ENTER] || tap) {
        if (tap && !E.keys[SC_ENTER]) {
          // tap sobre una de las dos opciones (filas centradas en 180 y 260)
          if (tap.y >= 140 && tap.y < 220) op = 0;
          else if (tap.y >= 220 && tap.y < 300) op = 1;
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
