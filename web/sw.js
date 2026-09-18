// Service worker: HARMFUL funciona sin conexión (PWA instalable)
// ¡Subir la versión SIEMPRE que cambie cualquier archivo de web/!
// Cache-first con caché versionada: cada versión se precachea ENTERA al
// instalar, así nunca se mezclan archivos de dos versiones (un main.js nuevo
// con un entrada-tactil.js viejo rompía los módulos ES: "does not provide an
// export named..."). El coste: la primera carga tras una actualización puede
// servir la versión anterior; la siguiente ya trae la nueva.
const CACHE = 'harmful-v73';

const CORE = [
  './', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png',
  './js/ctes.js', './js/estado.js', './js/sonido.js', './js/assets.js',
  './js/paleta.js', './js/render.js', './js/fuente.js', './js/mapa.js',
  './js/scroll.js', './js/entrada.js', './js/entrada-tactil.js', './js/menu.js',
  './js/enemigos.js', './js/generado.js', './js/crono.js', './js/nivel.js',
  './js/juego.js', './js/main.js', './js/nubes.js', './js/fx.js',
  './assets/PALETA.1', './assets/FONDO.1', './assets/ANIMA.FRM', './assets/MOBJ.DAT',
  './assets/MINI.FNT', './assets/MIDLE.FNT', './assets/BIG.FNT',
  './assets/NUBES.DAT', './assets/SONIDO.DAT',
  './assets/MAPA.1', './assets/MAPA.2', './assets/MAPA.3', './assets/MAPA.4',
  './assets/MAPA.5', './assets/MAPA.6', './assets/MAPA.7', './assets/MAPA.8',
  './assets/MAPA.9', './assets/MAPA.10', './assets/MAPA.11', './assets/MAPA.12',
  './assets/MAPA.13', './assets/MAPA.14', './assets/MAPA.15',
  './assets/ABC.FNT', './assets/musica.mp3', './assets/OVERFLOW.DAC', './assets/HARMFUL.DAC', './assets/BICHO.DAC',
  './assets/MENU1.DAC', './assets/AYUDA.DAC', './assets/START.DAC',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // cache-first: la caché de la versión es una instantánea completa y coherente;
  // si algo no está (cambio de versión a medias), se pide a la red y se guarda
  e.respondWith(
    caches.match(e.request).then((hit) =>
      hit || fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })));
});
