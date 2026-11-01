import { Container, Text } from 'pixi.js';
import { Button } from './Button';
import { backIcon, fullscreenIcon, starIcon } from './icons';
import { C, W, label } from '../theme';
import { tween, easeOutBack } from '../tween';
import type { Game } from '../game';

export class TopBar extends Container {
  private starText: Text;
  private star = starIcon(C.yellow, 34);

  constructor(game: Game, title: string, onBack: () => void) {
    super();
    const back = new Button({ width: 110, height: 100, color: C.ink, outline: true, icon: backIcon(C.ink), onTap: onBack });
    back.position.set(85, 70);

    const t = label(title, 44, C.muted);
    t.position.set(W / 2, 62);

    this.star.position.set(W - 290, 70);
    this.starText = label(String(game.stars), 56, C.ink);
    this.starText.anchor.set(0, 0.5);
    this.starText.position.set(W - 245, 66);

    const fs = new Button({ width: 110, height: 100, color: C.ink, outline: true, icon: fullscreenIcon(C.ink), onTap: () => game.toggleFullscreen() });
    fs.position.set(W - 85, 70);

    this.addChild(back, t, this.star, this.starText, fs);
  }

  async setStars(n: number) {
    this.starText.text = String(n);
    this.star.scale.set(1.6);
    await tween(this.star, { scale: 1 }, 500, easeOutBack);
  }
}
