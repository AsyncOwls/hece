import { Container, Graphics, Text } from 'pixi.js';
import type { Game, Scene } from '../game';
import { MAX_SYLLABLES, type Word } from '../data/curriculum';
import { lowerTr } from '../data/syllabify';
import { Button } from '../ui/Button';
import { playIcon } from '../ui/icons';
import { CARD_H, SyllableCard, cardWidthFor } from '../ui/SyllableCard';
import { Dragger } from '../ui/drag';
import { confetti } from '../ui/confetti';
import { Rainbow, SKY, SkyBackdrop, cloudTextY, drawCloud, hills } from '../ui/sky';
import { TeacherGear } from '../ui/TeacherGear';
import { C, CARD_COLORS, H, W, label, shuffle } from '../theme';
import { easeOutBack, shake, tween, wait } from '../tween';
import { sfx, speak } from '../audio';
import { capitalizeTr, gameBank, gamePool } from './common';
import { MenuScene } from './MenuScene';

const CLOUD_Y = 420;
const CLOUD_H = 230;
const TRAY_Y = [800, 965];
const GAP = 40;
/** Kelime tamamlandıktan sonra bir sonrakine geçmeden önce beklenen süre. */
const CELEBRATE_MS = 3600;

/** Hecenin bırakılacağı bulut. Boşken dokunulursa kelime yeniden okunur. */
class CloudSlot extends Container {
  card: SyllableCard | null = null;
  private bg = new Graphics();
  private ghost: Text;

  constructor(
    readonly expected: string,
    readonly w: number,
    showHint: boolean,
    onTap: () => void,
  ) {
    super();
    this.ghost = label(expected, 92, 0xb4c7d8);
    this.ghost.y = cloudTextY(0, CLOUD_H) - 6;
    this.ghost.visible = showHint;
    this.addChild(this.bg, this.ghost);
    this.highlight(false);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointertap', onTap);
  }

  highlight(on: boolean) {
    this.bg.clear();
    if (this.card) drawCloud(this.bg, 0, 0, this.w, CLOUD_H, SKY.cloud, 6, SKY.cloudEdge);
    else if (on) drawCloud(this.bg, 0, 0, this.w, CLOUD_H, 0xfff6c8, 8, C.yellow);
    else drawCloud(this.bg, 0, 0, this.w, CLOUD_H, 0xe4f1fb, 6, 0xffffff);
  }

  fill(card: SyllableCard) {
    this.card = card;
    this.ghost.visible = false;
    this.highlight(false);
  }

  get textY() {
    return this.y + cloudTextY(0, CLOUD_H) - 6;
  }

  contains(x: number, y: number) {
    return Math.abs(x - this.x) < this.w / 2 + 40 && Math.abs(y - this.y) < CLOUD_H / 2 + 60;
  }
}

/**
 * Çocukların gördüğü tek ekran: gökyüzünde boş bulutlar ve aşağıda heceler.
 * Heceler doğru sırayla bulutlara konunca kelime tek bulutta birleşir ve
 * gökkuşağı çıkar. Ayarlar yalnızca öğretmen içindir (sağ üstte basılı tut).
 */
export class SkyScene implements Scene {
  view = new Container();
  private words: Word[];
  private bank: string[];
  private index = 0;
  /** Her kelime geçişinde artar; bekleyen otomatik geçişleri geçersiz kılar. */
  private turn = 0;

  private rainbow = new Rainbow(W / 2, 790, 640, 38);
  private mergeCloud = new Graphics();
  private slotLayer = new Container();
  private cardLayer = new Container();
  private dragLayer = new Container();
  private overlay = new Container();

  private slots: CloudSlot[] = [];
  private cards: SyllableCard[] = [];
  private dragger: Dragger;
  private done = false;
  private finished = false;
  private alive = true;

  constructor(private game: Game) {
    const s = game.settings;
    const pool = gamePool(s).filter((w) => w.syllables.length <= MAX_SYLLABLES);
    this.words = shuffle(pool).slice(0, s.roundSize);
    this.bank = gameBank(s);

    const gear = new TeacherGear(() => this.toMenu());
    gear.position.set(W - 70, 70);

    this.view.addChild(
      new SkyBackdrop(),
      this.rainbow,
      hills(),
      this.mergeCloud,
      this.slotLayer,
      this.cardLayer,
      this.overlay,
      this.dragLayer,
      gear,
    );

    this.dragger = new Dragger(this.view, this.dragLayer, {
      canDrag: (c) => !this.done && !this.slots.some((s) => s.card === c),
      onTap: (c) => this.tapCard(c),
      onDrop: (c) => this.dropCard(c),
      onMove: (c) => this.slots.forEach((s) => s.highlight(!s.card && s.contains(c.x, c.y))),
    });

    if (this.words.length === 0) {
      // Çocuk ekranında yazı olmasın diye yalnızca öğretmene yönelik kısa bir not.
      const t = label('Bu seçimle kelime yok.\nAyarlar için sağ üstteki çarka basılı tutun.', 52, C.ink);
      t.position.set(W / 2, CLOUD_Y);
      this.overlay.addChild(t);
      return;
    }
    this.startWord();
  }

  private get word() {
    return this.words[this.index];
  }

  // --- Tur akışı ---

  private startWord() {
    const word = this.word;
    const s = this.game.settings;
    this.done = false;
    this.mergeCloud.clear();
    this.mergeCloud.alpha = 1;
    [...this.slots, ...this.cards].forEach((o) => o.destroy({ children: true }));
    this.slots = [];
    this.cards = [];

    const extras = this.pickDistractors(word, s.distractors);
    const texts = [...word.syllables, ...extras];
    const w = cardWidthFor(texts);

    // Bulutlar
    const n = word.syllables.length;
    const cw = Math.min(w + 60, (W - 120 - (n - 1) * GAP) / n);
    const x0 = W / 2 - (n * cw + (n - 1) * GAP) / 2 + cw / 2;
    word.syllables.forEach((syl, i) => {
      const slot = new CloudSlot(syl, cw, s.showWord, () => this.speakWord());
      slot.position.set(x0 + i * (cw + GAP), CLOUD_Y - 40);
      slot.alpha = 0;
      void wait(i * 120).then(() => tween(slot, { alpha: 1, y: CLOUD_Y }, 500, easeOutBack));
      this.slotLayer.addChild(slot);
      this.slots.push(slot);
    });

    // Heceler (karışık, bir ya da iki sıra)
    const shuffled = shuffle(texts);
    const colors = s.oneColor ? [C.ink] : shuffle(CARD_COLORS);
    const perRow = Math.max(1, Math.floor((W - 160 + GAP) / (w + GAP)));
    const rows: string[][] = [];
    for (let i = 0; i < shuffled.length; i += perRow) rows.push(shuffled.slice(i, i + perRow));
    if (rows.length === 1 && shuffled.length > 5) {
      const half = Math.ceil(shuffled.length / 2);
      rows.splice(0, 1, shuffled.slice(0, half), shuffled.slice(half));
    }
    // Tek sıra varsa çimenin ortasına koy.
    const ys = rows.length === 1 ? [880] : TRAY_Y;
    let k = 0;
    rows.forEach((row, r) => {
      const rx0 = W / 2 - (row.length * w + (row.length - 1) * GAP) / 2 + w / 2;
      row.forEach((text, i) => {
        const card = new SyllableCard(text, colors[k % colors.length], w);
        card.home = { x: rx0 + i * (w + GAP), y: ys[r] ?? ys[ys.length - 1] };
        card.position.set(card.home.x, H + CARD_H);
        this.dragger.attach(card);
        this.cardLayer.addChild(card);
        this.cards.push(card);
        void wait(300 + k * 60).then(() => tween(card, { y: card.home.y }, 450, easeOutBack));
        k++;
      });
    });

    void wait(700).then(() => this.alive && this.speakWord());
  }

  private pickDistractors(word: Word, count: number): string[] {
    if (count === 0) return [];
    const target = new Set(word.syllables.map(lowerTr));
    const candidates = shuffle(this.bank.filter((s) => !target.has(s)));
    // Önce hedef hecelerle aynı harfle başlayanlar: daha dikkatli okumayı gerektirir.
    const firsts = new Set([...target].map((s) => s[0]));
    const similar = candidates.filter((s) => firsts.has(s[0]));
    const picked = [...new Set([...similar.slice(0, Math.ceil(count / 2)), ...candidates])].slice(0, count);
    // Özel isimde büyük harfle başlayan tek kart ipucu olmasın.
    if (word.proper && picked.length > 0) picked[0] = capitalizeTr(picked[0]);
    return picked;
  }

  private async next() {
    if (!this.done || this.finished) return;
    this.turn++;
    this.index++;
    if (this.index >= this.words.length) return this.finale();
    const old = [...this.cards];
    void this.rainbow.hide(400);
    old.forEach((c) => void tween(c, { alpha: 0 }, 300));
    await tween(this.mergeCloud, { alpha: 0 }, 300);
    if (!this.alive) return;
    this.startWord();
  }

  /** Tur bitti: büyük gökkuşağı, "Aferin!" bulutu ve yeniden oyna düğmesi. */
  private finale() {
    this.finished = true;
    this.cards.forEach((c) => void tween(c, { alpha: 0 }, 300));
    this.slots.forEach((s) => void tween(s, { alpha: 0 }, 300));
    if (!this.rainbow.shown) void this.rainbow.show(1100);
    this.mergeCloud.clear();
    const t = label('Aferin!', 130, C.red);
    const bw = t.width + 200;
    drawCloud(this.mergeCloud, W / 2, CLOUD_Y, bw, 290, SKY.cloud, 7, SKY.cloudEdge);
    t.position.set(W / 2, cloudTextY(CLOUD_Y, 290) - 8);
    this.overlay.addChild(t);
    t.scale.set(0.3);
    void tween(t, { scale: 1 }, 500, easeOutBack);

    sfx.win();
    confetti(this.view, W / 2 - 400, CLOUD_Y, 70);
    confetti(this.view, W / 2 + 400, CLOUD_Y, 70);
    void wait(500).then(() => this.alive && confetti(this.view, W / 2, CLOUD_Y - 100, 90));

    const again = new Button({
      width: 200,
      height: 200,
      radius: 100,
      color: C.green,
      icon: playIcon(C.white),
      onTap: () => this.game.go((g) => new SkyScene(g)),
    });
    again.position.set(W / 2, 870);
    again.scale.set(0.2);
    this.overlay.addChild(again);
    void wait(600).then(() => tween(again, { scale: 1 }, 450, easeOutBack));
  }

  // --- Yerleştirme ---

  private tapCard(card: SyllableCard) {
    const slot = this.slots.find((s) => !s.card);
    if (slot) void this.tryPlace(card, slot);
  }

  private dropCard(card: SyllableCard) {
    this.slots.forEach((s) => s.highlight(false));
    const slot = this.slots.find((s) => s.contains(card.x, card.y));
    if (!slot || slot.card) {
      this.cardLayer.addChild(card);
      void card.goHome();
      return;
    }
    void this.tryPlace(card, slot);
  }

  private async tryPlace(card: SyllableCard, slot: CloudSlot) {
    this.cardLayer.addChild(card);
    if (lowerTr(card.syllable) === lowerTr(slot.expected)) {
      slot.fill(card);
      card.eventMode = 'none';
      card.setState('merged');
      sfx.correct();
      speak(card.syllable);
      await tween(card, { x: slot.x, y: slot.textY, scale: 1 }, 220);
      if (this.slots.every((s) => s.card)) void this.complete();
      return;
    }
    // Yanlış hece: bulutun önünde sallanıp yerine döner.
    card.eventMode = 'none';
    await tween(card, { x: slot.x, y: slot.y, scale: 1 }, 200);
    card.setState('wrong');
    sfx.wrong();
    await shake(card);
    await wait(150);
    await card.goHome();
    card.eventMode = 'static';
  }

  private async complete() {
    this.done = true;
    const turn = this.turn;
    const placed = this.slots.map((s) => s.card!);
    const extras = this.cards.filter((c) => !placed.includes(c));
    extras.forEach((c) => void tween(c, { alpha: 0, y: c.y + 80 }, 300));

    await wait(250);
    if (!this.alive) return;
    // Bulutlar birleşip tek bir büyük bulut olur.
    const tight = 4;
    const scale = 1.2;
    const total = placed.reduce((sum, c) => sum + c.textWidth, 0) + tight * (placed.length - 1);
    const bw = Math.min(W - 160, total * scale + 220);
    const bh = 280;
    drawCloud(this.mergeCloud, W / 2, CLOUD_Y, bw, bh, SKY.cloud, 7, SKY.cloudEdge);
    this.mergeCloud.alpha = 0;
    this.mergeCloud.scale.set(1);
    void tween(this.mergeCloud, { alpha: 1 }, 350);
    this.slots.forEach((s) => void tween(s, { alpha: 0 }, 350));

    let x = W / 2 - (total * scale) / 2;
    const moves = placed.map((c) => {
      const cx = x + (c.textWidth * scale) / 2;
      x += (c.textWidth + tight) * scale;
      return tween(c, { x: cx, y: cloudTextY(CLOUD_Y, bh) - 8, scale }, 420, easeOutBack);
    });
    await Promise.all(moves);
    if (!this.alive) return;

    sfx.win();
    void this.rainbow.show(1100);
    confetti(this.view, W / 2, CLOUD_Y, 60);
    void wait(400).then(() => this.alive && speak(this.word.text, 0.75));

    await wait(CELEBRATE_MS);
    if (this.alive && turn === this.turn) void this.next();
  }

  // --- Yardımcılar ---

  private speakWord() {
    if (this.word && !this.done) speak(this.word.text, 0.75);
  }

  private toMenu() {
    this.game.go((g) => new MenuScene(g));
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') this.toMenu();
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (this.finished) this.game.go((g) => new SkyScene(g));
      else if (this.done) void this.next();
      else this.speakWord();
    }
  }

  destroy() {
    this.alive = false;
    speechSynthesis?.cancel();
  }
}
