import { Container, Ticker } from 'pixi.js';

export type Ease = (t: number) => number;
export const easeOutCubic: Ease = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOut: Ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOutBack: Ease = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export interface TweenProps {
  x?: number;
  y?: number;
  alpha?: number;
  scale?: number;
  rotation?: number;
}

type Key = keyof TweenProps;

interface Active {
  stop: () => void;
}

const active = new Map<Container, Set<Active>>();

function read(target: Container, key: Key): number {
  return key === 'scale' ? target.scale.x : target[key];
}

function write(target: Container, key: Key, v: number) {
  if (key === 'scale') target.scale.set(v);
  else target[key] = v;
}

export function tween(target: Container, to: TweenProps, ms: number, ease: Ease = easeOutCubic): Promise<void> {
  return new Promise((resolve) => {
    const keys = Object.keys(to) as Key[];
    const from = keys.map((k) => read(target, k));
    let elapsed = 0;

    const set = active.get(target) ?? new Set();
    active.set(target, set);

    const finish = () => {
      Ticker.shared.remove(tick);
      set.delete(handle);
      if (set.size === 0) active.delete(target);
      resolve();
    };
    const tick = (ticker: Ticker) => {
      if (target.destroyed) return finish();
      elapsed += ticker.deltaMS;
      const t = Math.min(1, elapsed / ms);
      const e = ease(t);
      keys.forEach((k, i) => write(target, k, from[i] + (to[k]! - from[i]) * e));
      if (t >= 1) finish();
    };
    const handle: Active = { stop: finish };
    set.add(handle);
    Ticker.shared.add(tick);
  });
}

export function killTweens(target: Container) {
  active.get(target)?.forEach((a) => a.stop());
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Yatay sallama (yanlış cevap). */
export async function shake(target: Container, amount = 22) {
  const x = target.x;
  for (const dx of [amount, -amount, amount * 0.6, -amount * 0.6, 0]) {
    await tween(target, { x: x + dx }, 60, easeInOut);
  }
}
