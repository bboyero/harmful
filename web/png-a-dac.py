# Convierte un PNG a .DAC (formato del juego): encaja la imagen sin deformar
# en la resolución pedida (centrada sobre negro), la cuantiza con la paleta
# del juego (assets/PALETA.1, Floyd-Steinberg) y codifica el RLE + paleta.
# Uso: python png-a-dac.py entrada.png salida.DAC [ancho alto]   (desde web/)
import struct, sys
from PIL import Image

W, H = 640, 400
src, dst = sys.argv[1], sys.argv[2]
if len(sys.argv) > 3:
    W, H = int(sys.argv[3]), int(sys.argv[4])

pal_bytes = open('assets/PALETA.1', 'rb').read(768)
pimg = Image.new('P', (1, 1))
pimg.putpalette(pal_bytes)

img = Image.open(src).convert('RGB')
esc = min(W / img.width, H / img.height)
img = img.resize((round(img.width * esc), round(img.height * esc)), Image.LANCZOS)
lienzo = Image.new('RGB', (W, H), (0, 0, 0))
lienzo.paste(img, ((W - img.width) // 2, (H - img.height) // 2))

q = lienzo.quantize(colors=256, palette=pimg, dither=Image.Dither.FLOYDSTEINBERG)
px = q.tobytes()

out = bytearray(struct.pack('<HHHB', W, H, W, 1))  # Xmax, Ymax, bytes, haypaleta
for y in range(H):
    fila = px[y * W:(y + 1) * W]
    i = 0
    while i < W:
        j = i + 1
        while j < W and fila[j] == fila[i] and j - i < 63:
            j += 1
        run, v = j - i, fila[i]
        if run >= 2:
            out += bytes((192 + run, v))
        elif v >= 192:      # un literal con los bits altos a 1 se leería como control
            out += bytes((193, v))
        else:
            out.append(v)
        i = j
out += pal_bytes
open(dst, 'wb').write(bytes(out))
print(dst, len(out), 'bytes')
