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

/** Hoparlör (cümleyi dinle). */
export function speakerIcon(color: number): Graphics {
  const g = new Graphics().poly([-34, -14, -16, -14, 6, -34, 6, 34, -16, 14, -34, 14]).fill(color);
  g.arc(10, 0, 20, -Math.PI / 3, Math.PI / 3).stroke({ width: 7, color, cap: 'round' });
  g.arc(10, 0, 36, -Math.PI / 3, Math.PI / 3).stroke({ width: 7, color, cap: 'round' });
  return g;
}

/** Onay işareti (okudum). */
export function checkIcon(color: number, r = 44): Graphics {
  return new Graphics()
    .moveTo(-r * 0.75, 0)
    .lineTo(-r * 0.2, r * 0.55)
    .lineTo(r * 0.8, -r * 0.55)
    .stroke({ width: r * 0.32, color, cap: 'round', join: 'round' });
}

export function fishIcon(color: number): Graphics {
  return new Graphics()
    .ellipse(6, 0, 30, 19)
    .poly([-18, 0, -38, -18, -38, 18])
    .fill(color)
    .circle(20, -4, 4.5)
    .fill(0x1f2a44);
}
