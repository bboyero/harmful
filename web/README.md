# HARMFUL — Port a JavaScript (hito 1)

## Android

- **PWA instalable**: con el juego servido, Chrome/Edge en Android ofrecen "Añadir a
  pantalla de inicio" — se instala a pantalla completa en apaisado con el icono de
  HARM.GIF y funciona sin conexión (service worker).
- **Controles táctiles**: cruceta a la izquierda, DISPARO (●) y POCIÓN (P) a la
  derecha; aparecen automáticamente en dispositivos táctiles (o con `?touch=1` en PC).
- **APK para Play Store**: el proyecto Capacitor está en `../android-cap/` (appId
  `com.boyero.harmful`). Con Android Studio instalado: abrir la carpeta `android-cap/`,
  dejar que Gradle se sincronice, y compilar `gradlew.bundleRelease` (o
  Build → Generate Signed Bundle/APK desde Studio). El webDir es `../web`.

Port 1:1 del juego DOS HARMFUL (1997) a JavaScript vanilla + Canvas 2D, sin dependencias ni build.

## Cómo ejecutar

Los `fetch` y los ES modules no funcionan con `file://`. Hay que servir con un servidor estático:

```
python -m http.server 8000 --directory C:\disketes\harmful\web
```

y abrir `http://localhost:8000` (Chrome o Firefox).

## Controles

| Tecla | Acción |
|---|---|
| Flechas | Moverse (8 direcciones, estilo Jet Set Willy) |
| Espacio | Disparar |
| 0 (numérico) | Lanzar poción |
| F1 | Alternar marcador (HUD) |
| Escape | Salir |

Parámetros de URL: `?mapa=N` para empezar en otro nivel (por defecto 1).

## Sonido

Los 17 samples de SONIDO.DAT (PCM 8-bit a 8 kHz) se reproducen con WebAudio, con la
misma semántica que el Sound Blaster original: monofónico, un sonido nuevo corta al
anterior. Los navegadores exigen un gesto del usuario para activar el audio — pulsa
cualquier tecla o haz clic para desbloquearlo.

## Desviaciones conocidas respecto al original

- El juego corre a paso fijo de 18,2065 Hz (como el PIT de DOS) y se renderiza a 60 fps.
- Los niveles se cargan en decimal (el original usaba `MAPA.%x` en hex, lo que hacía inalcanzables los niveles 10-15).
- RNG con `Math.random()` (el original no hacía `srand`).
- Flood-fill de puertas/trampas iterativo (mismo resultado, sin riesgo de stack overflow).
- Sin el desbordamiento benigno del slot de enemigo 299.
- Sin menús animados (.DAC) ni intro (ABC) — iteraciones futuras.
- Los flashes de poción/mina duran 20 ms vía setTimeout (en el C bloqueaban con delay(20)).
