// Teclado — InitTeclado/NewInt09 de KEY.CC: KeyTable booleano por scancode DOS
import { E } from './estado.js';
import { SCANCODE_MAP } from './ctes.js';

const PREVENT = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F1']);

export function initKeyboard() {
  window.addEventListener('keydown', (e) => {
    const sc = SCANCODE_MAP[e.code];
    if (sc !== undefined) {
      E.keys[sc] = 1;
      if (PREVENT.has(e.code)) e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => {
    const sc = SCANCODE_MAP[e.code];
    if (sc !== undefined) E.keys[sc] = 0;
  });
  // DOS no pierde el foco; en el navegador limpiamos la tabla para no dejar teclas pegadas
  window.addEventListener('blur', () => E.keys.fill(0));
}
