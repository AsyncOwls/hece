import { loadFonts } from './boot';
import { Game } from './game';
import { decodeShared } from './share';
import { DEFAULTS } from './settings';
import { SentenceScene } from './scenes/SentenceScene';
import { SkyScene } from './scenes/SkyScene';
import { StartScene } from './scenes/StartScene';

/**
 * Paylaşılan oyun: play.html?data=… adresindeki ayarlarla, öğretmen menüsü
 * olmadan açılır. Öğretmenin tarayıcıdaki kayıtlarına dokunmaz.
 */
async function start() {
  await loadFonts();
  const data = new URLSearchParams(location.search).get('data');
  const settings = data ? decodeShared(data) : null;
  const game = new Game({ settings: settings ?? DEFAULTS, persist: false });
  await game.init();

  if (!settings) {
    game.go((g) => new StartScene(g, 'Bu oyun adresi eksik ya da bozuk.\nÖğretmeninizden yeni bir adres isteyin.'));
  } else if (settings.tab === 'sentence') {
    game.go((g) => new StartScene(g, 'Cümle Okuyorum', (g2) => new SentenceScene(g2)));
  } else {
    game.go((g) => new StartScene(g, 'Hece Birleştir', (g2) => new SkyScene(g2)));
  }
  if (import.meta.env.DEV) Object.assign(window, { game });
}

void start();
