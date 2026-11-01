import { Container, Ellipse, Graphics, Ticker } from 'pixi.js';
import { C, H, W, darken, mix, shuffle } from '../theme';
import { gradient, rand, type Creature, type Habitat } from './habitat';

/** Akvaryumun suyu (camın içi). */
const TANK = { left: 46, top: 46, right: W - 46, bottom: H - 46 };
const SAND_Y = 925;

interface FishStyle {
  body: number;
  fin: number;
  pattern: 'stripes' | 'spots' | 'belly' | 'plain';
  w: number;
  h: number;
}

const STYLES: FishStyle[] = [
  { body: 0xff8a3d, fin: 0xffffff, pattern: 'stripes', w: 190, h: 120 },
  { body: 0xffd23f, fin: 0xff9f1c, pattern: 'plain', w: 170, h: 135 },
  { body: 0x4dabf7, fin: 0x1c7ed6, pattern: 'spots', w: 200, h: 115 },
  { body: 0xe64980, fin: 0xfcc2d7, pattern: 'belly', w: 185, h: 125 },
  { body: 0x51cf66, fin: 0x2b8a3e, pattern: 'stripes', w: 210, h: 110 },
  { body: 0x9775fa, fin: 0xe5dbff, pattern: 'spots', w: 160, h: 140 },
  { body: 0xff6b6b, fin: 0xffe066, pattern: 'plain', w: 220, h: 105 },
  { body: 0x22b8cf, fin: 0xfff3bf, pattern: 'belly', w: 180, h: 125 },
];

/** Sağa bakan balık çizer; (0, 0) gövdenin ortası. Kuyruk ayrı döndürülür. */
function drawFish(art: Container, tail: Graphics, st: FishStyle) {
  const { w, h, body, fin } = st;
  const edge = darken(body, 0.72);

  tail
    .poly([0, 0, -w * 0.34, -h * 0.48, -w * 0.25, 0, -w * 0.34, h * 0.48])
    .fill(fin)
    .stroke({ width: 4, color: edge, join: 'round' });
  tail.position.set(-w * 0.42, 0);

  const g = new Graphics();
  g.poly([-w * 0.22, -h * 0.4, -w * 0.02, -h * 0.78, w * 0.18, -h * 0.38]).fill(fin).stroke({ width: 4, color: edge, join: 'round' });
  g.poly([-w * 0.1, h * 0.4, w * 0.02, h * 0.68, w * 0.12, h * 0.38]).fill(fin).stroke({ width: 4, color: edge, join: 'round' });
  g.ellipse(0, 0, w / 2, h / 2).fill(body).stroke({ width: 5, color: edge });

  // Desen gövdenin içinde kalsın diye her şerit/benek o noktadaki gövde yüksekliğine göre çizilir.
  const half = (x: number) => (h / 2) * Math.sqrt(Math.max(0, 1 - (2 * x / w) ** 2)) - 4;
  if (st.pattern === 'stripes') {
    for (const x of [-w * 0.2, w * 0.08]) {
      const hh = half(x);
      g.roundRect(x - w * 0.05, -hh, w * 0.1, hh * 2, w * 0.05).fill(0xffffff).stroke({ width: 3, color: edge });
    }
  } else if (st.pattern === 'spots') {
    for (const [x, y, r] of [[-0.18, -0.12, 0.09], [0.02, 0.18, 0.07], [-0.3, 0.12, 0.06], [0.1, -0.2, 0.06]]) {
      g.circle(w * x, h * y, h * r).fill(darken(body, 0.8));
    }
  } else if (st.pattern === 'belly') {
    g.ellipse(w * 0.04, h * 0.2, w * 0.36, h * 0.2).fill(mix(body, 0xffffff, 0.55));
  }
  g.ellipse(-w * 0.04, h * 0.08, w * 0.12, h * 0.1).fill({ color: fin, alpha: 0.9 }).stroke({ width: 3, color: edge });
  // Göz ve ağız
  g.circle(w * 0.26, -h * 0.1, h * 0.14).fill(0xffffff).stroke({ width: 3, color: edge });
  g.circle(w * 0.29, -h * 0.1, h * 0.075).fill(C.ink);
  g.circle(w * 0.31, -h * 0.13, h * 0.025).fill(0xffffff);
  const [mx, my, mr] = [w * 0.42, h * 0.1, h * 0.08];
  g.moveTo(mx + mr * Math.cos(Math.PI * 0.1), my + mr * Math.sin(Math.PI * 0.1))
    .arc(mx, my, mr, Math.PI * 0.1, Math.PI * 0.8)
    .stroke({ width: 4, color: edge, cap: 'round' });

  art.addChild(tail, g);
}

class Fish extends Container implements Creature {
  private art = new Container();
  private tail = new Graphics();
  private dir: number;
  private speed = rand(0.9, 1.8);
  private t = rand(0, 1000);
  private excited = 0;
  private tick = (t: Ticker) => this.update(t.deltaMS / 16.67);

  constructor(
    private st: FishStyle,
    private baseY: number,
  ) {
    super();
    drawFish(this.art, this.tail, st);
    this.dir = Math.random() < 0.5 ? 1 : -1;
    this.art.scale.x = this.dir;
    this.addChild(this.art);
    this.hitArea = new Ellipse(0, 0, st.w * 0.72, st.h * 0.8);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    Ticker.shared.add(this.tick);
  }

  private update(dt: number) {
    if (this.destroyed) return Ticker.shared.remove(this.tick);
    this.t += dt;
    const fast = this.excited > 0 ? 3 : 1;
    this.excited = Math.max(0, this.excited - dt);
    this.x += this.dir * this.speed * fast * dt;
    const margin = this.st.w * 0.75;
    if ((this.dir > 0 && this.x > TANK.right - margin) || (this.dir < 0 && this.x < TANK.left + margin)) this.dir = -this.dir;
    // Dönerken balık yavaşça ters yüz olur.
    this.art.scale.x += (this.dir - this.art.scale.x) * Math.min(1, 0.12 * dt);
    this.tail.rotation = Math.sin(this.t * 0.22 * fast) * 0.32;
    this.y = this.baseY + Math.sin(this.t * 0.025) * 16;
  }

  react() {
    this.excited = 50;
    bubbleBurst(this.parent!, this.x + this.dir * this.st.w * 0.5, this.y);
  }

  override destroy(options?: Parameters<Container['destroy']>[0]) {
    Ticker.shared.remove(this.tick);
    super.destroy(options);
  }
}

function bubbleBurst(parent: Container, x: number, y: number) {
  for (let i = 0; i < 7; i++) {
    const b = new Graphics().circle(0, 0, rand(8, 18)).stroke({ width: 4, color: 0xffffff, alpha: 0.9 });
    b.position.set(x + rand(-20, 20), y + rand(-20, 20));
    parent.addChild(b);
    const vy = rand(2, 4.5);
    const vx = rand(-1, 1);
    const tick = (t: Ticker) => {
      if (b.destroyed) return Ticker.shared.remove(tick);
      const dt = t.deltaMS / 16.67;
      b.y -= vy * dt;
      b.x += vx * dt;
      b.alpha -= 0.012 * dt;
      if (b.alpha <= 0) {
        Ticker.shared.remove(tick);
        b.destroy();
      }
    };
    Ticker.shared.add(tick);
  }
}

/** Arka plan: su, ışık huzmeleri, kum, taşlar, sallanan yosunlar ve kabarcıklar. */
class AquariumBack extends Container {
  private weeds: { g: Graphics; x: number; h: number; color: number; phase: number }[] = [];
  private bubbles: { g: Graphics; vy: number; phase: number }[] = [];
  private t = 0;
  private tick = (t: Ticker) => this.update(t.deltaMS / 16.67);

  constructor() {
    super();
    const g = new Graphics();
    // Akvaryumun dışı (ekran 16:9 değilse de kenarlar dolsun) ve çerçeve.
    g.rect(-W, -H, 3 * W, 3 * H).fill(0x23324f);
    g.roundRect(18, 18, W - 36, H - 36, 40).fill(0x3b4f78);
    gradient(g, TANK.left, TANK.top, TANK.right - TANK.left, TANK.bottom, 0x8fdcf7, 0x1c63b0, 48);
    g.rect(TANK.left, TANK.top, TANK.right - TANK.left, 40).fill({ color: 0xffffff, alpha: 0.25 });
    for (const [x, w] of [[300, 160], [760, 220], [1250, 140], [1600, 200]]) {
      g.poly([x, TANK.top, x + w, TANK.top, x + w * 1.8, SAND_Y, x + w * 0.6, SAND_Y]).fill({ color: 0xffffff, alpha: 0.07 });
    }
    this.addChild(g);

    for (let i = 0; i < 9; i++) {
      const w = new Graphics();
      this.addChild(w);
      this.weeds.push({
        g: w,
        x: 110 + i * 210 + rand(-40, 40),
        h: rand(220, 420),
        color: [0x2f9e44, 0x37b24d, 0x087f5b][i % 3],
        phase: rand(0, 6),
      });
    }

    const sand = new Graphics();
    sand.rect(TANK.left, SAND_Y + 30, TANK.right - TANK.left, TANK.bottom - SAND_Y - 30).fill(0xe8c47f);
    for (let x = TANK.left; x < TANK.right; x += 260) sand.ellipse(x + 130, SAND_Y + 40, 190, 45).fill(0xf2d49b);
    const pebbles = [0xffffff, 0xff8787, 0x74c0fc, 0xffd43b, 0xb197fc];
    for (let i = 0; i < 70; i++) {
      sand.ellipse(rand(TANK.left + 20, TANK.right - 20), rand(SAND_Y + 45, TANK.bottom - 10), rand(7, 14), rand(5, 9)).fill(pebbles[i % pebbles.length]);
    }
    // Taşlar, deniz yıldızı, deniz kabuğu
    sand.ellipse(340, SAND_Y + 20, 150, 80).fill(0x868e96).stroke({ width: 5, color: 0x5c636a });
    sand.ellipse(280, SAND_Y - 10, 80, 55).fill(0xadb5bd).stroke({ width: 5, color: 0x5c636a });
    sand.ellipse(1520, SAND_Y + 25, 120, 60).fill(0x868e96).stroke({ width: 5, color: 0x5c636a });
    sand.star(1050, SAND_Y + 75, 5, 42, 20).fill(0xff922b).stroke({ width: 4, color: 0xd9480f, join: 'round' });
    sand.moveTo(760, SAND_Y + 95).arc(760, SAND_Y + 95, 40, Math.PI, 0).closePath().fill(0xffc9c9).stroke({ width: 4, color: 0xe03131 });
    this.addChild(sand);

    for (let i = 0; i < 26; i++) {
      const b = new Graphics()
        .circle(0, 0, rand(5, 13))
        .stroke({ width: 3, color: 0xffffff, alpha: 0.7 });
      b.position.set(i % 2 ? rand(260, 420) : rand(TANK.left + 40, TANK.right - 40), rand(TANK.top, SAND_Y));
      this.addChild(b);
      this.bubbles.push({ g: b, vy: rand(0.8, 2), phase: rand(0, 6) });
    }

    Ticker.shared.add(this.tick);
  }

  private update(dt: number) {
    if (this.destroyed) return Ticker.shared.remove(this.tick);
    this.t += dt;
    for (const w of this.weeds) {
      const seg = 9;
      w.g.clear().moveTo(w.x, SAND_Y + 40);
      for (let k = 1; k <= seg; k++) {
        const sway = Math.sin(this.t * 0.03 + w.phase + k * 0.45) * k * 4;
        w.g.lineTo(w.x + sway, SAND_Y + 40 - (w.h * k) / seg);
      }
      w.g.stroke({ width: 22, color: w.color, cap: 'round', join: 'round' });
    }
    for (const b of this.bubbles) {
      b.g.y -= b.vy * dt;
      b.g.x += Math.sin(this.t * 0.05 + b.phase) * 0.4 * dt;
      if (b.g.y < TANK.top + 20) b.g.y = SAND_Y;
    }
  }

  override destroy(options?: Parameters<Container['destroy']>[0]) {
    Ticker.shared.remove(this.tick);
    super.destroy(options);
  }
}

export function aquarium(): Habitat {
  const front = new Graphics();
  // Camın parlaması
  front.poly([TANK.left, 300, TANK.left + 220, TANK.top, TANK.left + 300, TANK.top, TANK.left, 400]).fill({ color: 0xffffff, alpha: 0.08 });
  return {
    back: new AquariumBack(),
    front,
    max: STYLES.length,
    spawn(n) {
      // Balıklar farklı derinliklerde yüzsün diye su yüksekliği n banda bölünür.
      const top = 190;
      const bottom = SAND_Y - 110;
      const lanes = shuffle([...Array(n).keys()]);
      return shuffle(STYLES)
        .slice(0, n)
        .map((st, i) => {
          const y = top + ((lanes[i] + 0.5) * (bottom - top)) / n;
          const f = new Fish(st, y);
          f.position.set(rand(TANK.left + 250, TANK.right - 250), y);
          return f;
        });
    },
  };
}
