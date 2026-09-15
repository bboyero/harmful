// Controles táctiles para móvil: cruceta analógica de 8 direcciones + botones
// DISPARO y POCIÓN. Alimentan la misma KeyTable que el teclado, así que el
// juego no cambia. Solo se activan en dispositivos táctiles (o ?touch=1).
//
// La cruceta es un único pad circular: la dirección sale de la posición del
// dedo respecto al centro (8 sectores de 45° con zona muerta e histéresis),
// así las diagonales son naturales — no hay que acertar a dos botones a la
// vez. Cada dedo captura su pointer, por lo que cruceta y disparo funcionan
// a la vez (multitáctil).
import { SC_DER, SC_IZQ, SC_ARR, SC_ABJ, SC_SPC, SC_CERO, SC_ESC } from './ctes.js';
import { E } from './estado.js';

const MUERTA = 0.18;        // zona muerta central (fracción del radio)
const SECTOR = Math.PI / 4; // 45° por sector
const HIST = Math.PI / 20;  // histéresis (9°) al cruzar de sector

const norm = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

// main.js la llama al entrar en partida: al volver de los menús (canvas 480->400)
// no hay evento resize y las posiciones de los márgenes quedarían desfasadas
let recolocarGlobal = null;
export function recolocarControles() { if (recolocarGlobal) recolocarGlobal(); }

// sector -> scancodes activos. En pantalla y crece hacia abajo, así que el
// ángulo positivo es hacia abajo: 0=derecha, 2=abajo, -2=arriba, ±4=izquierda.
const DIRS = {
  0: [SC_DER],         1: [SC_DER, SC_ABJ],
  2: [SC_ABJ],         3: [SC_IZQ, SC_ABJ],
  4: [SC_IZQ],        '-1': [SC_DER, SC_ARR],
  '-2': [SC_ARR],     '-3': [SC_IZQ, SC_ARR],
};

export function initTouch() {
  let esTactil = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  try { esTactil = esTactil || new URLSearchParams(location.search).has('touch'); } catch (e) {}
  if (!esTactil) return;

  const wrap = document.getElementById('wrap');
  if (!wrap) return;
  wrap.classList.add('touch-on');
  wrap.addEventListener('contextmenu', (e) => e.preventDefault()); // sin menú de pulsación larga

  // Los controles son hijos de #wrap, SIEMPRE dentro de su caja: el canvas del
  // juego se ensancha con bandas laterales (render.js) y los controles viven
  // dentro de esas bandas — nunca fuera del canvas (en móviles reales el
  // compositor recorta todo lo que salga de su caja).
  // --- Cruceta analógica ---
  const pad = document.createElement('div');
  pad.id = 'tpad';
  pad.className = 'tbtn';
  const knob = document.createElement('div');
  knob.className = 'knob';
  pad.appendChild(knob);
  wrap.appendChild(pad);

  let puntero = null; // pointerId activo en la cruceta
  let sector = null;  // sector actual (null = neutral)

  const aplicar = (nuevo) => {
    sector = nuevo;
    const activas = nuevo === null ? [] : DIRS[nuevo];
    for (const sc of [SC_DER, SC_IZQ, SC_ARR, SC_ABJ]) E.keys[sc] = activas.includes(sc) ? 1 : 0;
    pad.classList.toggle('activo', nuevo !== null);
  };

  const mover = (e) => {
    const r = pad.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = e.clientX - cx, dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    const maxR = r.width / 2;

    // el pomo sigue al dedo (limitado al 55% del radio para que no se salga)
    const t = dist > 0 ? Math.min(dist, maxR * 0.55) : 0;
    knob.style.transform = `translate(calc(-50% + ${(dx / dist || 0) * t}px), calc(-50% + ${(dy / dist || 0) * t}px))`;

    if (dist < maxR * MUERTA) { if (sector !== null) aplicar(null); return; }

    const angulo = Math.atan2(dy, dx);
    let nuevo = Math.round(angulo / SECTOR); // -4..4
    if (nuevo === -4) nuevo = 4;             // -π y π son la misma dirección
    if (nuevo !== sector) {
      // histéresis: al borde entre sectores no cambiar hasta entrar con margen
      if (sector !== null && Math.abs(norm(angulo - nuevo * SECTOR)) >= SECTOR / 2 - HIST) return;
      aplicar(nuevo);
    }
  };

  const soltar = (e) => {
    if (e.pointerId !== puntero) return;
    e.preventDefault();
    puntero = null;
    knob.style.transform = 'translate(-50%, -50%)';
    aplicar(null);
  };

  pad.addEventListener('pointerdown', (e) => {
    if (puntero !== null) return;
    e.preventDefault();
    try { pad.setPointerCapture(e.pointerId); } catch (err) {}
    puntero = e.pointerId;
    mover(e);
  });
  pad.addEventListener('pointermove', (e) => { if (e.pointerId === puntero) mover(e); });
  pad.addEventListener('pointerup', soltar);
  pad.addEventListener('pointercancel', soltar);

  // --- Botones independientes (multitáctil con la cruceta) ---
  // tsalir = tecla ESC del C: salir de la partida al FIN (sin teclado en móvil)
  const botones = [
    ['tfire',  SC_SPC,  '●'],
    ['tpot',   SC_CERO, 'P'],
    ['tsalir', SC_ESC,  'ESC'],
  ];
  for (const [id, scancode, label] of botones) {
    const b = document.createElement('div');
    b.id = id;
    b.className = 'tbtn';
    b.textContent = label;
    wrap.appendChild(b);

    const press = (e) => {
      e.preventDefault();
      try { b.setPointerCapture(e.pointerId); } catch (err) {}
      E.keys[scancode] = 1;
    };
    const release = (e) => { e.preventDefault(); E.keys[scancode] = 0; };
    b.addEventListener('pointerdown', press);
    b.addEventListener('pointerup', release);
    b.addEventListener('pointercancel', release);
    b.addEventListener('pointerleave', release); // deslizar el dedo fuera suelta la tecla
  }

  // Posiciona los controles SIEMPRE DENTRO de #wrap (el canvas con sus
  // franjas): no depende del viewport ni de los insets del dispositivo.
  // El canvas del juego mide 840x400 con el juego en el centro (render.js),
  // así que la banda por lado = (wrap.width - wrap.height*1.6)/2.
  function colocarControles() {
    const padEl = document.getElementById('tpad');
    if (!padEl) return;
    const r = wrap.getBoundingClientRect();
    const gW = r.height * 1.6;                        // ancho del área de juego
    const banda = Math.max(0, (r.width - gW) / 2);    // franja por lado (CSS px)

    // recorta a la caja de #wrap: SIEMPRE dentro, nunca fuera
    const colocar = (el, x, y, w, h) => {
      el.style.left = Math.max(0, Math.min(x, r.width - w)) + 'px';
      el.style.top = Math.max(0, Math.min(y, r.height - h)) + 'px';
    };

    if (banda >= 40) {
      // franjas útiles (apaisado): cruceta en la franja izquierda, pila en la
      // derecha — dentro del canvas, sin tapar el juego
      const tam = Math.min(banda - 12, r.height * 0.4, 170);
      padEl.style.width = tam + 'px';
      colocar(padEl, (banda - tam) / 2, (r.height - tam) / 2, tam, tam);

      const fire = document.getElementById('tfire');
      const pot = document.getElementById('tpot');
      const salir = document.getElementById('tsalir');
      // botones CIRCULARES (a juego con la bola de la cruceta): disparo el
      // mayor, poción 0.8x, ESC 0.55x; ESC arriba del todo y separado del
      // grupo poción+disparo
      const fireD = Math.min(banda - 12, 150, r.height * 0.35);
      const potD = fireD * 0.8;
      const salirD = fireD * 0.55;
      const cx = r.width - banda / 2; // centro de la franja derecha (rel. a #wrap)
      // ESC arriba del todo
      salir.style.width = salir.style.height = salirD + 'px';
      colocar(salir, cx - salirD / 2, r.height * 0.04, salirD, salirD);
      salir.style.fontSize = (salirD * 0.32) + 'px';
      // poción + disparo agrupados ABAJO (ESC queda arriba del todo)
      const grupo = fireD + potD + 14;
      const yGrupo = r.height - grupo - 8;
      pot.style.width = pot.style.height = potD + 'px';
      colocar(pot, cx - potD / 2, yGrupo, potD, potD);
      pot.style.fontSize = (potD * 0.42) + 'px';
      fire.style.width = fire.style.height = fireD + 'px';
      colocar(fire, cx - fireD / 2, yGrupo + potD + 14, fireD, fireD);
      fire.style.fontSize = (fireD * 0.42) + 'px';
    } else {
      // sin franjas (vertical): encima del juego, dentro del área central
      const x0 = banda; // inicio del área de juego dentro del wrap
      const tam = gW * 0.28;
      padEl.style.width = tam + 'px';
      colocar(padEl, x0 + gW * 0.07, r.height * 0.52, tam, tam);

      const fire = document.getElementById('tfire');
      const pot = document.getElementById('tpot');
      const salir = document.getElementById('tsalir');
      const bw = gW * 0.15, bh = r.height * 0.24;
      colocar(fire, x0 + gW * 0.80, r.height * 0.64, bw, bh);
      fire.style.width = bw + 'px'; fire.style.height = bh + 'px';
      fire.style.fontSize = '';
      const pw2 = gW * 0.11, ph2 = r.height * 0.17;
      colocar(pot, x0 + gW * 0.66, r.height * 0.74, pw2, ph2);
      pot.style.width = pw2 + 'px'; pot.style.height = ph2 + 'px';
      pot.style.fontSize = '';
      const sw2 = gW * 0.10, sh2 = r.height * 0.07;
      colocar(salir, x0 + gW * 0.87, r.height * 0.02, sw2, sh2);
      salir.style.width = sw2 + 'px'; salir.style.height = sh2 + 'px';
      salir.style.fontSize = '';
    }
  }
  recolocarGlobal = colocarControles;
  colocarControles();
  window.addEventListener('resize', colocarControles);
  window.addEventListener('orientationchange', colocarControles);
}
