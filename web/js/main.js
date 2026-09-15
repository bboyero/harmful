// Boot, máquina de estados y bucle rAF con acumulador a 18,2065 Hz
// (main() + jugar() de JUEGO.CC; el busy-wait del PIT se sustituye por paso fijo)
//
// Como en main() del C: creditos() -> sb_play(trampa) -> bucle switch(menu()):
//   0 = jugar (start.dac + poneabc -> nivel 1), 2 = ayuda, 3 = salir.
// Al acabar la partida jugar() devuelve y se vuelve a menu().
import { TICK_MS, SC_ESC, SC_ENTER } from './ctes.js';
import { E } from './estado.js';
import { fetchAssets } from './assets.js';
import { initPalette, applyPalette, paletteToGray, restorePalette } from './paleta.js';
import { present, resizeCanvas, cargarBezel } from './render.js';
import { initKeyboard } from './entrada.js';
import { initTouch, recolocarControles } from './entrada-tactil.js';
import { initLevel } from './nivel.js';
import { gameTick, initPlayers } from './juego.js';
import { drawTextBig } from './fuente.js';
import { cargarMenus, creditos, menu, startScreen, ayuda, salir, modo, modoActual } from './menu.js';
import { loadSounds, play } from './sonido.js';

const params = new URLSearchParams(location.search);
const LEVEL_INICIAL = parseInt(params.get('mapa'), 10) || 1;

let estado = 'CARGA';   // CARGA | CREDITOS | MENU | START | AYUDA | SALIR | INTRO | JUEGO | FIN
let introHasta = 0;
let finHasta = 0;       // FIN: a partir de cuándo se acepta ENTER/tap
let tapStart = false;   // tap sobre la pantalla (volver al menú en FIN)
let wrapEl = null;
let finJuego = null;    // promesa de jugar() resuelta al acabar la partida

function setEstado(nuevo) {
  estado = nuevo;
  // los controles táctiles viven en la capa #tcontroles (fuera de #wrap):
  // las clases de visibilidad van en body para que los selectores CSS
  // (.en-juego #tpad ...) sigan funcionando
  document.body.classList.toggle('en-juego', nuevo === 'INTRO' || nuevo === 'JUEGO');
  document.body.classList.toggle('en-menu', nuevo === 'MENU' || nuevo === 'MODO');
  if (wrapEl) {
    wrapEl.classList.toggle('en-juego', nuevo === 'INTRO' || nuevo === 'JUEGO');
    wrapEl.classList.toggle('en-menu', nuevo === 'MENU' || nuevo === 'MODO');
    if (nuevo === 'INTRO' || nuevo === 'JUEGO') recolocarControles();
  }
}

function drawFin(mensaje) {
  E.Pvirtual.fill(0);
  drawTextBig(190, 170, mensaje, E.Pvirtual, 15);
  present();
}

// Al salir de jugar(): to_gray + pon_paleta, delay(125) y risa (como el C)
function entrarFin(mensaje) {
  setEstado('FIN');
  paletteToGray();
  applyPalette();
  drawFin(mensaje);
  setTimeout(() => play('risa'), 125);
  finHasta = performance.now() + 900; // margen para ver el mensaje antes de aceptar input
  tapStart = false;
}

// FIN -> MENU: como volver de jugar() al bucle de main() del C
function salirFin() {
  E.keys[SC_ENTER] = 0;
  if (finJuego) { const f = finJuego; finJuego = null; f(); }
}

// jugar(): promesa que se resuelve cuando la partida acaba (FIN + ENTER/tap)
function jugar() {
  return new Promise((res) => { finJuego = res; });
}

async function reiniciar() {
  E.keys.fill(0);
  E.veces = 0; E.tic = 0; E.Tpuertas = 0; E.crono = -1;
  E.marcador = 1; E.inmovil = E.inmune = false; E.rota = 0; E.rota_s = 0;
  E.gameOverFlag = false;
  restorePalette(); // paleta del juego (la de los .DAC no debe pasar a la partida)
  // orden de niveles: normal (1..15) o aleatorio (los 15 barajados, cada uno una vez)
  E.levelList = null;
  E.level_ac = LEVEL_INICIAL - 1;
  if (modoActual() === 'aleatorio') {
    const lista = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    for (let i = lista.length - 1; i > 0; i--) { // Fisher-Yates
      const j = (Math.random() * (i + 1)) | 0;
      [lista[i], lista[j]] = [lista[j], lista[i]];
    }
    E.levelList = lista;
    E.level_ac = 0; // empezar por el principio de la baraja
  }
  try {
    await initLevel();
  } catch (err) {
    console.error(err);
    entrarFin('ERROR');
    return;
  }
  initPlayers();
  introHasta = performance.now() + 3000; // splash 2 s + delay 1 s (como el C)
  setEstado('INTRO');
}

// bucle de main() del C: creditos -> trampa -> switch(menu())
async function bucleMenus() {
  setEstado('CREDITOS');
  await creditos();
  play('trampa');
  while (true) {
    setEstado('MENU');
    const op = await menu();
    if (op === 0) {
      setEstado('START');
      await startScreen();
      await reiniciar(); // INTRO -> JUEGO (el bucle rAF se encarga)
      await jugar();     // espera a que acabe la partida
    } else if (op === 1) {
      setEstado('MODO');
      await modo();
    } else if (op === 2) {
      setEstado('AYUDA');
      await ayuda();
    } else {
      setEstado('SALIR');
      await salir();
    }
  }
}

// Errores visibles en pantalla (una excepción en el boot o en los menús dejaba
// la pantalla negra sin pistas)
function mostrarError(msg) {
  document.title = 'HARMFUL — error';
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;'
    + 'color:#f44;background:#000;font:14px monospace;z-index:99;text-align:center;'
    + 'padding:16px;box-sizing:border-box;white-space:pre-wrap;';
  d.textContent = 'ERROR:\n' + msg;
  document.body.appendChild(d);
}

async function boot() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  initKeyboard();
  try {
    initTouch(); // solo hace algo en dispositivos táctiles
  } catch (err) {
    // los controles táctiles son un extra: un fallo aquí no debe matar el juego
    console.error('Error en controles táctiles:', err);
  }
  // PWA: cacheo offline (falla silenciosamente si no hay service worker)
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
    // Al actualizar la app, el SW nuevo toma el control (skipWaiting+claim) y
    // la página se recarga sola con los archivos nuevos. Sin esto, la primera
    // carga tras actualizar muestra la versión ANTERIOR por la caché.
    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
  }
  try {
    await fetchAssets();
  } catch (err) {
    console.error('No se pudieron cargar los assets. Sirve la carpeta web/ con un servidor estático:', err);
    mostrarError('No se pudieron cargar los assets.\nSirve la carpeta web/ con un servidor estático: python -m http.server 8000');
    return;
  }
  initPalette();
  applyPalette();
  cargarBezel().catch(() => {}); // bezel personalizado opcional (assets/bezel.png)
  await loadSounds(); // sin SONIDO.DAT el juego sigue mudo (no es crítico)
  await cargarMenus(); // .DAC de menús + fuente ABC
  wrapEl = document.getElementById('wrap');
  if (wrapEl) {
    wrapEl.addEventListener('pointerdown', () => { tapStart = true; });
  }
  bucleMenus().catch((err) => {
    console.error('Error en menús:', err);
    mostrarError('Error en menús: ' + (err && err.message ? err.message : err));
  });
  requestAnimationFrame(frame);
}

let last = performance.now();
let acc = 0;

function frame(now) {
  if (estado === 'INTRO') {
    present(); // el splash ya está dibujado en Pvirtual
    if (now >= introHasta) { setEstado('JUEGO'); last = now; acc = 0; }
  } else if (estado === 'JUEGO') {
    acc += Math.min(now - last, 250); // clamp anti "espiral de la muerte"
    last = now;
    while (acc >= TICK_MS) {
      acc -= TICK_MS;
      const pendiente = gameTick();
      if (pendiente) { // cambio de nivel en curso: pausa hasta que cargue
        estado = 'CARGA';
        pendiente.then(() => {
          introHasta = performance.now() + 2000; // delay(2000) de init_level
          setEstado('INTRO');
        }).catch((err) => {
          entrarFin('FIN'); // no hay más niveles
          console.error(err);
        });
        break;
      }
      if (E.keys[SC_ESC]) {
        E.keys[SC_ESC] = 0;
        entrarFin(E.gameOverFlag ? 'GAME OVER' : 'FIN');
        break;
      }
    }
    present();
  } else if (estado === 'FIN') {
    if (performance.now() >= finHasta && (E.keys[SC_ENTER] || tapStart)) {
      tapStart = false;
      salirFin();
    }
  }

  requestAnimationFrame(frame);
}

boot();
