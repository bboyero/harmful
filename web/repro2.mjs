// Verificación: (1) baldosa donde muere el jugador, (2) enemigos generados visibles
import fs from 'node:fs';
import path from 'node:path';

const fakeCtx = {
  createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
  putImageData: () => {},
};
globalThis.document = { getElementById: () => ({ getContext: () => fakeCtx, style: {}, width: 640, height: 400 }) };
globalThis.window = { addEventListener: () => {}, innerWidth: 1280, innerHeight: 800 };
globalThis.fetch = async (url) => {
  const b = fs.readFileSync(path.join('assets', path.basename(String(url))));
  return { ok: true, arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) };
};

const { SC_DER, SPR } = await import('./js/ctes.js');
const { E } = await import('./js/estado.js');
const { fetchAssets } = await import('./js/assets.js');
const { initPalette, applyPalette } = await import('./js/paleta.js');
const { initLevel } = await import('./js/nivel.js');
const { gameTick, initPlayers } = await import('./js/juego.js');

await fetchAssets();
initPalette(); applyPalette();
await initLevel();
initPlayers();

// (1) baldosa de la muerte: el jugador caminando a la derecha muere en tile (48,41)
for (let x = 37; x <= 50; x++) {
  const prop = 41 * E.ancho + x;
  const nombre = { 0: 'vacio', 1: 'AGUA', 2: 'solido', 3: 'mina', 4: 'desD', 5: 'desI', 6: 'desA', 7: 'desB',
    252: 'trampa', 253: 'puerta', 254: 'gen', 255: 'salida' }[E.propiedad[prop]] || ('prop=' + E.propiedad[prop]);
  console.log(`tile (${x},41): ${nombre} (tile ${E.mapa[prop]})`);
}

// (2) caminar 30 ticks (sin llegar al agua) y comprobar enemigos generados visibles
E.keys[SC_DER] = 1;
for (let i = 0; i < 30; i++) gameTick();
E.keys[SC_DER] = 0;

const bases = { 0: SPR.camHG, 1: SPR.camHA, 2: SPR.camFT, 10: SPR.camMT };
let visibles = 0, dibujados = 0;
for (const e of E.enemigo) {
  if (e.energia <= 0) continue;
  const ex = e.X - E.absolutoX, ey = e.Y - E.absolutoY;
  if (ex < -10 || ey < -10 || ex > 640 || ey > 400) { console.log(`  enemigo tipo=${e.tipo} FUERA de pantalla (${ex},${ey})`); continue; }
  visibles++;
  const seq = e.secuencia > e.Fmax ? 0 : e.secuencia; // clamp como drawEnemy
  const off = bases[e.tipo] + 1352 * e.direccion + 169 * seq;
  // buscar el sprite en una ventana de ±5 px (el dibujo va 1 tick por delante de la cámara)
  let mejor = { ok: 0, tot: 0, dx: 0, dy: 0 };
  for (let dy = -5; dy <= 5; dy++)
    for (let dx = -5; dx <= 5; dx++) {
      let ok = 0, tot = 0;
      for (let r = 0; r < 13; r++)
        for (let c = 0; c < 13; c++) {
          const v = E.anima[off + r * 13 + c];
          if (v === 0) continue;
          tot++;
          if (E.Pvirtual[(ey + dy + r) * 640 + (ex + dx + c)] === v) ok++;
        }
      if (ok > mejor.ok) mejor = { ok, tot, dx, dy };
    }
  if (mejor.ok === mejor.tot && mejor.tot > 0) {
    dibujados++;
    console.log(`  enemigo tipo=${e.tipo} en pantalla (${ex},${ey}): DIBUJADO ${mejor.ok}/${mejor.tot} px en offset (${mejor.dx},${mejor.dy})`);
  } else {
    console.log(`  enemigo tipo=${e.tipo} en pantalla (${ex},${ey}): mejor ${mejor.ok}/${mejor.tot} px en offset (${mejor.dx},${mejor.dy}) (¡FALLO!)`);
  }
}
console.log(`enemigos en pantalla: ${visibles}, correctamente dibujados: ${dibujados}`);

// ¿cuántos generadores hay cerca de la pantalla y cuántos enemigos han generado?
let gensCerca = 0;
for (let gn = 0; gn < E.max_gen; gn++) {
  const g = E.generador[gn];
  if (g.energia <= 0) continue;
  const gx = g.X - E.absolutoX, gy = g.Y - E.absolutoY;
  if (gx > -16 && gx < 640 && gy > -16 && gy < 400) {
    gensCerca++;
    console.log(`  generador activo tipo=${g.tipo} en pantalla (${gx},${gy}) energia=${g.energia}`);
  }
}
console.log(`generadores activos en pantalla: ${gensCerca}`);
