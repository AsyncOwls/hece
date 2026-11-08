import { Container, Graphics, Ticker } from 'pixi.js';
import { H, W, mix } from '../theme';
import { tween } from '../tween';

export const SKY = {
  top: 0x5fbcf5,
  bottom: 0xd6f0ff,
  cloud: 0xffffff,
  cloudEdge: 0xcfe3f2,
  hills: [0x9ad66f, 0x86c95c, 0x72b94d],
};

/**
 * Pamuk gibi bir bulut çizer. (cx, cy) bulutun ortası; w×h kapladığı alan.
 * Yazı için en uygun yer gövdenin ortasıdır: cloudTextY(cy, h).
 * border > 0 ise önce bir kenar rengiyle biraz büyük çizilir; böylece üst üste
 * binen dairelerin iç çizgileri görünmez.
 */
export function drawCloud(g: Graphics, cx: number, cy: number, w: number, h: number, fill: number, border = 0, borderColor = 0) {
  const shapes = (pad: number, color: number) => {
    const bodyTop = cy - h * 0.1;
    g.roundRect(cx - w / 2 - pad, bodyTop - pad, w + 2 * pad, h * 0.6 + 2 * pad, h * 0.3 + pad).fill(color);
    const n = Math.max(2, Math.round(w / (h * 0.6)));
    const r = h * 0.36;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const x = cx - w / 2 + h * 0.36 + t * (w - h * 0.72);
      // Ortadaki tümsekler daha büyük; hafif düzensizlik doğal görünsün.
      const rr = r * (0.72 + 0.38 * Math.sin(Math.PI * t)) * (i % 2 ? 0.92 : 1);
      g.circle(x, bodyTop, rr + pad).fill(color);
    }
  };
  if (border > 0) shapes(border, borderColor);
  shapes(0, fill);
}

export const cloudTextY = (cy: number, h: number) => cy + h * 0.17;

/** Gökyüzü arka planı: gradyan, dönen güneş, süzülen bulutlar. */
export class SkyBackdrop extends Container {
  private sun = new Container();
  private drifters: { c: Graphics; speed: number }[] = [];
  private tick = (t: Ticker) => this.update(t);

  constructor() {
    super();
    const bg = new Graphics();
    // Ekran 16:9 değilse kenarlar da gökyüzü olsun diye W×H'nin dışına taşar.
    bg.rect(-W, -H, 3 * W, H).fill(SKY.top);
    const bands = 48;
    for (let i = 0; i < bands; i++) {
      bg.rect(-W, (i * H) / bands, 3 * W, H / bands + 1).fill(mix(SKY.top, SKY.bottom, i / (bands - 1)));
    }
    this.addChild(bg);

    const rays = new Graphics();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      rays
        .moveTo(Math.cos(a) * 105, Math.sin(a) * 105)
        .lineTo(Math.cos(a) * 140, Math.sin(a) * 140)
        .stroke({ width: 14, color: 0xffd23f, cap: 'round' });
    }
    const disc = new Graphics().circle(0, 0, 82).fill(0xffd23f).circle(0, 0, 70).fill(0xffe066);
    this.sun.addChild(rays, disc);
    this.sun.position.set(170, 160);
    this.addChild(this.sun);

    [
      { x: 520, y: 150, w: 230, speed: 0.25 },
      { x: 1350, y: 110, w: 180, speed: 0.18 },
      { x: 1750, y: 250, w: 150, speed: 0.3 },
    ].forEach((d) => {
      const c = new Graphics();
      drawCloud(c, 0, 0, d.w, d.w * 0.55, SKY.cloud);
      c.alpha = 0.85;
      c.position.set(d.x, d.y);
      this.addChild(c);
      this.drifters.push({ c, speed: d.speed });
    });

    Ticker.shared.add(this.tick);
  }

  private update(t: Ticker) {
    if (this.destroyed) return Ticker.shared.remove(this.tick);
    const dt = t.deltaMS / 16.67;
    this.sun.rotation += 0.002 * dt;
    for (const d of this.drifters) {
      d.c.x += d.speed * dt;
      if (d.c.x > W + 250) d.c.x = -250;
    }
  }

  override destroy(options?: Parameters<Container['destroy']>[0]) {
    Ticker.shared.remove(this.tick);
    super.destroy(options);
  }
}

/** Yeşil tepeler (gökkuşağının ayakları bunların arkasında kalır). */
export function hills(): Graphics {
  const g = new Graphics();
  g.rect(-W, 900, 3 * W, 2 * H).fill(SKY.hills[2]);
  g.ellipse(380, 1010, 720, 300).fill(SKY.hills[0]);
  g.ellipse(1560, 1030, 820, 310).fill(SKY.hills[1]);
  g.ellipse(960, 1130, 1150, 300).fill(SKY.hills[2]);
  return g;
}

export const RAINBOW = [0xe53935, 0xfb8c00, 0xfdd835, 0x43a047, 0x1e88e5, 0x3949ab, 0x8e24aa];

/** Soldan sağa doğru çizilerek beliren gökkuşağı. */
export class Rainbow extends Graphics {
  private progress = 0;

  get shown() {
    return this.progress > 0 && this.alpha > 0;
  }

  constructor(
    private cx: number,
    private cy: number,
    private outer: number,
    private band = 36,
  ) {
    super();
  }

  private draw() {
    this.clear();
    if (this.progress <= 0) return;
    RAINBOW.forEach((color, i) => {
      const r = this.outer - this.band / 2 - i * this.band;
      this.arc(this.cx, this.cy, r, Math.PI, Math.PI + Math.PI * this.progress).stroke({ width: this.band + 1, color });
    });
  }

  show(ms = 1000): Promise<void> {
    this.alpha = 1;
    return new Promise((resolve) => {
      let elapsed = 0;
      const tick = (t: Ticker) => {
        if (this.destroyed) {
          Ticker.shared.remove(tick);
          return resolve();
        }
        elapsed += t.deltaMS;
        const p = Math.min(1, elapsed / ms);
        this.progress = 1 - Math.pow(1 - p, 2);
        this.draw();
        if (p >= 1) {
          Ticker.shared.remove(tick);
          resolve();
        }
      };
      Ticker.shared.add(tick);
    });
  }

  async hide(ms = 300) {
    await tween(this, { alpha: 0 }, ms);
    this.progress = 0;
    this.draw();
  }
}
