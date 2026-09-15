// Constantes del original (CTES.CC + #defines de JUEGO.CC / ENEMIGOS.CC / GENERADO.CC)
export const MAX_X = 640;
export const MAX_Y = 400;           // M_VIDEO=1 (VESA 0x100, 640x400x256)
export const PLAYERS = 1;
export const TICS_SEG = 18;
export const TICK_MS = 1000 / 18.2065;  // PIT DOS: 1193180/65536 Hz

export const VEL = 4;
export const GRADIENTE = 128;
export const SOLx = 4;
export const SOLy = 4;

// Propiedades de baldosa
export const H2O = 1, SLD = 2, MINA = 3;
export const desDER = 4, desIZQ = 5, desARR = 6, desABJ = 7;
export const FRGL = 10;
export const EXT = 255, GEN = 254, DOOR = 253, TRAMPA = 252, CABLE = 251,
             SOLIDOF = 250, TRANS = 249, VOID = 200;
export const ALEATORIO = 99, LLAVE = 100, FOOD = 101, FOODF = 102, POTF = 103,
             POT = 104, ARMADURA = 105, COMBATE = 106, MAGIA = 107,
             INMOVIL = 108, INMUNE = 109, REPULSIVO = 110, INVISIBLE = 111,
             VENENO = 120;

export const arma_vel = 15, arma_alcance = 250, arma_fuerza = 20;
export const Pcombate_Max = 12, Pcombate_Min = 6;
export const PUERTAS = 30;
export const rabia = 10;           // ticks entre daño de contacto / disparo del mago

export const max_ene = 299;
export const GEN_MAX = 50;         // generadores por mapa (el mutable está en estado.max_gen)

// Tipos de enemigo
export const SOLDADO = 0, MAGO = 1, FANTASMA = 2, MUERTE = 10;

// Scancodes DOS (KEY.CC / defines de JUEGO.CC)
export const SC_ESC = 0x01, SC_ENTER = 0x1C, SC_ARR = 0x48, SC_IZQ = 0x4B,
             SC_DER = 0x4D, SC_ABJ = 0x50, SC_SPC = 0x39, SC_CERO = 0x52,
             SC_F01 = 0x3B;

// Offsets de ANIMA.FRM (carga() en JUEGO.CC)
export const SPR = {
  camHV: 0,      camHR: 10816,  camHG: 21632,  camHA: 32448,
  camFT: 43264,  camMT: 54080,                 // 13x13, 8 dir x 8 seq
  bola: 64896,                                  // 9x9, 8 dir
  explo: 65544,  explo_b: 67368,                // 19x16, 6 frames
  led: 69192,                                   // 11x33, 2 frames
  cursor: 69918,                                // 63x63 (no usado en hito 1)
};

// MOBJ.DAT: iconos 16x16 del marcador
export const MOBJ = { mkey: 0, mpot: 256, mmagia: 512, marmadura: 768, mcombate: 1024 };

// Mapa KeyboardEvent.code -> scancode DOS (teclas del hito 1)
export const SCANCODE_MAP = {
  Escape: SC_ESC, Enter: SC_ENTER,
  ArrowUp: SC_ARR, ArrowLeft: SC_IZQ, ArrowRight: SC_DER, ArrowDown: SC_ABJ,
  Space: SC_SPC, Numpad0: SC_CERO, F1: SC_F01,
};
