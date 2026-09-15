// Evalúa expresiones en la página del WebView vía CDP.
// Uso: node cdp-eval.mjs <puerto> <expr> [expr2 ...]
const [,, portArg, ...exprs] = process.argv;
const PORT = portArg || '9222';

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.find(t => t.type === 'page') || list[0];
if (!page) { console.error('No hay target page'); process.exit(1); }

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
for (const expr of exprs) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  if (r.exceptionDetails) {
    console.log(`>>> ${expr}\n    EXCEPTION: ${r.exceptionDetails.text} ${r.exceptionDetails.exception?.description || ''}`);
  } else {
    console.log(`>>> ${expr}\n    = ${JSON.stringify(r.result.value)}`);
  }
}
ws.close();
process.exit(0);
