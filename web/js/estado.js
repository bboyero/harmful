// Estado mutable compartido — réplica del "espacio global" del C.
// Se exporta UN objeto mutable (los namespaces de módulos ES son de solo lectura).
import { MAX_X, MAX_Y, max_ene } from './ctes.js';

function makePlayer() {
  return {
    energia: 0, puntos: 0,
    H_x: 0, H_y: 0, H_x_back: 0, H_y_back: 0, H_d: 0,
    H_s: 0, H_s_back: 0, H_s_m: 9,
    D_x: 0, D_y: 0, D_r: 0, D_d: 255,
    level_end: false,
    llaves: 0, pot: 0, armadura: 0,
    combate: false, magia: false, repulsivo: false, invisible: false,
  };
}

function makeEnemy() {
  return {
    X: 0, Y: 0,
    direccion: 0, secuencia: 0, ultimo: 255, aburrido: 50, s_m: 99,
    Fmax: 7,
    D_x: 0, D_y: 0, D_r: 0, puntos: 0, D_d: 255,
    vel: 0, tipo: 0, F_cuerpo: 0, F_disparo: 0,
    energia: 0,
  };
}

function makeGenerator() { return { X: 0, Y: 0, energia: 0, tipo: 0, vel: 7 }; }

export const E = {
  // Buffers de píxeles (índices de paleta), 16 filas de margen como el C
  Pvirtual: new Uint8Array(MAX_X * (MAX_Y + 16)),
  Pfondo: new Uint8Array(MAX_X * (MAX_Y + 16)),

  // Paleta (768 B = 256 RGB de 6 bits) y copia de seguridad
  paleta: new Uint8Array(768),
  paletaBack: new Uint8Array(768),

  // Assets crudos (cargados por assets.js con .set)
  baldosas: new Uint8Array(189696),   // FONDO.1: 741 tiles 16x16
  anima: new Uint8Array(121515),      // ANIMA.FRM
  mobj: new Uint8Array(1280),         // MOBJ.DAT: 5 iconos 16x16
  miniFNT: new Uint8Array(2048),
  midleFNT: new Uint8Array(10098),
  bigFNT: new Uint8Array(33255),
  nubes: new Uint8Array(24071),       // NUBES.DAT: 9 sprites concatenados

  // Mapa actual (tamaño máximo: 85x85; solo se usan ancho*alto celdas)
  ancho: 0, alto: 0,
  mapa: new Uint16Array(7225),
  propiedad: new Uint8Array(7225),
  topeX: 0, topeY: 0,

  // Cámara
  absolutoX: 0, absolutoY: 0,
  mapaX: 0, mapaY: 0,
  posenbaldosaX: 0, posenbaldosaY: 0,

  // Tiempo / contadores
  veces: 0,
  tic: 0,
  Tpuertas: 0,
  crono: -1,
  cr_ini: 0,          // ticks totales del crono de poderes

  // Banderas y "registros" globales del C
  marcador: 1,        // char marcador=1 (HUD activo por defecto)
  gameOverFlag: false,
  inmovil: false, inmune: false,
  level_ac: 0,
  levelList: null,    // null = niveles en orden; si no, lista barajada 1..15 (modo ALEATORIO)
  reposo: true,       // reposo=TRUE inicial (JUEGO.CC:166)
  jug: 1,             // jug=1 inicial
  rota: 0, rota_s: 0,
  ruleta: 0,
  num: 9999, gn: 0,   // índices globales de los bucles del C
  backx: 0, backy: 0, backs: 0, // backup de posición/animación de enemigos

  // Teclado (KeyTable por scancode DOS)
  keys: new Uint8Array(128),

  // Rectángulos auxiliares del C (YO, EL)
  YO: { x1: 0, y1: 0, x2: 0, y2: 0 },
  EL: { x1: 0, y1: 0, x2: 0, y2: 0 },

  // struct bicho play[2]  (D_d=255 = disparo libre)
  play: [makePlayer(), makePlayer()],

  // struct enemigos enemigo[299]  (s_m=99: slot "libre", como en carga_level)
  enemigo: Array.from({ length: max_ene }, makeEnemy),

  // struct house generador[50+5]
  generador: Array.from({ length: 55 }, makeGenerator),
  max_gen: 0,

  // struct Tnube nube[9] (NUBES_MAX)
  nube: Array.from({ length: 9 }, () => ({ off: 0, Lx: 0, Ly: 0, x: 0, y: 0, activa: false, vel: 1 })),
};
