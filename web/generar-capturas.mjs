// Genera capturas para la ficha de Play Store desde el juego real
// (mismo arnés que test-node.mjs) + las convierte a PNG con PIL.
import fs from 'node:fs';
import path from 'node:path';

const fakeCtx = {
  createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
  putImageData: () => {},
};
globalThis.document = { getElementById: () => ({ getContext: () => fakeCtx, style: {}, width: 640, height: 400 }) };
globalThis.window = { addEventListener: () => {}, innerWidth: 1280, innerHeight: 800 };
globalThis.getComputedStyle = () => ({ getPropertyValue: () => '0px' });
globalThis.fetch = async (url) => {
  const b = fs.readFileSync(path.join('assets', path.basename(String(url))));
  return { ok: true, arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) };
};

const { SC_DER, SC_SPC } = await import('./js/ctes.js');
const { E } = await import('./js/estado.js');
const { fetchAssets } = await import('./js/assets.js');
const { initPalette, applyPalette } = await import('./js/paleta.js');
const { initLevel } = await import('./js/nivel.js');
const { gameTick, initPlayers } = await import('./js/juego.js');

const volcar = (nombre) => fs.writeFileSync(nombre, E.Pvirtual.subarray(0, 640 * 400));

await fetchAssets();
initPalette(); applyPalette();
await initLevel();            // compone el fondo + splash LEVEL 1 (en Pvirtual)
volcar('cap-splash.raw');     // captura 1: pantalla de título de nivel

initPlayers();
for (let i = 0; i < 300; i++) gameTick();   // deja que enemigos/nubes animen la escena
volcar('cap-juego.raw');      // captura 2: gameplay con HUD, enemigos y nubes

// una captura con disparo
E.keys[SC_DER] = 1;
for (let i = 0; i < 6; i++) gameTick();
E.keys[SC_DER] = 0;
E.keys[SC_SPC] = 1;
for (let i = 0; i < 4; i++) gameTick();
E.keys[SC_SPC] = 0;
volcar('cap-disparo.raw');    // captura 3: disparando

// game over: la imagen GAMEOVER.DAC (como en el juego real)
const { loadDAC } = await import('./js/assets.js');
const go = await loadDAC('GAMEOVER.DAC');
E.Pvirtual.set(go.pix.subarray(0, 640 * 400));
volcar('cap-gameover.raw');   // captura 4: game over con la imagen propia

console.log('capturas volcadas: cap-splash/juego/disparo/gameover.raw');
console.log('ahora: python generar-capturas.py');
