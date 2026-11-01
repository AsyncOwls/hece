import { Container, Graphics, Text } from 'pixi.js';
import { C, darken, label } from '../theme';
import { sfx } from '../audio';
import { tween } from '../tween';

export interface ButtonOptions {
  text?: string;
  width: number;
  height: number;
  color: number;
  textColor?: number;
  fontSize?: number;
  radius?: number;
  /** Etiketin soluna çizilecek ikon. */
  icon?: Graphics;
  /** Dolu yerine beyaz zemin + renkli kenar. */
  outline?: boolean;
  onTap: () => void;
}

/** Ortası (0,0) olan, basınca küçülen büyük dokunmatik buton. */
export class Button extends Container {
  private bg = new Graphics();
  private txt?: Text;
  private opts: ButtonOptions;

  constructor(opts: ButtonOptions) {
    super();
    this.opts = opts;
    this.addChild(this.bg);

    if (opts.icon) this.addChild(opts.icon);
    if (opts.text !== undefined) {
      this.txt = label(opts.text, opts.fontSize ?? 48, this.fg());
      this.addChild(this.txt);
    }
    this.layoutContent();
    this.draw();

    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerdown', () => void tween(this, { scale: 0.94 }, 80));
    this.on('pointerup', () => void tween(this, { scale: 1 }, 120));
    this.on('pointerupoutside', () => void tween(this, { scale: 1 }, 120));
    this.on('pointertap', () => {
      sfx.click();
      opts.onTap();
    });
  }

  private fg() {
    return this.opts.textColor ?? (this.opts.outline ? this.opts.color : C.white);
  }

  private layoutContent() {
    const { icon } = this.opts;
    if (icon && this.txt) {
      const gap = 18;
      const total = icon.width + gap + this.txt.width;
      icon.position.set(-total / 2 + icon.width / 2, 0);
      this.txt.position.set(-total / 2 + icon.width + gap + this.txt.width / 2, 0);
    }
  }

  private draw() {
    const { width: w, height: h, color, outline } = this.opts;
    const r = this.opts.radius ?? 28;
    this.bg.clear();
    this.bg.roundRect(-w / 2, -h / 2 + 7, w, h, r).fill(darken(color, outline ? 0.9 : 0.7));
    if (outline) {
      this.bg.roundRect(-w / 2, -h / 2, w, h, r).fill(C.white).stroke({ width: 5, color });
    } else {
      this.bg.roundRect(-w / 2, -h / 2, w, h, r).fill(color);
    }
  }

  setColor(color: number, outline = this.opts.outline) {
    this.opts.color = color;
    this.opts.outline = outline;
    if (this.txt) this.txt.style.fill = this.fg();
    this.draw();
  }

  setText(text: string) {
    if (!this.txt) return;
    this.txt.text = text;
    this.layoutContent();
  }
}
