import { Container, Graphics, Text, Ticker } from 'pixi.js';
import type { Game, Scene } from '../game';
import { buildSortBoard, canFormWords, pairKey, pickSortWords, rowBlocked, sortSize, sortWordCount } from '../data/sort';
import { Button } from '../ui/Button';
import { playIcon } from '../ui/icons';
import { Dragger } from '../ui/drag';
import { confetti } from '../ui/confetti';
import { TeacherGear } from '../ui/TeacherGear';
import { RAINBOW, Rainbow, SKY, SkyBackdrop, cloudTextY, drawCloud, hills } from '../ui/sky';
import { C, H, W, darken, label, mix } from '../theme';
import { easeInOut, easeOutBack, tween, wait } from '../tween';
import { sfx, speak } from '../audio';
import { sortPairs, sortWords } from './common';

/** Birleşen kelimeler sırayla gökkuşağının renklerini alır. */
const MERGE_COLORS = RAINBOW;
/** Sarı zeminde beyaz yazı okunmaz. */
const textOn = (color: number) => (color === 0xfdd835 ? C.ink : C.white);

interface Block {
  view: Candy;
  /** Bloğun sol hücresi. */
  cell: number;
}

/** 0→1 arası ilerlemeyi her karede bildirir. */
function animate(ms: number, frame: (t: number) => void): Promise<void> {
  return new Promise((resolve) => {
    let elapsed = 0;
    const tick = (tk: Ticker) => {
      elapsed += tk.deltaMS;
      const t = Math.min(1, elapsed / ms);
      frame(t);
      if (t >= 1) {
        Ticker.shared.remove(tick);
        resolve();
      }
    };
    Ticker.shared.add(tick);
  });
}

/** Tek hece bloğu. */
class Tile extends Container {
  cell = -1;
  private bg = new Graphics();

  constructor(
    readonly syllable: string,
    readonly w: number,
    readonly h: number,
    font: number,
  ) {
    super();
    const t = label(syllable, font, C.ink);
    t.y = -4;
    this.addChild(this.bg, t);
    this.draw('idle');
    this.eventMode = 'static';
    this.cursor = 'grab';
  }

  draw(state: 'idle' | 'selected' | 'target') {
    const { w, h } = this;
    // Yuvarlak uçlu balon.
    const r = h / 2;
    this.bg.clear();
    this.bg.roundRect(-w / 2, -h / 2 + 7, w, h, r).fill({ color: 0x3a7cb8, alpha: 0.25 });
    this.bg.roundRect(-w / 2, -h / 2, w, h, r).fill(state === 'idle' ? SKY.cloud : 0xfff6c8);
    if (state === 'idle') this.bg.stroke({ width: 4, color: SKY.cloudEdge });
    else this.bg.stroke({ width: state === 'selected' ? 8 : 6, color: C.yellow });
  }
}

/**
 * İki hece birleşince oluşan şeker gibi uzun, parlak balon. `goo` 0 iken yan yana
 * iki ayrı damladır; arttıkça aralarında boyun oluşup kalınlaşır, 1'de tek balon olur.
 */
class Candy extends Container {
  private g = new Graphics();
  private txt: Text;

  constructor(
    text: string,
    private color: number,
    private cellW: number,
    private gap: number,
    private h: number,
    font: number,
  ) {
    super();
    this.txt = label(text, font * 1.05, textOn(color));
    this.txt.y = -4;
    this.txt.alpha = 0;
    this.addChild(this.g, this.txt);
    this.draw(0);
  }

  get textView() {
    return this.txt;
  }

  draw(goo: number) {
    const { cellW, gap, h, color } = this;
    const r = h / 2;
    const w = cellW * 2 + gap;
    const g = this.g;
    g.clear();

    const shape = (dy: number, fill: number) => {
      g.roundRect(-w / 2, -r + dy, cellW, h, r).fill(fill);
      g.roundRect(w / 2 - cellW, -r + dy, cellW, h, r).fill(fill);
      if (goo <= 0) return;
      // İki damlanın iç uçları arasında içe kıvrık boyun; ortası goo ile kalınlaşır.
      const x1 = -w / 2 + cellW - r;
      const x2 = w / 2 - cellW + r;
      const m = r * goo;
      g.moveTo(x1, -r + dy)
        .quadraticCurveTo(0, r - 2 * m + dy, x2, -r + dy)
        .lineTo(x2, r + dy)
        .quadraticCurveTo(0, 2 * m - r + dy, x1, r + dy)
        .closePath()
        .fill(fill);
    };
    shape(8, darken(color, 0.65));
    shape(0, color);

    // Şeker parlaklığı: önce her damlada, birleşince boydan boya.
    const shine = (x: number, sw: number, alpha: number) => {
      if (alpha <= 0.01) return;
      g.roundRect(x + r * 0.5, -r + h * 0.07, sw - r, h * 0.16, h * 0.08).fill({ color: 0xffffff, alpha: 0.38 * alpha });
      g.ellipse(x + r * 0.55, -r + h * 0.5, h * 0.06, h * 0.1).fill({ color: 0xffffff, alpha: 0.5 * alpha });
    };
    const whole = Math.max(0, (goo - 0.6) / 0.4);
    shine(-w / 2, cellW, 1 - whole);
    shine(w / 2 - cellW, cellW, 1 - whole);
    shine(-w / 2, w, whole);
  }
}

/**
 * Hece Sort: n×n tahtada karışık heceler. Çocuk iki bloğun yerini değiştirir
 * (sürükleyerek ya da sırayla iki bloğa dokunarak). Aynı satırda yan yana gelen
 * iki hece bir kelime olunca bloklar birleşir, renklenir ve yerinde sabit kalır.
 * Gökyüzünde geçer: birleşen kelimeler sırayla gökkuşağının renklerini alır,
 * oyun bitince büyük gökkuşağı çıkar.
 */
export class SortScene implements Scene {
  view = new Container();
  private n: number;
  private cellW = 0;
  private cellH = 0;
  private gap = 0;
  private font = 0;
  /** Hücredeki serbest blok; kelimeye katılmış ya da boş hücre için null. */
  private tiles: (Tile | null)[] = [];
  /** Birleşmesi kabul edilen hece çiftleri (okunabilen tüm iki heceli kelimeler). */
  private pairs = new Set<string>();
  private colors = MERGE_COLORS;
  private rainbow = new Rainbow(W / 2, 790, 640, 38);
  private mergedCount = 0;
  private blocks: Block[] = [];
  private selected: Tile | null = null;
  private target: Tile | null = null;
  private busy = false;
  private won = false;
  private alive = true;

  private boardLayer = new Container();
  private tileLayer = new Container();
  private blockLayer = new Container();
  private dragLayer = new Container();
  private overlay = new Container();
  private dragger: Dragger<Tile>;

  constructor(private game: Game) {
    const s = game.settings;
    this.n = sortSize(s.sortSize);
    this.view.addChild(new SkyBackdrop(), this.rainbow, hills(), this.boardLayer, this.blockLayer, this.tileLayer, this.dragLayer, this.overlay);
    if (game.home) {
      const gear = new TeacherGear(() => game.goHome());
      gear.position.set(W - 70, 70);
      this.view.addChild(gear);
    }

    this.dragger = new Dragger<Tile>(this.view, this.dragLayer, {
      canDrag: () => !this.busy && !this.won,
      onTap: (t) => this.tap(t),
      onDrop: (t) => this.drop(t),
      onMove: (t) => this.hover(t),
    });

    const words = pickSortWords(sortWords(s), sortWordCount(this.n));
    if (words.length === 0) {
      const t = label(`Bu seçimde iki heceli kelime yok.${game.home ? '\nAyarlar için sağ üstteki çarka basılı tutun.' : ''}`, 52, C.white);
      t.position.set(W / 2, H / 2);
      this.overlay.addChild(t);
      return;
    }
    this.pairs = sortPairs(s);
    this.build(buildSortBoard(words, this.n, this.pairs));
  }

  // --- Tahta ---

  private build(cells: string[]) {
    const n = this.n;
    this.gap = n <= 2 ? 26 : 18;
    this.cellH = Math.min(230, (900 - (n - 1) * this.gap) / n);
    this.cellW = Math.min(this.cellH * 1.8, (W - 300 - (n - 1) * this.gap) / n);
    this.font = Math.round(Math.min(110, this.cellH * 0.48));

    const bw = n * this.cellW + (n - 1) * this.gap;
    const bh = n * this.cellH + (n - 1) * this.gap;
    const pad = 30;
    const board = new Graphics()
      .roundRect(W / 2 - bw / 2 - pad, H / 2 - bh / 2 - pad, bw + pad * 2, bh + pad * 2 + 8, 40)
      .fill({ color: C.white, alpha: 0.35 })
      .stroke({ width: 4, color: C.white, alpha: 0.7 });
    for (let i = 0; i < n * n; i++) {
      const p = this.pos(i);
      board
        .roundRect(p.x - this.cellW / 2, p.y - this.cellH / 2, this.cellW, this.cellH, Math.min(28, this.cellH * 0.18))
        .fill({ color: mix(SKY.top, C.white, 0.5), alpha: 0.6 });
    }
    this.boardLayer.addChild(board);

    this.tiles = cells.map((syl, i) => {
      const t = new Tile(syl, this.cellW, this.cellH, this.font);
      t.cell = i;
      const p = this.pos(i);
      t.position.set(p.x, p.y + 60);
      t.alpha = 0;
      this.dragger.attach(t);
      this.tileLayer.addChild(t);
      void wait(i * 35).then(() => tween(t, { y: p.y, alpha: 1 }, 380, easeOutBack));
      return t;
    });
  }

  private pos(cell: number) {
    const n = this.n;
    const x0 = W / 2 - (n * this.cellW + (n - 1) * this.gap) / 2 + this.cellW / 2;
    const y0 = H / 2 - (n * this.cellH + (n - 1) * this.gap) / 2 + this.cellH / 2;
    return { x: x0 + (cell % n) * (this.cellW + this.gap), y: y0 + Math.floor(cell / n) * (this.cellH + this.gap) };
  }

  /** Bu noktanın üstündeki hücre; tahta dışıysa -1. */
  private cellAt(x: number, y: number) {
    for (let i = 0; i < this.n * this.n; i++) {
      const p = this.pos(i);
      if (Math.abs(x - p.x) <= (this.cellW + this.gap) / 2 && Math.abs(y - p.y) <= (this.cellH + this.gap) / 2) return i;
    }
    return -1;
  }

  // --- Dokunma ve sürükleme ---

  private tap(tile: Tile) {
    this.tileLayer.addChild(tile);
    const sel = this.selected;
    if (!sel) {
      this.select(tile);
      speak(tile.syllable);
    } else if (sel === tile) {
      this.select(null);
    } else {
      this.select(null);
      void this.swap(sel, tile);
    }
  }

  private select(tile: Tile | null) {
    this.selected?.draw('idle');
    this.selected = tile;
    tile?.draw('selected');
  }

  private hover(tile: Tile) {
    const i = this.cellAt(tile.x, tile.y);
    const t = i >= 0 ? this.tiles[i] : null;
    const next = t && t !== tile ? t : null;
    if (next === this.target) return;
    if (this.target) this.target.draw(this.target === this.selected ? 'selected' : 'idle');
    this.target = next;
    next?.draw('target');
  }

  private drop(tile: Tile) {
    const target = this.target;
    if (target) target.draw('idle');
    this.target = null;
    this.select(null);
    this.tileLayer.addChild(tile);
    if (target) void this.swap(tile, target);
    else {
      const p = this.pos(tile.cell);
      void tween(tile, { x: p.x, y: p.y }, 250);
    }
  }

  private async swap(a: Tile, b: Tile) {
    this.busy = true;
    [a.cell, b.cell] = [b.cell, a.cell];
    this.tiles[a.cell] = a;
    this.tiles[b.cell] = b;
    const pa = this.pos(a.cell);
    const pb = this.pos(b.cell);
    await Promise.all([tween(a, { x: pa.x, y: pa.y, scale: 1 }, 220), tween(b, { x: pb.x, y: pb.y, scale: 1 }, 220)]);
    if (!this.alive) return;
    this.busy = false;
    this.checkWords([a.cell, b.cell]);
  }

  // --- Kelime kurma ---

  /**
   * Yeri değişen hücrelerin satırında yan yana kurulmuş kelime var mı. Tahtaya
   * konan kelimeler dışında okunabilen her iki heceli kelime de kabul edilir.
   */
  private checkWords(cells: number[]) {
    if (this.won) return;
    const n = this.n;
    for (const c of [...cells].sort((x, y) => x - y)) {
      const col = c % n;
      const pairs: [number, number][] = [];
      if (col > 0) pairs.push([c - 1, c]);
      if (col < n - 1) pairs.push([c, c + 1]);
      for (const [l, r] of pairs) {
        const left = this.tiles[l];
        const right = this.tiles[r];
        if (!left || !right) continue;
        if (!this.pairs.has(pairKey(left.syllable, right.syllable))) continue;
        this.merge(left, right);
        break;
      }
    }
  }

  /** Durum hemen güncellenir (blok kilitlenir, satır gerekirse düzenlenir); görüntü ardından gelir. */
  private merge(left: Tile, right: Tile) {
    const l = left.cell;
    const text = left.syllable + right.syllable;
    this.tiles[l] = this.tiles[l + 1] = null;
    left.eventMode = right.eventMode = 'none';
    if (this.selected === left || this.selected === right) this.select(null);

    const color = this.colors[this.mergedCount++ % this.colors.length];
    const block: Block = { view: new Candy(text, color, this.cellW, this.gap, this.cellH, this.font), cell: l };
    this.blocks.push(block);
    const from = this.blockPos(l);
    const moved = this.unblockRow(Math.floor(l / this.n));
    // Tahtada yer kalmadıysa ya da kalan hecelerle artık kelime kurulamıyorsa oyun biter.
    const free = this.tiles.filter((t): t is Tile => t !== null).map((t) => t.syllable);
    const over = this.blocks.length >= sortWordCount(this.n) || !canFormWords(free, 1, this.pairs);
    if (over) this.won = true;
    void this.showMerge(left, right, block, from, text, moved, over);
  }

  private async showMerge(left: Tile, right: Tile, block: Block, from: { x: number; y: number }, text: string, moved: Tile[], over: boolean) {
    sfx.correct();
    const v = block.view;
    v.position.set(from.x, from.y);
    v.alpha = 0;
    this.blockLayer.addChild(v);

    // 1) Beyaz heceler renkli damlalara döner.
    await Promise.all([tween(v, { alpha: 1 }, 180), tween(left, { alpha: 0 }, 180), tween(right, { alpha: 0 }, 180)]);
    if (!this.alive) return;
    left.destroy({ children: true });
    right.destroy({ children: true });

    // 2) Su damlası gibi: aralarında boyun oluşur, kalınlaşır, tek balon olur.
    sfx.bubble();
    await animate(420, (t) => {
      if (v.destroyed) return;
      const e = easeInOut(t);
      v.draw(e);
      const squash = Math.sin(Math.PI * t);
      v.scale.set(1 + 0.03 * squash, 1 - 0.1 * squash);
    });
    if (!this.alive) return;

    // 3) Jöle gibi sallanır, kelime belirir.
    const word = v.textView;
    word.scale.set(0.4);
    void tween(word, { alpha: 1, scale: 1 }, 380, easeOutBack);
    void animate(520, (t) => {
      if (v.destroyed) return;
      const k = Math.sin(t * Math.PI * 3) * (1 - t) * 0.08;
      v.scale.set(1 + k, 1 - k);
    });
    confetti(this.view, from.x, from.y, 26);
    speak(text, 0.75);

    if (moved.length) {
      // Satır tıkandıysa blok kenara kayar, tek kalan heceler yan yana gelir.
      await wait(550);
      if (!this.alive) return;
      const to = this.blockPos(block.cell);
      const slides = [tween(v, { x: to.x }, 380, easeInOut)];
      for (const t of moved) {
        if (t.destroyed || this.dragger.dragging === t) continue;
        const p = this.pos(t.cell);
        slides.push(tween(t, { x: p.x, y: p.y }, 380, easeInOut));
      }
      await Promise.all(slides);
      if (!this.alive) return;
      this.checkWords(moved.filter((t) => !t.destroyed && this.tiles[t.cell] === t).map((t) => t.cell));
    }

    if (over) {
      await wait(1200);
      if (this.alive) this.win();
    }
  }

  /** İki hücrelik bloğun ortası. */
  private blockPos(cell: number) {
    const a = this.pos(cell);
    const b = this.pos(cell + 1);
    return { x: (a.x + b.x) / 2, y: a.y };
  }

  /**
   * Bloklar satırda kalan kelimelere yer bırakmıyorsa (4'lük satırın ortasındaki
   * blok gibi) satırı düzenler: bloklar sola, heceler sağa, sıraları korunarak.
   * Yeri değişen heceleri döner.
   */
  private unblockRow(row: number): Tile[] {
    const n = this.n;
    const base = row * n;
    const rowBlocks = this.blocks.filter((b) => Math.floor(b.cell / n) === row).sort((a, b) => a.cell - b.cell);
    if (!rowBlocked(n, rowBlocks.map((b) => b.cell - base))) return [];

    const starts = new Set(rowBlocks.map((b) => b.cell));
    const tiles: Tile[] = [];
    for (let c = base; c < base + n; c++) {
      if (starts.has(c)) c++;
      else if (this.tiles[c]) tiles.push(this.tiles[c]!);
    }
    let c = base;
    for (const b of rowBlocks) {
      this.tiles[c] = this.tiles[c + 1] = null;
      b.cell = c;
      c += 2;
    }
    const moved: Tile[] = [];
    for (const t of tiles) {
      if (t.cell !== c) moved.push(t);
      t.cell = c;
      this.tiles[c++] = t;
    }
    return moved;
  }

  /** Oyun bitti: tahta solar, büyük gökkuşağı, "Aferin!" bulutu ve yeniden oyna. */
  private win() {
    this.won = true;
    for (const layer of [this.boardLayer, this.blockLayer, this.tileLayer]) void tween(layer, { alpha: 0.18 }, 400);
    void this.rainbow.show(1100);

    const t = label('Aferin!', 130, C.red);
    const bw = t.width + 200;
    const cloud = new Graphics();
    drawCloud(cloud, W / 2, 420, bw, 290, SKY.cloud, 7, SKY.cloudEdge);
    t.position.set(W / 2, cloudTextY(420, 290) - 8);
    this.overlay.addChild(cloud, t);
    t.scale.set(0.3);
    void tween(t, { scale: 1 }, 500, easeOutBack);

    sfx.win();
    confetti(this.view, W / 2 - 400, 420, 70);
    confetti(this.view, W / 2 + 400, 420, 70);
    void wait(500).then(() => this.alive && confetti(this.view, W / 2, 320, 90));

    const again = new Button({ width: 200, height: 200, radius: 100, color: C.green, icon: playIcon(C.white), onTap: () => this.again() });
    again.position.set(W / 2, 870);
    again.scale.set(0.2);
    this.overlay.addChild(again);
    void wait(600).then(() => tween(again, { scale: 1 }, 450, easeOutBack));
  }

  private again() {
    this.game.go((g) => new SortScene(g));
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') this.game.goHome();
    else if ((e.key === ' ' || e.key === 'Enter') && this.won) {
      e.preventDefault();
      this.again();
    }
  }

  destroy() {
    this.alive = false;
    speechSynthesis?.cancel();
  }
}
