// Captura console.log de la página durante unos segundos.
// Uso: node cdp-console.mjs <puerto> <segundos>
const [,, portArg, secsArg] = process.argv;
const PORT = portArg || '9222';
const SECS = Number(secsArg || 8);
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
    return;
  }
  if (msg.method === 'Runtime.consoleAPICalled') {
    const args = msg.params.args.map(a => a.value ?? a.description ?? a.type).join(' ');
    console.log(`[console] ${args}`);
  }
};
await new Promise(r => ws.onopen = r);
await send('Runtime.enable');
console.log('capturando consola...');
await new Promise(r => setTimeout(r, SECS * 1000));
ws.close();
process.exit(0);
