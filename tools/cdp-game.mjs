// Entra en partida en el juego (Chrome headless) y captura el HUD.
// Uso: node cdp-game.mjs <puerto> <out.png>
const [,, portArg, outFile] = process.argv;
const PORT = portArg || '9333';
const OUT = outFile || 'hud-chrome.png';

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
function send(method, params = {}) {
  return new Promise((res, rej) => {
    const mid = ++id;
    pending.set(mid, { res, rej });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
  }
};
await new Promise(r => ws.onopen = r);
const dormir = (ms) => new Promise(r => setTimeout(r, ms));

const tap = (x, y) => send('Runtime.evaluate', {
  expression: `(function(){
    const w = document.getElementById('wrap');
    const r = w.getBoundingClientRect();
    w.dispatchEvent(new PointerEvent('pointerdown', { clientX: ${x}, clientY: ${y}, bubbles: true, pointerId: 1 }));
  })()`
});

// 1) esperar a que los créditos acaben y esté el menú
for (let i = 0; i < 30; i++) {
  const st = await send('Runtime.evaluate', { expression: "document.querySelectorAll('.tmenu-nav').length", returnByValue: true });
  if (st.result.value > 0) break; // botones de menú creados
  await dormir(500);
}
console.log('menu detectado');

// 2) tap en JUGAR (fila 0) — coords de canvas: escala = wrap.width/640
const rect = await send('Runtime.evaluate', {
  expression: `JSON.stringify((function(){ const r = document.getElementById('wrap').getBoundingClientRect(); return {x:r.left, y:r.top, w:r.width, h:r.height}; })())`,
  returnByValue: true
});
const r = JSON.parse(rect.result.value);
const escala = r.w / 640;
console.log('wrap:', r, 'escala:', escala);
await tap(r.x + r.w / 2, r.y + 70 * escala);
await dormir(3000);
await tap(r.x + r.w / 2, r.y + r.h / 2); // saltar ABC
await dormir(6000);

// 3) captura + geometría del canvas en modo juego
const info = await send('Runtime.evaluate', {
  expression: `JSON.stringify((function(){
    const c = document.getElementById('screen');
    const cr = c.getBoundingClientRect();
    return { bitmap: c.width + 'x' + c.height, css: cr.width + 'x' + cr.height, left: cr.left, top: cr.top, iw: innerWidth, ih: innerHeight };
  })())`,
  returnByValue: true
});
console.log('canvas:', info.result.value);
const shot = await send('Page.captureScreenshot', { format: 'png' });
const fs = await import('fs');
fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
console.log('captura guardada:', OUT);
ws.close();
process.exit(0);
