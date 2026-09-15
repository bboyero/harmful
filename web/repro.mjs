// Reproducción del "game over sin motivo": simula pasos y registra energía/posición/tile
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

const { SC_DER, SC_IZQ, SC_ARR, SC_ABJ } = await import('./js/ctes.js');
const { E } = await import('./js/estado.js');
const { fetchAssets } = await import('./js/assets.js');
const { initPalette, applyPalette } = await import('./js/paleta.js');
const { initLevel } = await import('./js/nivel.js');
const { gameTick, initPlayers } = await import('./js/juego.js');

await fetchAssets();
initPalette(); applyPalette();
await initLevel();
initPlayers();

// vecindario del spawn: 7x7 baldosas (propiedad, tile)
const sx = Math.floor(E.play[0].H_x / 16), sy = Math.floor(E.play[0].H_y / 16);
console.log(`spawn (${E.play[0].H_x},${E.play[0].H_y}) = baldosa (${sx},${sy})`);
const NOMBRES = { 0: '.', 1: 'AGUA', 2: 'SOLIDO', 3: 'MINA', 4: 'desD', 5: 'desI', 6: 'desA', 7: 'desB',
  10: 'FRGL', 11: 'FRGL', 12: 'FRGL', 99: 'ALEA', 100: 'LLAVE', 101: 'FOOD', 102: 'FOODF', 103: 'POTF',
  104: 'POT', 105: 'ARMAD', 106: 'COMB', 107: 'MAGIA', 108: 'INMOV', 110: 'REPUL', 111: 'INVIS',
  120: 'VENENO', 249: 'TRANS', 250: 'SOLF', 251: 'CABLE', 252: 'TRAMPA', 253: 'PUERTA', 254: 'GEN', 255: 'EXT' };
let linea = '     ';
for (let dx = -3; dx <= 3; dx++) linea += `x${sx + dx < 10 ? ' ' : ''}${sx + dx} `.slice(-5);
console.log(linea);
for (let dy = -3; dy <= 3; dy++) {
  let l = `y${sy + dy}`.padEnd(5);
  for (let dx = -3; dx <= 3; dx++) {
    const prop = (sy + dy) * E.ancho + (sx + dx);
    l += (NOMBRES[E.propiedad[prop]] || E.propiedad[prop]).padEnd(7);
  }
  console.log(l);
}

// simular pasos a la derecha
console.log('\n--- 60 ticks con flecha derecha ---');
E.keys[SC_DER] = 1;
for (let i = 0; i < 60; i++) {
  gameTick();
  const p = E.play[0];
  const tile = Math.floor(p.H_y / 16) * E.ancho + Math.floor(p.H_x / 16);
  const pr = E.propiedad[tile];
  const evento = (pr !== 0) ? ` TILE=${NOMBRES[pr] || pr}` : '';
  if (i % 5 === 4 || p.energia <= 0 || p.level_end) {
    console.log(`tick ${i + 1}: pos=(${p.H_x},${p.H_y}) energia=${p.energia}${evento}`);
    if (p.level_end) { console.log('  LEVEL_END en tick', i + 1); break; }
  }
}
E.keys[SC_DER] = 0;

// si sigue vivo, probar las 4 direcciones desde el spawn otra vez
if (!E.play[0].level_end) {
  console.log('\n--- reset y prueba de 4 direcciones (20 ticks cada una) ---');
  for (const [nombre, sc] of [['DER', SC_DER], ['IZQ', SC_IZQ], ['ARR', SC_ARR], ['ABJ', SC_ABJ]]) {
    E.play[0].level_end = false; // (simplificación: no se usa finaliza_level aquí)
    // recargar estado limpio: reiniciar posición y energía
    await initLevel();
    E.play[0].energia = 2000; E.play[0].level_end = false;
    E.keys[sc] = 1;
    let muerto = false;
    for (let i = 0; i < 20; i++) {
      gameTick();
      const p = E.play[0];
      if (p.energia <= 0) {
        const tile = Math.floor(p.H_y / 16) * E.ancho + Math.floor(p.H_x / 16);
        const pr = E.propiedad[tile];
        console.log(`${nombre}: MUERTO en tick ${i + 1} pos=(${p.H_x},${p.H_y}) tile=${NOMBRES[pr] || pr} energia=${p.energia}`);
        muerto = true;
        break;
      }
    }
    if (!muerto) console.log(`${nombre}: vivo tras 20 ticks, energia=${E.play[0].energia} pos=(${E.play[0].H_x},${E.play[0].H_y})`);
    E.keys[sc] = 0;
  }
}

// enemigos cercanos al spawn
console.log('\nenemigos vivos:');
for (const e of E.enemigo) {
  if (e.energia > 0) console.log(`  tipo=${e.tipo} pos=(${e.X},${e.Y}) energia=${e.energia}`);
}
