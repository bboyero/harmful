# Genera los assets de la ficha de Play Store a partir del arte original del juego.
# Uso: python generar_assets.py
from PIL import Image
from collections import Counter
import os

OUT = os.path.dirname(os.path.abspath(__file__))

def rgb(im):
    return im.convert('RGB')

def color_fondo(im):
    """Color dominante del borde de la imagen (asume fondo liso)."""
    w, h = im.size
    pix = im.load()
    borde = [pix[x, y] for x in range(w) for y in (0, 1, h-2, h-1)] + \
            [pix[x, y] for y in range(h) for x in (0, 1, w-2, w-1)]
    return Counter(borde).most_common(1)[0][0]

def bbox_contenido(im, fondo, umbral=30):
    """Caja mínima que contiene todo lo que no es el color de fondo."""
    w, h = im.size
    pix = im.load()
    minx, miny, maxx, maxy = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            p = pix[x, y]
            if max(abs(p[0]-fondo[0]), abs(p[1]-fondo[1]), abs(p[2]-fondo[2])) > umbral:
                if x < minx: minx = x
                if x > maxx: maxx = x
                if y < miny: miny = y
                if y > maxy: maxy = y
    return (minx, miny, maxx, maxy) if maxx >= 0 else (0, 0, w-1, h-1)

def escala_relleno(im, ancho, alto):
    """Escala la imagen para cubrir el rectangulo (recorta el sobrante)."""
    w, h = im.size
    escala = max(ancho/w, alto/h)
    im = im.resize((round(w*escala), round(h*escala)), Image.LANCZOS)
    x = (im.width - ancho) // 2
    y = (im.height - alto) // 2
    return im.crop((x, y, x+ancho, y+alto))

harm = rgb(Image.open(r'C:\disketes\harmful\HARM.GIF'))
paisaje = rgb(Image.open(r'C:\disketes\harmful\PAISAJE.GIF'))

# --- Icono 512x512: recorta el logo de HARM.GIF y lo centra sobre fondo ---
fondo = color_fondo(harm)
minx, miny, maxx, maxy = bbox_contenido(harm, fondo)
logo = harm.crop((minx, miny, maxx, maxy))
# cuadrado centrado con el mismo fondo
lado = max(logo.width, logo.height)
cuadrado = Image.new('RGB', (lado, lado), fondo)
cuadrado.paste(logo, ((lado-logo.width)//2, (lado-logo.height)//2))
icono = cuadrado.resize((512, 512), Image.LANCZOS)
icono.save(os.path.join(OUT, 'icono-512.png'))

# --- Feature graphic 1024x500 ---
fg = escala_relleno(paisaje, 1024, 500)
fg.save(os.path.join(OUT, 'feature-1024x500.png'))

# --- Capturas de telefono 1280x720 (16:9) ---
for nombre, im, corte in [
    ('captura-1.png', paisaje, None),
    ('captura-2.png', harm, None),
    ('captura-3.png', paisaje, (0, 0, 640, 400)),  # recorte distinto para variar
]:
    if corte:
        im = im.crop(corte)
    s = escala_relleno(im, 1280, 720)
    s.save(os.path.join(OUT, nombre))

print('Generados:', os.listdir(OUT))
