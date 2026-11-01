import { Container, Graphics, Ticker } from 'pixi.js';

const HOLD_MS = 1000;

export function gearIcon(color: number, r = 30): Graphics {
  const g = new Graphics();
  const teeth = 8;
  const pts: number[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const step = Math.PI / teeth;
    for (const [da, rr] of [
      [-step * 0.95, r * 0.78],
      [-step * 0.45, r],
      [step * 0.45, r],
      [step * 0.95, r * 0.78],
    ]) {
      pts.push(Math.cos(a + da) * rr, Math.sin(a + da) * rr);
    }
  }
  g.poly(pts).fill(color);
  g.circle(0, 0, r * 0.32).cut();
  return g;
}

/**
 * Öğretmen için ayar düğmesi. Çocuklar yanlışlıkla açmasın diye soluk durur ve
 * ancak basılı tutulunca (halka dolunca) açılır.
 */
export class TeacherGear extends Container {
  private ring = new Graphics();
  private held = 0;
  private holding = false;
  private tick = (t: Ticker) => this.update(t);

  constructor(private onOpen: () => void) {
    super();
    const hit = new Graphics().circle(0, 0, 60).fill({ color: 0xffffff, alpha: 0.001 });
    const icon = gearIcon(0xffffff, 30);
    icon.alpha = 0.7;
    this.addChild(hit, icon, this.ring);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerdown', () => this.start());
    this.on('pointerup', () => this.cancel());
    this.on('pointerupoutside', () => this.cancel());
    Ticker.shared.add(this.tick);
  }

  private start() {
    this.holding = true;
    this.held = 0;
  }

  private cancel() {
    this.holding = false;
    this.held = 0;
    this.ring.clear();
  }

  private update(t: Ticker) {
    if (this.destroyed) return Ticker.shared.remove(this.tick);
    if (!this.holding) return;
    this.held += t.deltaMS;
    const p = Math.min(1, this.held / HOLD_MS);
    this.ring.clear();
    this.ring.arc(0, 0, 46, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2).stroke({ width: 8, color: 0xffffff, cap: 'round' });
    if (p >= 1) {
      this.cancel();
      this.onOpen();
    }
  }

  override destroy(options?: Parameters<Container['destroy']>[0]) {
    Ticker.shared.remove(this.tick);
    super.destroy(options);
  }
}
