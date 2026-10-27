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
    # letterbox a 1280x720 (16:9, formato de Play) con barras negras
    fondo = Image.new('RGB', (1280, 720), (0, 0, 0))
    fondo.paste(img, (0, (720 - 800) // 2))
    fondo.save('../android-cap/playstore/' + base + '.png')
    print('../android-cap/playstore/' + base + '.png')

# feature graphic 1024x500: el arte NUEVO del menu (menu.png) con cover-crop
src = Image.open('../menu.png').convert('RGB')
s = max(1024 / src.width, 500 / src.height)
src = src.resize((int(src.width * s), int(src.height * s)), Image.LANCZOS)
x0 = (src.width - 1024) // 2
y0 = (src.height - 500) // 2
src.crop((x0, y0, x0 + 1024, y0 + 500)).save('../android-cap/playstore/feature-graphic.png')
print('../android-cap/playstore/feature-graphic.png')
