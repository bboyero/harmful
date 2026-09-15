// Smoke test del flujo completo (menús + juego) en Node con stubs de navegador.
// Uso: node test-smoke.mjs  (desde web/)
// Recorre: boot -> creditos (.DAC) -> menu (ENTER) -> start.dac + poneabc ->
// INTRO -> JUEGO (ticks reales). Si hay una excepción de runtime que las
// pruebas unitarias no cubren (menús van por rAF), aquí se ve.
import fs from 'node:fs';
import path from 'node:path';

process.on('uncaughtException', (err) => {
  console.error('EXCEPCIÓN NO CAPTURADA:', err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('PROMESA RECHAZADA SIN CAPTURAR:', err);
  process.exit(1);
});

// ---- stubs de navegador ----
globalThis.performance = { now: () => Date.now() };
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16);
globalThis.cancelAnimationFrame = clearTimeout;
const fakeCtx = {
  createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
  putImageData: () => {},
};
const el = {
  getContext: () => fakeCtx,
  style: {},
  width: 640, height: 400,
  classList: { contains: () => false, toggle: () => {} },
  addEventListener: () => {},
};
globalThis.document = { getElementById: () => el, documentElement: { style: {} } };
globalThis.getComputedStyle = () => ({ getPropertyValue: () => '0px' });
globalThis.window = { addEventListener: () => {}, innerWidth: 1280, innerHeight: 800 };
globalThis.location = { search: '' };
globalThis.fetch = async (url) => {
  const name = path.basename(String(url));
  const b = fs.readFileSync(path.join('assets', name));
  const buf = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  return { ok: true, arrayBuffer: async () => buf };
};
// sin localStorage (como un entorno sin él): el código debe aguantar el try/catch

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const { E } = await import('./js/estado.js');
const { SC_ENTER, SC_SPC } = await import('./js/ctes.js');

console.log('boot + creditos (OVERFLOW/HARMFUL/BICHO)...');
await import('./js/main.js'); // boot() se ejecuta solo

await dormir(5000); // créditos ~3,7 s + trampa + margen

console.log('ENTER en el menú (cursor animado + black_hole)...');
E.keys[SC_ENTER] = 1;
await dormir(1500); // blackHole ~232 ms + transición a startScreen

console.log('start.dac + poneabc (se salta con una tecla)...');
E.keys[SC_SPC] = 1; // cualquier tecla acelera el texto
await dormir(6500); // resto del texto + delay(500) + INTRO 3 s + primeros ticks

if (E.veces > 0) {
  console.log('SMOKE OK: el juego está tiqueando (E.veces = ' + E.veces + ')');
  process.exit(0);
} else {
  console.error('SMOKE FALLO: no se llegó al bucle del juego (E.veces = 0)');
  process.exit(1);
}
