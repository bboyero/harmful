# Convierte frame.raw (640x400 índices) + paleta.raw (768 B RGB 6 bits) a PNG truecolor
import sys, zlib, struct

def png_chunk(tag, data):
    return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

def raw2png(raw_path, pal_path, out_path):
    with open(raw_path, 'rb') as f: pix = f.read()
    with open(pal_path, 'rb') as f: pal = f.read()
    w, h = 640, 400
    assert len(pix) == w * h and len(pal) == 768

    # LUT RGB de 8 bits: (v<<2)|(v>>4)
    lut = [bytes((r << 2 | r >> 4, g << 2 | g >> 4, b << 2 | b >> 4))
           for r, g, b in zip(pal[0::3], pal[1::3], pal[2::3])]

    ihdr = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)  # 8-bit RGB (tipo 2)
    raw = b''.join(b'\x00' + b''.join(lut[p] for p in pix[y * w:(y + 1) * w])
                   for y in range(h))  # filtro 0 por fila

    out = (b'\x89PNG\r\n\x1a\n'
           + png_chunk(b'IHDR', ihdr)
           + png_chunk(b'IDAT', zlib.compress(raw, 9))
           + png_chunk(b'IEND', b''))
    with open(out_path, 'wb') as f: f.write(out)
    print(f'{out_path}: {len(out)} bytes')

if __name__ == '__main__':
    raw2png(sys.argv[1], sys.argv[2], sys.argv[3])
