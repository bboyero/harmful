// Sonido — SONIDO.DAT: 17 samples PCM 8-bit sin signo a 8 kHz, concatenados
// sin cabecera (carga() de JUEGO.CC). Reproduce la semántica de sb_play del
// original: monofónico, un sonido nuevo CORTA al que está sonando.
// Los navegadores bloquean el AudioContext hasta un gesto del usuario:
// se desbloquea con la primera tecla/click (hasta entonces, mudo, como SB==0).

// Offsets y tamaños hardcodeados en carga() (JUEGO.CC:231-289)
export const SOUNDS = {
  choque:  { off: 0,      len: 2019 },
  disparo: { off: 2019,   len: 2335 },
  dado2:   { off: 4354,   len: 3410 },
  cristal: { off: 7764,   len: 5676 },
  risa:    { off: 13440,  len: 22399 },
  comer:   { off: 35839,  len: 2872 },
  llaves:  { off: 38711,  len: 3583 },
  salida:  { off: 42294,  len: 12000 },
  choff:   { off: 54294,  len: 13909 },
  electr:  { off: 68203,  len: 7891 },
  ahhhhh:  { off: 76094,  len: 7721 },
  trampa:  { off: 83815,  len: 6598 },
  mina:    { off: 90413,  len: 15895 },
  dado1:   { off: 106308, len: 4377 },
  dado3:   { off: 110685, len: 2777 },
  pocion:  { off: 113462, len: 7524 },
  transp:  { off: 120986, len: 8657 },
};

let ctx = null, master = null, current = null;
const pcm = {};      // Float32Array por nombre (decodificado al cargar)
const buffers = {};  // AudioBuffer por nombre (creados al desbloquear)

// Carga y decodifica SONIDO.DAT a Float32 (sin AudioContext, matemática pura)
export async function loadSounds() {
  const res = await fetch('assets/SONIDO.DAT');
  if (!res.ok) { console.warn('Sin SONIDO.DAT: el juego irá mudo.'); return; }
  const data = new Uint8Array(await res.arrayBuffer());
  for (const [name, s] of Object.entries(SOUNDS)) {
    const f = new Float32Array(s.len);
    for (let i = 0; i < s.len; i++) f[i] = (data[s.off + i] - 128) / 128;
    pcm[name] = f;
  }
}

// Crea el AudioContext y los buffers (solo tras un gesto del usuario)
function ensureCtx() {
  if (ctx) return;
  const AC = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return; // sin WebAudio (p.ej. en el test de Node): mudo
  ctx = new AC();
  master = ctx.createGain();
  master.connect(ctx.destination);
  for (const [name, f] of Object.entries(pcm)) {
    const b = ctx.createBuffer(1, f.length, 8000);
    b.getChannelData(0).set(f);
    buffers[name] = b;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', unlock);
  window.addEventListener('pointerdown', unlock);
}
function unlock() {
  ensureCtx();
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

// sb_play: monofónico — un sonido nuevo corta el anterior (resto_sample se resetea)
export function play(name) {
  if (!ctx) return; // aún sin gesto del usuario: mudo
  const b = buffers[name];
  if (!b) return;
  if (current) {
    try { current.stop(); } catch (e) { /* ya parado */ }
    current = null;
  }
  const src = ctx.createBufferSource();
  src.buffer = b;
  src.connect(master);
  src.onended = () => { if (current === src) current = null; };
  src.start();
  current = src;
}

// resto_sample==0 del C: no suena nada ahora mismo
export function isPlaying() {
  return current !== null;
}

// Ruido blanco de 1 s en caché (para las burbujas)
const ruido = {};
function makeNoise(c) {
  if (!ruido[c.sampleRate]) {
    const b = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    ruido[c.sampleRate] = b;
  }
  const src = c.createBufferSource();
  src.buffer = ruido[c.sampleRate];
  return src;
}

// Muerte por agua, versión dramática: splash + burbujas subiendo + eco grave
// largo (hundimiento de película). La secuencia no pasa por `current`, así
// que suena completa y no corta la risa del FIN.
export function ahogamientoDramatico() {
  if (!ctx) return;
  const t0 = ctx.currentTime;

  // 1) splash (choff)
  const splash = ctx.createBufferSource();
  splash.buffer = buffers.choff;
  splash.connect(master);
  splash.start(t0);

  // 2) burbujas subiendo: 6 ráfagas de ruido band-pass con tono ascendente
  for (let i = 0; i < 6; i++) {
    const t = t0 + 0.35 + i * 0.22;
    const dur = 0.09;
    const n = makeNoise(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(600 + i * 280, t);
    bp.Q.value = 6;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0, t);
    ng.gain.linearRampToValueAtTime(0.25, t + dur * 0.4);
    ng.gain.linearRampToValueAtTime(0, t + dur);
    n.connect(bp); bp.connect(ng); ng.connect(master);
    n.start(t);
    n.stop(t + dur);
  }

  // 3) eco grave largo: seno 200 Hz -> 35 Hz a lo largo de ~2,6 s
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, t0 + 1.2);
  osc.frequency.exponentialRampToValueAtTime(35, t0 + 3.8);
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.0001, t0 + 1.2);
  og.gain.linearRampToValueAtTime(0.45, t0 + 1.8);
  og.gain.linearRampToValueAtTime(0.0001, t0 + 4.0);
  osc.connect(og); og.connect(master);
  osc.start(t0 + 1.2);
  osc.stop(t0 + 4.1);
}

// Música del menú en bucle (musica.mp3, 32 kbps mono). Si el autoplay la
// bloquea (política de gestos), se reintenta con el primer toque.
let musica = null;
let musicaDeseada = false;

function crearMusica() {
  if (musica) return musica;
  musica = new Audio('assets/musica.mp3');
  musica.loop = true;
  musica.volume = 0.55;
  return musica;
}

export function empezarMusica() {
  musicaDeseada = true;
  try {
    crearMusica().play().catch(() => { /* bloqueado: reintentará con el toque */ });
  } catch (e) { /* sin audio */ }
}

export function pararMusica() {
  musicaDeseada = false;
  try { if (musica) musica.pause(); } catch (e) { /* sin audio */ }
}

export function reintentarMusica() {
  if (!musicaDeseada || !musica || !musica.paused) return;
  musica.play().catch(() => {});
}

// Vibración háptica. Primero por el plugin NATIVO (VibrarPlugin en
// MainActivity — el WebView de Samsung no implementa navigator.vibrate);
// si no está, se intenta la API web del navegador.
export function vibrar(patron) {
  try {
    const C = typeof window !== 'undefined' ? window.Capacitor : null;
    const V = C && C.Plugins && C.Plugins.Vibrar;
    if (V && V.vibrar) {
      if (Array.isArray(patron)) V.patron({ milis: patron }).catch(() => {});
      else V.vibrar({ duracion: patron }).catch(() => {});
      return;
    }
  } catch (e) { /* puente no disponible */ }
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(patron);
  } catch (e) { /* sin háptica disponible */ }
}
