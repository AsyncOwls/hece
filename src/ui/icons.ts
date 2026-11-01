import { Graphics } from 'pixi.js';

export function fullscreenIcon(color: number): Graphics {
  const g = new Graphics();
  const a = 18;
  const b = 8;
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    g.moveTo(sx * a, sy * (a - b)).lineTo(sx * a, sy * a).lineTo(sx * (a - b), sy * a);
  }
  g.stroke({ width: 6, color, cap: 'round', join: 'round' });
  return g;
}

/** Oynat üçgeni (görsel ağırlık merkezi için hafif sağa kaydırılmış). */
export function playIcon(color: number, r = 52): Graphics {
  return new Graphics()
    .poly([-r * 0.55, -r, r, 0, -r * 0.55, r])
    .fill(color)
    .stroke({ width: 10, color, join: 'round' });
}
