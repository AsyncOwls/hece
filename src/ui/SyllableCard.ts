import { Container, Graphics, Text } from 'pixi.js';
import { C, label } from '../theme';
import { tween } from '../tween';

export const CARD_H = 150;
export const CARD_FONT = 92;

/** Kartın genişliği: en uzun hece sığacak kadar (turdaki tüm kartlar aynı genişlikte). */
export function cardWidthFor(texts: string[]): number {
  const t = label('', CARD_FONT);
  let max = 0;
  for (const s of texts) {
    t.text = s;
    max = Math.max(max, t.width);
  }
  t.destroy();
  return Math.max(170, Math.ceil(max + 70));
}

type CardState = 'idle' | 'correct' | 'wrong' | 'merged';

export class SyllableCard extends Container {
  readonly syllable: string;
  readonly w: number;
  readonly color: number;
  home = { x: 0, y: 0 };
  private bg = new Graphics();
  private txt: Text;

  constructor(syllable: string, color: number, width: number) {
    super();
    this.syllable = syllable;
    this.color = color;
    this.w = width;
    this.txt = label(syllable, CARD_FONT, color);
    this.txt.y = -6;
    this.addChild(this.bg, this.txt);
    this.setState('idle');
    this.eventMode = 'static';
    this.cursor = 'grab';
  }

  setState(state: CardState) {
    const w = this.w;
    const h = CARD_H;
    const stroke = { idle: C.ink, correct: C.green, wrong: C.red, merged: C.green }[state];
    const fill = { idle: C.white, correct: 0xeaf7ec, wrong: 0xfde8e8, merged: 0xeaf7ec }[state];
    this.bg.clear();
    if (state !== 'merged') this.bg.roundRect(-w / 2, -h / 2 + 6, w, h, 22).fill({ color: 0x000000, alpha: 0.12 });
    this.bg.roundRect(-w / 2, -h / 2, w, h, 22).fill(fill).stroke({ width: state === 'idle' ? 4 : 6, color: stroke });
    if (state === 'merged') this.bg.visible = false;
    else this.bg.visible = true;
  }

  get textWidth() {
    return this.txt.width;
  }

  goHome(ms = 320) {
    this.setState('idle');
    return tween(this, { x: this.home.x, y: this.home.y, scale: 1 }, ms);
  }
}

/** Hecenin bırakılacağı boş kutu. */
export class Slot extends Container {
  readonly expected: string;
  readonly w: number;
  card: SyllableCard | null = null;
  private bg = new Graphics();

  constructor(expected: string, width: number) {
    super();
    this.expected = expected;
    this.w = width;
    this.addChild(this.bg);
    this.highlight(false);
  }

  highlight(on: boolean) {
    const w = this.w + 16;
    const h = CARD_H + 16;
    this.bg.clear();
    this.bg
      .roundRect(-w / 2, -h / 2, w, h, 28)
      .fill({ color: on ? 0xfff4c2 : 0xffffff, alpha: on ? 1 : 0.6 })
      .stroke({ width: 5, color: on ? C.yellow : C.line });
  }

  contains(x: number, y: number) {
    return Math.abs(x - this.x) < this.w / 2 + 50 && Math.abs(y - this.y) < CARD_H / 2 + 60;
  }
}
