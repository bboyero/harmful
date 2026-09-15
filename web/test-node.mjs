// Prueba de humo con Node: stubs de DOM + fetch desde disco, carga real de assets
// y simulación de 200 ticks del juego. Uso:
//   node test-node.mjs   (desde web/)
import fs from 'node:fs';
import path from 'node:path';

// ---- stubs de navegador (antes de importar nada) ----
// Determinismo: el juego usa Math.random (nubes, objetos ALEATORIO) y las nubes
// pueden tapar la bola del disparo, haciendo flaky el check de 27 px. LCG fijo.
let semilla = 20260912;
Math.random = () => {
  semilla = (semilla * 1103515245 + 12345) & 0x7fffffff;
  return semilla / 0x7fffffff;
};
const fakeCtx = {
  createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
  putImageData: () => {},
};
globalThis.document = {
  getElementById: () => ({
    getContext: () => fakeCtx,
    style: {},
    width: 640, height: 400,
  }),
};
globalThis.window = { addEventListener: () => {}, innerWidth: 1280, innerHeight: 800 };
globalThis.getComputedStyle = () => ({ getPropertyValue: () => '0px' });
globalThis.fetch = async (url) => {
  const name = path.basename(String(url));
  const p = path.join('assets', name);
  const b = fs.readFileSync(p);
  const buf = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  return { ok: true, arrayBuffer: async () => buf };
};

let fallos = 0;
function check(cond, msg) {
  if (cond) console.log('  ok:', msg);
  else { console.error('  FALLO:', msg); fallos++; }
}

// ---- tamaños de fichero (criterio de la Fase 0) ----
const esperados = {
  'FONDO.1': 189696, 'PALETA.1': 768, 'ANIMA.FRM': 121515, 'MOBJ.DAT': 1280,
  'MINI.FNT': 2048, 'MIDLE.FNT': 10098, 'BIG.FNT': 33255, 'MAPA.1': 20587, 'MAPA.2': 13387,
  'SONIDO.DAT': 129643,
};
console.log('Tamaños de assets:');
for (const [f, n] of Object.entries(esperados))
  check(fs.statSync(path.join('assets', f)).size === n, `${f} = ${n} bytes`);

// ---- carga y parseo ----
const { SC_DER, SC_SPC } = await import('./js/ctes.js');
const { E } = await import('./js/estado.js');
const { fetchAssets, loadLevel } = await import('./js/assets.js');
const { initPalette, applyPalette } = await import('./js/paleta.js');
const { initLevel, finalizeLevel } = await import('./js/nivel.js');
const { gameTick, initPlayers } = await import('./js/juego.js');
const { present } = await import('./js/render.js');

console.log('fetchAssets + parsers:');
await fetchAssets();
check(E.paleta.length === 768, 'paleta 768 bytes');
check(E.baldosas.length === 189696, 'FONDO.1 completo (741 tiles)');
check(E.anima.length === 121515, 'ANIMA.FRM completo');
check(E.miniFNT.length === 2048 && E.midleFNT.length === 10098 && E.bigFNT.length === 33255, 'fuentes MINI/MIDLE/BIG');
initPalette(); applyPalette();

console.log('SONIDO.DAT (17 samples PCM 8-bit, sin cabecera):');
{
  const { loadSounds, SOUNDS, isPlaying } = await import('./js/sonido.js');
  await loadSounds(); // en Node no hay WebAudio: solo decodifica (play queda en no-op)
  check(Object.keys(SOUNDS).length === 17, `17 samples definidos (${Object.keys(SOUNDS).length})`);
  // la suma de tamaños debe agotar el fichero exactamente
  const total = Object.values(SOUNDS).reduce((acc, s) => acc + s.len, 0);
  check(total === 129643, `suma de samples = 129643 (${total})`);
  check(isPlaying() === false, 'isPlaying() = false sin WebAudio');
  // sin AudioContext, play() no debe lanzar excepción
  try { const { play } = await import('./js/sonido.js'); play('mina'); check(true, 'play() sin WebAudio no lanza'); }
  catch (e) { check(false, 'play() lanzó: ' + e.message); }
}

console.log('Menús (.DAC RLE + ABC):');
{
  const { loadDAC, loadRaw } = await import('./js/assets.js');
  const m = await loadDAC('MENU1.DAC');
  check(m.pix.length === 640 * 480, `MENU1.DAC 640x480 (${m.pix.length})`);
  check(m.pal && m.pal.length === 768, 'MENU1.DAC paleta 768 B al final');
  const abc = await loadRaw('ABC.FNT');
  check(abc.length === 20480, `ABC = 20480 B (${abc.length})`);
}

console.log('MAPA.1:');
E.level_ac = 0;
await loadLevel(1);
check(E.ancho === 80 && E.alto === 80, '80x80 baldosas');
check(E.play[0].H_x === 592 && E.play[0].H_y === 656, 'spawn (592,656)');
check(E.topeX === 80 * 16 - 640 && E.topeY === 80 * 16 - 400, 'topeX/topeY');
const enVivos = E.enemigo.filter(e => e.energia > 0).length;
const genActivos = E.generador.slice(0, 50).filter(g => g.energia > 0).length;
console.log(`  enemigos iniciales vivos: ${enVivos}, generadores activos: ${genActivos}`);
check(enVivos > 0, 'hay enemigos iniciales');
check(genActivos > 0, 'hay generadores activos');

console.log('initLevel + initPlayers:');
await initLevel();
initPlayers();
check(E.play[0].energia === 2000, 'energía inicial 2000');
check(E.play[0].level_end === false && E.play[1].level_end === true, '1 jugador: P2 ya terminó');
check(E.Pfondo.some(v => v !== 0), 'Pfondo compuesto (no vacío)');

console.log('FX (lineaAlinea + flash blanco de rompe_pot):');
{
  const { lineaAlinea } = await import('./js/fx.js');
  E.Pvirtual.fill(0);
  lineaAlinea();
  let diffs = 0;
  for (let i = 0; i < 640 * 400; i += 13) if (E.Pvirtual[i] !== E.Pfondo[i]) diffs++;
  check(diffs === 0, `lineaAlinea revela el fondo completo (${diffs} diffs muestreadas)`);

  const { whiteFlash, lut32 } = await import('./js/paleta.js');
  whiteFlash();
  check(lut32[0] === 0xFFFFFFFF && lut32[128] === 0xFFFFFFFF, 'flash: LUT blanca inmediata');
  await new Promise(r => setTimeout(r, 60));
  const p = E.paletaBack;
  // ojo: el | de JS devuelve int32 con signo — comparar como uint32
  const esperado = (0xFF000000 | (((p[2] << 2) | (p[2] >> 4)) << 16) | (((p[1] << 2) | (p[1] >> 4)) << 8) | ((p[0] << 2) | (p[0] >> 4))) >>> 0;
  check((lut32[0] >>> 0) === esperado, 'flash: paleta restaurada a los 20 ms');
}

console.log('200 ticks de juego (enemigos persiguiendo, sin input):');
try {
  let promesa = null;
  for (let i = 0; i < 200 && promesa === null; i++) promesa = gameTick();
  check(E.veces === 200, `veces = ${E.veces} (200)`);
  check(E.tic === 200 % 18, `tic = ${E.tic} (${200 % 18})`);
  const esperada = 2000 - Math.floor(200 / 18);
  check(E.play[0].energia === esperada, `energía = ${E.play[0].energia} (2000 - hambre: ${esperada})`);
  present();
  check(true, 'present() sin errores');
  console.log(`  posición jugador: (${E.play[0].H_x},${E.play[0].H_y}), Tpuertas=${E.Tpuertas}, crono=${E.crono}`);
} catch (err) {
  check(false, 'excepción en los ticks: ' + err.stack);
}

// nubes: activadas en el primer tick (veces%100==0), derivan hacia arriba-derecha
{
  const activas = E.nube.filter(n => n.activa).length;
  let nubesOK = 0, nubesVisibles = 0;
  for (const n of E.nube) {
    if (!n.activa) continue;
    const nx = n.x - E.absolutoX, ny = n.y - E.absolutoY;
    if (nx > 640 || ny > 400 || nx + n.Lx < 0 || ny + n.Ly < 0) continue;
    nubesVisibles++;
    let ok = 0, tot = 0;
    for (let r = 0; r < n.Ly; r++)
      for (let c = 0; c < n.Lx; c++) {
        const v = E.nubes[n.off + r * n.Lx + c];
        if (v === 0) continue;
        tot++;
        const cy = ny + r, cx = nx + c;
        if (cy >= 0 && cy < 400 && cx >= 0 && cx < 640 && E.Pvirtual[cy * 640 + cx] === v) ok++;
      }
    if (ok === tot && tot > 0) nubesOK++;
  }
  check(nubesOK >= 1, `nubes dibujadas (${nubesOK}/${nubesVisibles} visibles, ${activas} activas)`);
}

// ---- verificación independiente de la composición del fondo ----
{
  const { composeBackground } = await import('./js/scroll.js');
  E.Pfondo.fill(0);
  composeBackground();
  check(Number.isInteger(E.mapaX) && Number.isInteger(E.mapaY),
        `mapaX/mapaY enteros (${E.mapaX}, ${E.mapaY}) — ¡ojo con divisiones JS no enteras!`);
  check(Number.isInteger(E.absolutoX) && Number.isInteger(E.absolutoY),
        `absolutoX/Y enteros (${E.absolutoX}, ${E.absolutoY})`);
  let diff = 0;
  for (let ty = 0; ty < 25; ty++)
    for (let tx = 0; tx < 40; tx++) {
      const tile = E.mapa[(E.mapaY + ty) * E.ancho + (E.mapaX + tx)];
      for (let r = 0; r < 16; r++) {
        const src = tile * 256 + r * 16;
        const dst = (ty * 16 + r) * 640 + tx * 16;
        for (let c = 0; c < 16; c++)
          if (E.Pfondo[dst + c] !== E.baldosas[src + c]) diff++;
      }
    }
  check(diff === 0, `composeBackground == recomposición ingenua (${diff} diffs)`);
}

// ---- frame con el jugador moviéndose a la derecha y disparando ----
{
  const { SPR } = await import('./js/ctes.js');
  E.keys[SC_DER] = 1;
  for (let i = 0; i < 10; i++) gameTick();
  E.keys[SC_DER] = 0;
  E.keys[SC_SPC] = 1;
  for (let i = 0; i < 6; i++) gameTick();
  E.keys[SC_SPC] = 0;

  // sprite del jugador en su posición real del último tick
  const px = E.play[0].H_x - E.absolutoX, py = E.play[0].H_y - E.absolutoY;
  const sprOff = SPR.camHV + 1352 * E.play[0].H_d + 169 * E.play[0].H_s;
  let tot = 0, ok = 0;
  if (E.play[0].energia > 0 && !E.play[0].level_end) {
    for (let r = 0; r < 13; r++)
      for (let c = 0; c < 13; c++) {
        const v = E.anima[sprOff + r * 13 + c];
        if (v === 0) continue;
        tot++;
        if (E.Pvirtual[(py + r) * 640 + (px + c)] === v) ok++;
      }
    check(ok === tot && tot > 0, `sprite del jugador bliteado (${ok}/${tot} px, pos ${px},${py})`);
  } else {
    check(false, 'el jugador murió durante la prueba (no se pudo verificar el sprite)');
  }

  // sombra del jugador: píxeles |0x80 no cubiertos por el sprite
  let sombraOK = false, sombraVistas = 0;
  for (let r = 0; r < 13; r++)
    for (let c = 0; c < 13; c++) {
      if (E.anima[sprOff + r * 13 + c] === 0) continue;
      if (r + 4 < 13 && c + 4 < 13 && E.anima[sprOff + (r + 4) * 13 + (c + 4)] !== 0) continue;
      const idx = (py + 4 + r) * 640 + (px + 4 + c);
      sombraVistas++;
      if (E.Pvirtual[idx] === (E.Pfondo[idx] | 0x80)) sombraOK = true;
    }
  check(sombraVistas > 0 && sombraOK, `sombra del jugador correcta (${sombraVistas} px)`);

  // disparo: bola 9x9 a 15 px/tick en dirección H_d
  const p = E.play[0];
  if (p.D_d !== 255) {
    const bx = p.D_x - E.absolutoX, by = p.D_y - E.absolutoY;
    const bolaOff = SPR.bola + 81 * p.D_d;
    let btot = 0, bok = 0;
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) {
        const v = E.anima[bolaOff + r * 9 + c];
        if (v === 0) continue;
        btot++;
        if (E.Pvirtual[(by + r) * 640 + (bx + c)] === v) bok++;
      }
    check(bok === btot && btot > 0, `bola del disparo bliteada (${bok}/${btot} px)`);
    console.log(`  disparo vivo en (${bx},${by}) tras 6 ticks`);
  } else {
    console.log('  el disparo chocó antes de 6 ticks (saltada la comprobación de la bola)');
  }

  // al menos un enemigo dibujado en su posición
  const bases = { 0: SPR.camHG, 1: SPR.camHA, 2: SPR.camFT, 10: SPR.camMT };
  let eneOK = false;
  for (const e of E.enemigo) {
    if (e.energia <= 0) continue;
    const ex = e.X - E.absolutoX, ey = e.Y - E.absolutoY;
    if (ex < -10 || ey < -10 || ex > 640 || ey > 400) continue;
    const off = bases[e.tipo] + 1352 * e.direccion + 169 * e.secuencia;
    for (let r = 0; r < 13 && !eneOK; r++)
      for (let c = 0; c < 13; c++) {
        const v = E.anima[off + r * 13 + c];
        if (v === 0) continue;
        if (E.Pvirtual[(ey + r) * 640 + (ex + c)] === v) { eneOK = true; break; }
      }
    if (eneOK) break;
  }
  check(eneOK, 'enemigo dibujado en su posición');

  // HUD visible (energía/puntos en la esquina superior)
  let hudOK = false;
  for (let y = 3; y < 14 && !hudOK; y++)
    for (let x = 0; x < 120; x++)
      if (E.Pvirtual[y * 640 + x] !== 0) { hudOK = true; break; }
  check(hudOK, 'HUD dibujado (energía/puntos)');

  fs.writeFileSync('frame2.raw', E.Pvirtual.subarray(0, 640 * 400));
  console.log('frame2.raw volcado (moviendo+disparando)');
}

console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLOS`);
process.exit(fallos === 0 ? 0 : 1);
