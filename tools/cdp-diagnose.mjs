// Diagnostica el WebView de la app vía Chrome DevTools Protocol.
// Uso: node cdp-diagnose.mjs <puerto> <segundos>
// Conecta, recarga la pagina y captura consola/excepciones.
const [,, portArg, secsArg] = process.argv;
const PORT = portArg || '9222';
const SECS = Number(secsArg || 30);

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
console.log('Targets:', list.map(t => `${t.type} ${t.title} ${t.url}`));
const page = list.find(t => t.type === 'page') || list[0];
if (!page) { console.error('No hay target page'); process.exit(1); }
console.log('Conectando a:', page.webSocketDebuggerUrl);

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
function onMsg(data) {
  const msg = JSON.parse(data);
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
    return;
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails;
    console.log('💥 EXCEPCION:', d.text, '|', d.exception?.description || '');
    if (d.stackTrace?.callFrames) {
      for (const f of d.stackTrace.callFrames.slice(0, 6)) {
        console.log(`   at ${f.functionName || '(anon)'} ${f.url}:${f.lineNumber + 1}`);
      }
    }
  } else if (msg.method === 'Runtime.consoleAPICalled') {
    const args = msg.params.args.map(a => a.value ?? a.description ?? a.type).join(' ');
    console.log(`[console.${msg.params.type}]`, args);
  } else if (msg.method === 'Log.entryAdded') {
    const e = msg.params.entry;
    if (e.level === 'error') console.log(`[${e.level}] ${e.text} ${e.url || ''}:${e.lineNumber ?? ''}`);
  }
}
ws.onmessage = (ev) => { try { onMsg(ev.data); } catch (e) { console.log('(msg raro)', e.message); } };
ws.onerror = (e) => console.error('WS error', e.message || e);
await new Promise(r => ws.onopen = r);
console.log('Conectado. Habilitando Runtime/Log/Page...');
await send('Runtime.enable');
await send('Log.enable');
await send('Page.enable');
console.log('Recargando pagina...');
await send('Page.reload', { ignoreCache: true });
await new Promise(r => setTimeout(r, SECS * 1000));
console.log('Fin de captura');
ws.close();
process.exit(0);
