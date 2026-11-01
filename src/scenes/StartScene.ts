import { Container } from 'pixi.js';
import type { Game, Scene } from '../game';
import { Button } from '../ui/Button';
import { playIcon } from '../ui/icons';
import { C, W, label } from '../theme';
import { easeOutBack, tween } from '../tween';

/**
 * Paylaşılan oyunun (play.html) açılış ekranı: başlık ve büyük ▶. Tarayıcılar
 * dokunuş olmadan ses çaldırmadığı için oyun bu dokunuşla başlar. `start`
 * verilmezse yalnızca mesaj gösterir (bozuk adres).
 */
export class StartScene implements Scene {
  view = new Container();

  constructor(
    private game: Game,
    title: string,
    private start?: (game: Game) => Scene,
  ) {
    const t = label(title, start ? 110 : 52, start ? C.red : C.ink);
    t.position.set(W / 2, start ? 330 : 500);
    this.view.addChild(t);
    if (!start) return;

    const play = new Button({ width: 260, height: 260, radius: 130, color: C.green, icon: playIcon(C.white, 70), onTap: () => this.go() });
    play.position.set(W / 2, 640);
    play.scale.set(0.3);
    this.view.addChild(play);
    void tween(play, { scale: 1 }, 500, easeOutBack);
  }

  private go() {
    if (this.start) this.game.go(this.start);
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') this.go();
  }

  destroy() {}
}
