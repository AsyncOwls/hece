import type { Container, FederatedPointerEvent } from 'pixi.js';
import type { SyllableCard } from './SyllableCard';
import { killTweens, tween } from '../tween';
import { sfx } from '../audio';

export interface DragCallbacks {
  canDrag(card: SyllableCard): boolean;
  /** Sürüklemeden dokunuldu. */
  onTap(card: SyllableCard): void;
  /** Sürükleme bitti; kart şu an bırakıldığı yerde. */
  onDrop(card: SyllableCard): void;
  onMove?(card: SyllableCard): void;
}

/** Akıllı tahtada tek parmakla sürükleme: aynı anda tek kart. */
export class Dragger {
  private active?: { card: SyllableCard; id: number; ox: number; oy: number; sx: number; sy: number; moved: boolean };

  constructor(
    private space: Container,
    private layer: Container,
    private cb: DragCallbacks,
  ) {}

  attach(card: SyllableCard) {
    card.on('pointerdown', (e) => this.down(card, e));
    card.on('globalpointermove', (e) => this.move(card, e));
    card.on('pointerup', (e) => this.up(card, e));
    card.on('pointerupoutside', (e) => this.up(card, e));
  }

  get dragging() {
    return this.active?.card ?? null;
  }

  private down(card: SyllableCard, e: FederatedPointerEvent) {
    if (this.active || !this.cb.canDrag(card)) return;
    killTweens(card);
    const p = this.space.toLocal(e.global);
    this.active = { card, id: e.pointerId, ox: card.x - p.x, oy: card.y - p.y, sx: p.x, sy: p.y, moved: false };
    this.layer.addChild(card);
    card.cursor = 'grabbing';
    sfx.pick();
    void tween(card, { scale: 1.08 }, 100);
  }

  private move(card: SyllableCard, e: FederatedPointerEvent) {
    const a = this.active;
    if (!a || a.card !== card || e.pointerId !== a.id) return;
    const p = this.space.toLocal(e.global);
    if (!a.moved && Math.hypot(p.x - a.sx, p.y - a.sy) > 14) a.moved = true;
    if (a.moved) {
      card.position.set(p.x + a.ox, p.y + a.oy);
      this.cb.onMove?.(card);
    }
  }

  private up(card: SyllableCard, e: FederatedPointerEvent) {
    const a = this.active;
    if (!a || a.card !== card || e.pointerId !== a.id) return;
    this.active = undefined;
    card.cursor = 'grab';
    void tween(card, { scale: 1 }, 100);
    if (a.moved) this.cb.onDrop(card);
    else this.cb.onTap(card);
  }
}
