// Verifica que el plugin nativo de vibración está registrado y responde.
// Uso: node verificar-vibrar.mjs <puerto>
const [,, portArg] = process.argv;
const PORT = portArg || '9222';
const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((res, rej) => {
  const i = ++id;
  pending.set(i, { res, rej });
  ws.send(JSON.stringify({ id: i, method: m, params: p }));
});
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
  }
};
await new Promise(r => ws.onopen = r);
const expr = `(function(){
  const C = window.Capacitor;
  const V = C && C.Plugins && C.Plugins.Vibrar;
  if (!V) return 'plugin NO registrado';
  return V.vibrar({ duracion: 200 }).then(() => 'vibrar() resuelto OK').catch(e => 'ERROR: ' + e);
})()`;
const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
console.log(r.result.value);
ws.close();
process.exit(0);
