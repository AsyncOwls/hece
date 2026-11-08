import { Container, Graphics, Text, Ticker } from 'pixi.js';
import type { Game, Scene } from '../game';
import { buildSortBoard, canFormWords, pairKey, pairSet, pickSortWords, repairSyllables, rowBlocked, sortSize, sortWordCount } from '../data/sort';
import { Button } from '../ui/Button';
import { checkIcon } from '../ui/icons';
import { Dragger } from '../ui/drag';
import { confetti } from '../ui/confetti';
import { TeacherGear } from '../ui/TeacherGear';
import { RAINBOW, Rainbow, SKY, SkyBackdrop, hills } from '../ui/sky';
import { C, H, W, darken, label } from '../theme';
import { easeInOut, easeOutBack, tween, wait } from '../tween';
import { sfx, speak } from '../audio';
import { sortPairs, sortWords } from './common';

/** Birleşen kelimeler sırayla gökkuşağının renklerini alır. */
const MERGE_COLORS = RAINBOW;
/** Bitişte kelime balonlarının çevresinde beliren beyaz kenarın kalınlığı. */
const CANDY_EDGE = 7;
/** Heceler doğrudan gökyüzünde durur; beyaz balonlar kenarlarıyla seçilir. */
const TILE_EDGE = 0x8fc3ea;
/** Bitişteki ✓ düğmesi. */
const TICK_SIZE = 180;
const TICK_Y = H - 130;
/**
 * Oyun bitince kelime grubunun sığdırıldığı alan: ekranın ortasında, gökkuşağı
 * kemerinin içinde kalacak kadar küçük.
 */
const WIN_BOX = { top: H / 2 - 190, bottom: H / 2 + 190, width: 900 };
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
  private txt: Text;

  constructor(
    /** Oyun durumundaki hece; değişince görüntü change() ile yetişir. */
    public syllable: string,
    readonly w: number,
    readonly h: number,
    font: number,
  ) {
    super();
    this.txt = label(syllable, font, C.ink);
    this.txt.y = -4;
    this.addChild(this.bg, this.txt);
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
    if (state === 'idle') this.bg.stroke({ width: 6, color: TILE_EDGE });
    else this.bg.stroke({ width: state === 'selected' ? 8 : 6, color: C.yellow });
  }

  /** Yeni heceyi gösterir: kart gibi dönüp öbür yüzüyle gelir. */
  async change() {
    let swapped = false;
    await animate(460, (t) => {
      if (this.destroyed) return;
      this.scale.x = Math.abs(Math.cos(Math.PI * t));
      if (t >= 0.5 && !swapped) {
        swapped = true;
        this.txt.text = this.syllable;
      }
    });
    if (!this.destroyed) this.scale.x = 1;
  }
}

/**
 * İki hece birleşince oluşan şeker gibi uzun, parlak balon. `goo` 0 iken yan yana
 * iki ayrı damladır; arttıkça aralarında boyun oluşup kalınlaşır, 1'de tek balon olur.
 */
class Candy extends Container {
  private g = new Graphics();
  /** Balonun çevresindeki beyaz kenar; yalnız bitişte (gökkuşağıyla) belirir. */
  readonly edge = new Graphics();
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
    this.edge.alpha = 0;
    this.addChild(this.edge, this.g, this.txt);
    this.draw(0);
  }

  get textView() {
    return this.txt;
  }

  draw(goo: number) {
    const { cellW, gap, h, color } = this;
    const r = h / 2;
    const w = cellW * 2 + gap;
    let g = this.g;
    g.clear();
    this.edge.clear();

    // pad > 0: şekil her yandan o kadar büyük çizilir (beyaz kenar için).
    const shape = (dy: number, fill: number, pad = 0) => {
      g.roundRect(-w / 2 - pad, -r + dy - pad, cellW + 2 * pad, h + 2 * pad, r + pad).fill(fill);
      g.roundRect(w / 2 - cellW - pad, -r + dy - pad, cellW + 2 * pad, h + 2 * pad, r + pad).fill(fill);
      if (goo <= 0) return;
      // İki damlanın iç uçları arasında içe kıvrık boyun; ortası goo ile kalınlaşır.
      const x1 = -w / 2 + cellW - r;
      const x2 = w / 2 - cellW + r;
      const m = r * goo;
      g.moveTo(x1, -r + dy - pad)
        .quadraticCurveTo(0, r - 2 * m + dy - pad, x2, -r + dy - pad)
        .lineTo(x2, r + dy + pad)
        .quadraticCurveTo(0, 2 * m - r + dy + pad, x1, r + dy + pad)
        .closePath()
        .fill(fill);
    };
    // Beyaz kenar balonu gölgesiyle birlikte sarar; ayrı katmanda, görünürlüğü edge.alpha.
    g = this.edge;
    shape(0, 0xffffff, CANDY_EDGE);
    shape(8, 0xffffff, CANDY_EDGE);
    g = this.g;
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
 * Heceleri Bul: n×n tahtada karışık heceler. Çocuk iki bloğun yerini değiştirir
 * (sürükleyerek ya da sırayla iki bloğa dokunarak). Aynı satırda yan yana gelen
 * iki hece bir kelime olunca bloklar birleşir, renklenir ve yerinde sabit kalır.
 * Gökyüzünde geçer: birleşen kelimeler sırayla gökkuşağının renklerini alır,
 * oyun bitince tahta görünür kalır, arkasında büyük gökkuşağı, ardından altta
 * yeşil ✓ (yeni tur) çıkar.
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
  /** Tahtaya konan kelimelerin çiftleri: hece değiştirirken önce bunlar kullanılır. */
  private boardPairs = new Set<string>();
  private colors = MERGE_COLORS;
  /** Bitişte tahtanın arkasında, onu çevreleyen büyük gökkuşağı. */
  private rainbow = new Rainbow(W / 2, 900, 860, 44);
  private mergedCount = 0;
  /** Tahtanın (kenar boşluğuyla) boyutu; ortası ekranın ortası. */
  private boardSize = { w: 0, h: 0 };
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
    this.boardPairs = pairSet(words);
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
    this.boardSize = { w: bw + pad * 2, h: bh + pad * 2 };
    // Tahtanın zemini yok: heceler ve kelime balonları kenarlarıyla gökyüzünde durur.

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
    const repaired = this.repair();
    // Tahtada yer kalmadıysa ya da kalan hecelerle artık kelime kurulamıyorsa oyun biter.
    const over = this.blocks.length >= sortWordCount(this.n) || !canFormWords(this.freeSyllables(), 1, this.pairs);
    if (over) this.won = true;
    void this.showMerge(left, right, block, from, text, moved, repaired, over);
  }

  private async showMerge(
    left: Tile,
    right: Tile,
    block: Block,
    from: { x: number; y: number },
    text: string,
    moved: Tile[],
    repaired: Tile[],
    over: boolean,
  ) {
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

    if (repaired.length) {
      // Değişen heceler dönerek yenilenir; yeni hal hemen bir kelime kurduysa o da birleşir.
      if (!moved.length) await wait(550);
      if (!this.alive) return;
      sfx.bubble();
      await Promise.all(repaired.map((t) => t.change()));
      if (!this.alive) return;
      const live = repaired.filter((t) => !t.destroyed && this.tiles[t.cell] === t);
      live.forEach((t) => {
        t.eventMode = 'static';
        t.draw(t === this.selected ? 'selected' : 'idle');
      });
      this.checkWords(live.map((t) => t.cell));
    }

    if (over) {
      await wait(1200);
      if (this.alive) void this.win();
    }
  }

  /**
   * Çocuk tahtadakinden farklı bir kelime kurup kalan heceleri kelimesiz bıraktıysa
   * en az heceyi değiştirir (bkz. repairSyllables). Durum hemen değişir; değişen
   * heceler görüntü yenilenene kadar dokunulamaz.
   */
  private repair(): Tile[] {
    const free = this.tiles.filter((t): t is Tile => t !== null);
    const changes = repairSyllables(free.map((t) => t.syllable), this.pairs, this.boardPairs);
    return [...changes].map(([i, syllable]) => {
      const t = free[i];
      t.syllable = syllable;
      t.eventMode = 'none';
      if (this.selected === t) this.select(null);
      return t;
    });
  }

  /** Henüz kelimeye katılmamış heceler. */
  private freeSyllables() {
    return this.tiles.filter((t): t is Tile => t !== null).map((t) => t.syllable);
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

  /**
   * Oyun bitti: tahta görünür kalır, küçülüp yukarı kayar; arkasında gökkuşağı
   * çizilir, sonra altta yeşil ✓ (yeniden oyna) çıkar.
   */
  private async win() {
    this.won = true;
    this.select(null);
    // Tahta, gökkuşağı arkada görünsün ve altında ✓'e yer kalsın diye küçülüp ortalanır.
    const { w, h } = this.boardSize;
    const s = Math.min(1, (WIN_BOX.bottom - WIN_BOX.top) / h, WIN_BOX.width / w);
    const to = { x: W / 2 - (s * W) / 2, y: (WIN_BOX.top + WIN_BOX.bottom) / 2 - (s * H) / 2, scale: s };
    await Promise.all([this.boardLayer, this.blockLayer, this.tileLayer].map((l) => tween(l, to, 500, easeInOut)));
    if (!this.alive) return;

    sfx.win();
    confetti(this.view, W / 2 - 600, 300, 60);
    confetti(this.view, W / 2 + 600, 300, 60);
    // Gökkuşağı çizilirken kelime balonlarının çevresinde beyaz kenar belirir.
    for (const b of this.blocks) void tween(b.view.edge, { alpha: 1 }, 900);
    await this.rainbow.show(1100);
    if (!this.alive) return;

    const again = new Button({
      width: TICK_SIZE,
      height: TICK_SIZE,
      radius: TICK_SIZE / 2,
      color: C.green,
      icon: checkIcon(C.white, TICK_SIZE * 0.26),
      onTap: () => this.again(),
    });
    again.position.set(W / 2, TICK_Y);
    again.scale.set(0.2);
    this.overlay.addChild(again);
    void tween(again, { scale: 1 }, 450, easeOutBack);
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
