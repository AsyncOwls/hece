import { Graphics } from 'pixi.js';

export function speakerIcon(color: number, s = 1): Graphics {
  const g = new Graphics();
  g.poly([-22, -10, -10, -10, 6, -26, 6, 26, -10, 10, -22, 10]).fill(color);
  g.arc(10, 0, 14, -Math.PI / 3.2, Math.PI / 3.2).stroke({ width: 5, color, cap: 'round' });
  g.arc(10, 0, 26, -Math.PI / 3.2, Math.PI / 3.2).stroke({ width: 5, color, cap: 'round' });
  g.scale.set(s);
  return g;
}

export function eyeIcon(color: number, s = 1): Graphics {
  const g = new Graphics();
  g.moveTo(-30, 0).quadraticCurveTo(0, -30, 30, 0).quadraticCurveTo(0, 30, -30, 0).stroke({ width: 5, color });
  g.circle(0, 0, 9).fill(color);
  g.scale.set(s);
  return g;
}

export function backIcon(color: number): Graphics {
  const g = new Graphics();
  g.moveTo(12, -20).lineTo(-10, 0).lineTo(12, 20).stroke({ width: 9, color, cap: 'round', join: 'round' });
  return g;
}

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

export function starIcon(color: number, r = 30): Graphics {
  return new Graphics().star(0, 0, 5, r, r * 0.45).fill(color).stroke({ width: 3, color: 0xffffff });
}
