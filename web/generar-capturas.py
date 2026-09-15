# Convierte las capturas .raw a PNG 1280x800 (2x, vecino más cercano) y crea
# el feature graphic 1024x500 desde HARM.GIF. Requiere raw2png + PIL.
import subprocess, sys
from PIL import Image

def raw_a_png(raw, png):
    # reutiliza raw2png (paletizado a RGB) y luego escala 2x
    subprocess.run([sys.executable, 'raw2png.py', raw, 'paleta-para-capturas.raw', png],
                   check=True, capture_output=True)

# paleta de respaldo para las capturas (PALETA.1 real)
with open('assets/PALETA.1', 'rb') as f:
    pal = f.read()
with open('paleta-para-capturas.raw', 'wb') as f:
    f.write(pal)

for base in ['cap-splash', 'cap-juego', 'cap-disparo', 'cap-gameover']:
    tmp = base + '.png'
    raw_a_png(base + '.raw', tmp)
    img = Image.open(tmp)
    img = img.resize((1280, 800), Image.NEAREST)
    img.save('playstore/' + base + '.png')
    print('playstore/' + base + '.png')

# feature graphic 1024x500: el arte de HARM.GIF centrado en fondo negro
src = Image.open('../HARM.GIF').convert('RGBA')
alto = 500
ancho = int(src.width * alto / src.height)
src = src.resize((ancho, alto), Image.LANCZOS)
fondo = Image.new('RGBA', (1024, 500), (0, 0, 0, 255))
fondo.paste(src, ((1024 - ancho) // 2, 0), src)
fondo.convert('RGB').save('playstore/feature-graphic.png')
print('playstore/feature-graphic.png')
