import { Container, Graphics, Text } from 'pixi.js';
import type { Game, Scene } from '../game';
import { Button } from '../ui/Button';
import { aquarium } from '../ui/aquarium';
import { confetti } from '../ui/confetti';
import type { Creature } from '../ui/habitat';
import { checkIcon, playIcon, speakerIcon } from '../ui/icons';
import { TeacherGear } from '../ui/TeacherGear';
import { C, H, W, label, shuffle } from '../theme';
import { easeOutBack, tween, wait } from '../tween';
import { canRead, sfx, speak } from '../audio';
import { sentencePool } from './common';
import { MenuScene } from './MenuScene';

const FONT_SIZE = 96;
const LINE_H = 132;
const MAX_LINE = 1440;
const CARD_Y = 400;

/**
 * Cümle Okuyorum: akvaryumdaki balıklardan hangisine dokunulursa dokunulsun
 * havuzdan sıradaki yeni cümle büyük yazıyla çıkar; çocuk okuyup ✓'e
 * basar. Havuz bitene kadar cümle tekrar etmez; bitince "Aferin!".
 */
export class SentenceScene implements Scene {
  view = new Container();
  private creatures: Creature[];
  /** Bu turda sırayla çıkacak cümleler (karışık). */
  private queue: string[];
  private next = 0;
  private overlay = new Container();
  private panel: { view: Container; sentence: string } | null = null;
  private finished = false;
  private alive = true;

  constructor(private game: Game) {
    const habitat = aquarium();
    this.queue = shuffle(sentencePool(game.settings));
    this.creatures = habitat.spawn(Math.min(game.settings.creatures, habitat.max));

    const layer = new Container();
    this.creatures.forEach((c, i) => {
      layer.addChild(c);
      c.on('pointertap', () => this.open(i));
    });
    const gear = new TeacherGear(() => this.toMenu());
    gear.position.set(W - 70, 70);
    this.view.addChild(habitat.back, layer, habitat.front, this.overlay, gear);

    if (this.queue.length === 0) {
      const t = label('Bu seçimle cümle yok.\nAyarlar için sağ üstteki çarka basılı tutun.', 52, C.ink);
      const bg = new Graphics().roundRect(-620, -110, 1240, 220, 32).fill({ color: 0xffffff, alpha: 0.92 });
      bg.position.set(W / 2, CARD_Y);
      t.position.set(W / 2, CARD_Y);
      this.overlay.addChild(bg, t);
    }
  }

  private open(index: number) {
    if (this.panel || this.finished || this.queue.length === 0) return;
    const creature = this.creatures[index];
    creature.react();
    const sentence = this.queue[this.next];

    const view = new Container();
    const dim = new Graphics().rect(-W, -H, 3 * W, 3 * H).fill({ color: 0x0b1a33, alpha: 0.45 });
    dim.eventMode = 'static';
    view.addChild(dim);

    const card = this.sentenceCard(sentence);
    // Düğmeler kartın altına; yükseklik kart küçültülmeden ölçülür.
    const by = CARD_Y + card.height / 2 + 125;
    card.position.set(creature.x, creature.y);
    card.scale.set(0.15);
    view.addChild(card);
    void tween(card, { x: W / 2, y: CARD_Y, scale: 1 }, 480, easeOutBack);

    const buttons: Button[] = [];
    if (canRead()) {
      buttons.push(
        new Button({ width: 170, height: 170, radius: 85, color: C.blue, icon: speakerIcon(C.white), onTap: () => speak(sentence, 0.75) }),
      );
    }
    buttons.push(new Button({ width: 170, height: 170, radius: 85, color: C.green, icon: checkIcon(C.white), onTap: () => this.close() }));
    buttons.forEach((b, i) => {
      b.position.set(W / 2 + (i - (buttons.length - 1) / 2) * 230, by);
      b.scale.set(0.2);
      view.addChild(b);
      void wait(300).then(() => {
        if (!b.destroyed) void tween(b, { scale: 1 }, 380, easeOutBack);
      });
    });

    this.overlay.addChild(view);
    this.panel = { view, sentence };
  }

  /** Cümle kartı: kelimeler ayrı ayrı; dokunulan kelime okunur. (0, 0) kartın ortası. */
  private sentenceCard(sentence: string): Container {
    const card = new Container();
    const words = sentence.split(' ').map((w) => label(w, FONT_SIZE, C.ink));
    const space = FONT_SIZE * 0.36;
    const lines: Text[][] = [[]];
    let width = 0;
    for (const t of words) {
      const line = lines[lines.length - 1];
      if (line.length && width + space + t.width > MAX_LINE) {
        lines.push([t]);
        width = t.width;
      } else {
        width += (line.length ? space : 0) + t.width;
        line.push(t);
      }
    }
    const lineWidths = lines.map((l) => l.reduce((sum, t) => sum + t.width, 0) + space * (l.length - 1));
    const w = Math.max(...lineWidths) + 160;
    const h = lines.length * LINE_H + 100;
    const bg = new Graphics();
    bg.roundRect(-w / 2, -h / 2 + 10, w, h, 44).fill({ color: 0x000000, alpha: 0.18 });
    bg.roundRect(-w / 2, -h / 2, w, h, 44).fill(C.white).stroke({ width: 8, color: C.yellow });
    card.addChild(bg);

    lines.forEach((line, li) => {
      let x = -lineWidths[li] / 2;
      const y = -h / 2 + 50 + LINE_H * (li + 0.5) - 6;
      for (const t of line) {
        t.position.set(x + t.width / 2, y);
        x += t.width + space;
        card.addChild(t);
        t.eventMode = 'static';
        t.cursor = 'pointer';
        t.on('pointertap', () => {
          if (!canRead()) return;
          speak(t.text.replace(/[^\p{L}]/gu, ''), 0.75);
          t.style.fill = C.blue;
          void wait(700).then(() => !t.destroyed && (t.style.fill = C.ink));
        });
      }
    });
    return card;
  }

  private close() {
    const panel = this.panel;
    if (!panel) return;
    this.panel = null;
    speechSynthesis?.cancel();
    void tween(panel.view, { alpha: 0 }, 250).then(() => panel.view.destroy({ children: true }));
    sfx.correct();
    this.next++;
    if (this.next >= this.queue.length) void wait(600).then(() => this.alive && this.finale());
  }

  private finale() {
    this.finished = true;
    sfx.win();
    this.creatures.forEach((c, i) => void wait(i * 150).then(() => this.alive && c.react()));

    const t = label('Aferin!', 130, C.red);
    const bg = new Graphics();
    bg.roundRect(-t.width / 2 - 90, -120, t.width + 180, 240, 60).fill(C.white).stroke({ width: 8, color: C.yellow });
    const card = new Container();
    card.addChild(bg, t);
    card.position.set(W / 2, CARD_Y);
    card.scale.set(0.3);
    this.overlay.addChild(card);
    void tween(card, { scale: 1 }, 500, easeOutBack);
    confetti(this.view, W / 2 - 400, CARD_Y, 70);
    confetti(this.view, W / 2 + 400, CARD_Y, 70);

    const again = new Button({ width: 200, height: 200, radius: 100, color: C.green, icon: playIcon(C.white), onTap: () => this.again() });
    again.position.set(W / 2, CARD_Y + 300);
    again.scale.set(0.2);
    this.overlay.addChild(again);
    void wait(600).then(() => {
      if (!again.destroyed) void tween(again, { scale: 1 }, 450, easeOutBack);
    });
  }

  private again() {
    this.game.go((g) => new SentenceScene(g));
  }

  private toMenu() {
    this.game.go((g) => new MenuScene(g));
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') this.toMenu();
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (this.panel) this.close();
      else if (this.finished) this.again();
    }
  }

  destroy() {
    this.alive = false;
    speechSynthesis?.cancel();
  }
}
