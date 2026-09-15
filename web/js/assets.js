// Carga de assets + parsers binarios (carga()/cargaFNT()/carga_level()/disk_paleta() del C)
import { E } from './estado.js';
import { initEnemyType } from './enemigos.js';
import { initNubes } from './nubes.js';

async function fetchBuf(name) {
  const res = await fetch('assets/' + name);
  if (!res.ok) throw new Error('Falta el fichero assets/' + name + ' (' + res.status + ')');
  return new Uint8Array(await res.arrayBuffer());
}

// Carga los assets de una vez (equivale a carga() + cargaFNT() + disk_paleta())
export async function fetchAssets() {
  const [paleta, fondo, anima, mobj, mini, midle, big, nubes, abc] = await Promise.all([
    fetchBuf('PALETA.1'), fetchBuf('FONDO.1'), fetchBuf('ANIMA.FRM'),
    fetchBuf('MOBJ.DAT'), fetchBuf('MINI.FNT'), fetchBuf('MIDLE.FNT'), fetchBuf('BIG.FNT'),
    fetchBuf('NUBES.DAT'), fetchBuf('ABC.FNT'),
  ]);

  // paleta: 768 bytes = 256 RGB de 6 bits; copia de seguridad (disk_paleta)
  E.paleta = new Uint8Array(768);
  E.paleta.set(paleta);
  E.paletaBack = new Uint8Array(768);
  E.paletaBack.set(paleta);

  E.baldosas = fondo;               // 741 tiles 16x16, sin transparencia
  E.anima = anima;                  // bloques de sprites (ver ctes.SPR)
  E.mobj = mobj;                    // 5 iconos 16x16
  E.miniFNT = mini;                 // 256 glifos 8x8, 1bpp MSB-first (condensada)
  E.midleFNT = midle;               // glifos 9x11 con paleta (offset (ch-33)*99)
  E.bigFNT = big;                   // 93 glifos 52x55, 1bpp bit-contiguo
  E.abcFNT = abc;                   // 80 glifos 16x16 desde ASCII '0' (números limpios)
  E.nubes.set(nubes);               // 9 sprites de nubes concatenados
  initNubes();                      // offsets + velocidades aleatorias
}

// DAC2PTR (JUEGO.CC:1069): cabecera Xmax,Ymax,bytes,haypaleta (7 B) + filas RLE
// de `bytes` píxeles; si haypaleta==1, paleta de 768 B al final (disk_paleta).
export async function loadDAC(name) {
  const b = await fetchBuf(name);
  const Xmax = b[0] | (b[1] << 8), Ymax = b[2] | (b[3] << 8), bytes = b[4] | (b[5] << 8);
  const haypaleta = b[6];
  let ctrl = 7, off = 0;
  const pix = new Uint8Array(bytes * Ymax);
  for (let i = 0; i < Ymax; i++) {
    let n = 0;
    while (n < bytes) {
      const c = b[ctrl++];
      if ((c & 192) === 192) { // carácter de control de repetición
        const run = c & 63;
        n += run;
        const v = b[ctrl++];
        for (let w = 0; w < run; w++) pix[off++] = v;
      } else { n++; pix[off++] = c; }
    }
  }
  const pal = haypaleta === 1 ? b.subarray(b.length - 768) : null;
  return { w: bytes, h: Ymax, Xmax, pix, pal };
}

// Fichero crudo sin parsear (fuente ABC)
export async function loadRaw(name) {
  return fetchBuf(name);
}

// carga_level(): parsea MAPA.n (u16 ancho | u16 alto | s32 H_x | s32 H_y |
// mapa[ancho*alto] u16 | propiedad[ancho*alto] u8 | 50 generadores | 100 enemigos)
export async function loadLevel(n) {
  const buf = await fetchBuf('MAPA.' + n);
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  E.ancho = v.getUint16(0, true);
  E.alto = v.getUint16(2, true);
  E.play[0].H_x = v.getInt32(4, true);
  E.play[0].H_y = v.getInt32(8, true);

  const celdas = E.ancho * E.alto;
  let off = 12;
  E.mapa = new Uint16Array(celdas);
  for (let i = 0; i < celdas; i++) { E.mapa[i] = v.getUint16(off, true); off += 2; }
  E.propiedad = new Uint8Array(celdas);
  for (let i = 0; i < celdas; i++) { E.propiedad[i] = buf[off]; off++; }

  // Generadores: (X,Y,tipo); (0,0)=vacío. Energía por tipo (MAGO 10, SOLDADO 20, FANTASMA 30)
  E.max_gen = 0;
  for (let gn = 0; gn < 50; gn++) {
    const X = v.getInt32(off, true); off += 4;
    const Y = v.getInt32(off, true); off += 4;
    const tipo = buf[off]; off++;
    const g = E.generador[gn];
    g.X = X; g.Y = Y; g.tipo = tipo;
    if (X !== 0 || Y !== 0) {
      g.energia = (tipo === 1 ? 10 : tipo === 0 ? 20 : tipo === 2 ? 30 : 10);
      E.max_gen++;
    } else {
      g.energia = 0;
    }
  }
  E.max_gen++; // quirk del original: un generador fantasma inofensivo

  // Enemigos iniciales: init_personaje solo si (X,Y)!=(0,0)
  for (let num = 0; num < 100; num++) {
    const X = v.getInt32(off, true); off += 4;
    const Y = v.getInt32(off, true); off += 4;
    const tipo = buf[off]; off++;
    E.enemigo[num].X = X; E.enemigo[num].Y = Y; E.enemigo[num].tipo = tipo;
    if (X !== 0 || Y !== 0) initEnemyType(num, tipo);
  }
  // (el fichero termina con 25 bytes de autor que el juego no lee)

  // ALEATORIO -> objeto aleatorio, VOID -> vacío
  for (let i = 0; i < celdas; i++) {
    if (E.propiedad[i] === 200) E.propiedad[i] = 0;
    else if (E.propiedad[i] === 99) E.propiedad[i] = ((Math.random() * 8) | 0) + 100;
  }
  E.topeX = E.ancho * 16 - 640;
  E.topeY = E.alto * 16 - 400;
}
