import { loadFonts } from './boot';
import { Game } from './game';
import { MenuScene } from './scenes/MenuScene';

async function start() {
  await loadFonts();
  const game = new Game();
  await game.init();
  game.home = (g) => new MenuScene(g);
  game.goHome();
  if (import.meta.env.DEV) Object.assign(window, { game });
}

void start();
