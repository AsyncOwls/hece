import '@fontsource/comfortaa/400.css';
import '@fontsource/comfortaa/700.css';
import { FONT } from './theme';

/** Pixi yazıları canvas'a çizer; font yüklenmeden çizilirse yedek font görünür. */
export function loadFonts() {
  return Promise.all([
    document.fonts.load(`700 92px ${FONT}`, 'ğüşıöçİ'),
    document.fonts.load(`400 40px ${FONT}`, 'ğüşıöçİ'),
  ]);
}
