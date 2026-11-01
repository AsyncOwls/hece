import '@fontsource/andika/400.css';
import '@fontsource/andika/700.css';
import { Game } from './game';
import { FONT } from './theme';
import { MenuScene } from './scenes/MenuScene';

async function start() {
  // Pixi yazıları canvas'a çizer; font yüklenmeden çizilirse yedek font görünür.
  await Promise.all([
    document.fonts.load(`700 92px ${FONT}`, 'ğüşıöçİ'),
    document.fonts.load(`400 40px ${FONT}`, 'ğüşıöçİ'),
  ]);
  const game = new Game();
  await game.init();
  game.go((g) => new MenuScene(g));
  if (import.meta.env.DEV) Object.assign(window, { game });
}

void start();
