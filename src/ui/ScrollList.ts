import { Container, Graphics, Rectangle, type FederatedPointerEvent, type FederatedWheelEvent } from 'pixi.js';
import { C, label } from '../theme';

/**
 * Kaydırılabilir yazı listesi: her öğe kendi satırında, uzunsa alt satıra kayar.
 * Parmakla/fareyle sürükleyerek ya da tekerlekle kaydırılır; sağda ince bir
 * kaydırma çubuğu konumu gösterir. Liste sığıyorsa kaydırma kapalıdır.
 */
export class ScrollList extends Container {
  private content = new Container();
  private bar = new Graphics();
  private max = 0;
  private drag: { y: number; start: number } | null = null;

  constructor(
    items: string[],
    private w: number,
    private h: number,
    opts: { fontSize?: number; gap?: number; offset?: number; onScroll?: (offset: number) => void } = {},
  ) {
    super();
    const fontSize = opts.fontSize ?? 28;
    const gap = opts.gap ?? 12;
    let y = 0;
    for (const item of items) {
      const t = label(item, fontSize, C.muted, { fontWeight: '400', wordWrap: true, wordWrapWidth: w - 40, lineHeight: fontSize * 1.35 });
      t.anchor.set(0.5, 0);
      t.position.set(w / 2, y);
      this.content.addChild(t);
      y += t.height + gap;
    }
    const total = Math.max(0, y - gap);
    this.max = Math.max(0, total - h);

    const mask = new Graphics().rect(0, 0, w, h).fill(0xffffff);
    this.content.mask = mask;
    this.addChild(this.content, mask, this.bar);

    if (this.max > 0) {
      this.eventMode = 'static';
      this.cursor = 'grab';
      this.hitArea = new Rectangle(0, 0, w, h);
      this.on('wheel', (e: FederatedWheelEvent) => {
        e.preventDefault();
        this.scrollTo(-this.content.y + e.deltaY, opts.onScroll);
      });
      this.on('pointerdown', (e: FederatedPointerEvent) => {
        this.drag = { y: this.toLocal(e.global).y, start: -this.content.y };
        this.cursor = 'grabbing';
      });
      this.on('globalpointermove', (e: FederatedPointerEvent) => {
        if (!this.drag) return;
        this.scrollTo(this.drag.start - (this.toLocal(e.global).y - this.drag.y), opts.onScroll);
      });
      const stop = () => {
        this.drag = null;
        this.cursor = 'grab';
      };
      this.on('pointerup', stop);
      this.on('pointerupoutside', stop);
    }
    this.scrollTo(opts.offset ?? 0);
  }

  private scrollTo(offset: number, onScroll?: (offset: number) => void) {
    const o = Math.max(0, Math.min(this.max, offset));
    this.content.y = -o;
    this.bar.clear();
    if (this.max > 0) {
      const { w, h } = this;
      const thumb = Math.max(50, (h * h) / (h + this.max));
      const y = (o / this.max) * (h - thumb);
      this.bar.roundRect(w - 8, 0, 8, h, 4).fill({ color: C.line, alpha: 0.5 });
      this.bar.roundRect(w - 8, y, 8, thumb, 4).fill(C.muted);
    }
    onScroll?.(o);
  }
}
