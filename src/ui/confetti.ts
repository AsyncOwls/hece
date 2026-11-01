import { Container, Graphics, Ticker } from 'pixi.js';
import { CARD_COLORS, C } from '../theme';

const COLORS = [...CARD_COLORS, C.yellow, C.green];

export function confetti(parent: Container, x: number, y: number, count = 90) {
  const layer = new Container();
  parent.addChild(layer);
  const parts = Array.from({ length: count }, () => {
    const g = new Graphics()
      .rect(-9, -5, 18, 10)
      .fill(COLORS[Math.floor(Math.random() * COLORS.length)]);
    g.position.set(x, y);
    layer.addChild(g);
    const a = Math.random() * Math.PI * 2;
    const v = 8 + Math.random() * 16;
    return { g, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 12, vr: (Math.random() - 0.5) * 0.4 };
  });
  let life = 0;
  const tick = (t: Ticker) => {
    if (layer.destroyed) return Ticker.shared.remove(tick);
    const dt = t.deltaMS / 16.67;
    life += t.deltaMS;
    for (const p of parts) {
      p.vy += 0.6 * dt;
      p.vx *= 0.99;
      p.g.x += p.vx * dt;
      p.g.y += p.vy * dt;
      p.g.rotation += p.vr * dt;
    }
    layer.alpha = Math.max(0, 1 - Math.max(0, life - 1400) / 600);
    if (life > 2000) {
      Ticker.shared.remove(tick);
      layer.destroy({ children: true });
    }
  };
  Ticker.shared.add(tick);
}
