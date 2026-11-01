import { Container, Graphics, Text } from 'pixi.js';
import type { Game, Scene } from '../game';
import { dictionaryUpTo, wordPool, type Word } from '../data/curriculum';
import { lowerTr } from '../data/syllabify';
import { Button } from '../ui/Button';
import { starIcon } from '../ui/icons';
import { CARD_H, SyllableCard, cardWidthFor } from '../ui/SyllableCard';
import { Dragger } from '../ui/drag';
import { TopBar } from '../ui/TopBar';
import { confetti } from '../ui/confetti';
import { C, CARD_COLORS, H, W, label, shuffle } from '../theme';
import { easeOutBack, shake, tween, wait } from '../tween';
import { sfx, speak } from '../audio';
import { currentTable, showEndPanel, tableTitle } from './common';
import { MenuScene } from './MenuScene';

const TARGETS = 4;
const MAX_CARDS = 10;
const MAX_LINE = 5;
const PANEL = { x: 820, y: 500, w: 1480, h: 230 };
const TRAY_Y = [790, 960];
const GAP = 30;

/**
 * "Serbest Oyun": birkaç kelimenin heceleri karışık verilir. Öğrenciler
 * heceleri birleştirerek kelime bulur; tablolardaki her kelime kabul edilir.
 */
export class FreeScene implements Scene {
  view = new Container();
  private top: TopBar;
  private dict: Map<string, Word>;
  private targets: Word[] = [];
  private found = new Set<string>();
  private cards: SyllableCard[] = [];
  private line: SyllableCard[] = [];
  private dragger: Dragger;
  private busy = false;

  private panel = new Graphics();
  private targetStars = new Container();
  private chips = new Container();
  private counter: Text;
  private hint: Text;
  private cardLayer = new Container();
  private dragLayer = new Container();

  constructor(private game: Game) {
    const table = currentTable(game);
    this.dict = dictionaryUpTo(table, game.settings.proper);
    this.top = new TopBar(game, tableTitle(table), () => this.toMenu());

    this.counter = label('', 40, C.muted, { fontWeight: '400' });
    this.counter.position.set(W / 2, 140);
    this.targetStars.position.set(W / 2, 200);
    this.chips.position.set(W / 2, 290);

    this.hint = label('Heceleri buraya sürükle', 44, C.line);
    this.hint.position.set(PANEL.x, PANEL.y);
    this.drawPanel(false);

    const ok = new Button({ width: 280, height: 120, color: C.green, text: 'Tamam', fontSize: 56, onTap: () => void this.check() });
    ok.position.set(1740, PANEL.y - 70);
    const clear = new Button({ width: 280, height: 100, color: C.muted, outline: true, text: 'Temizle', fontSize: 44, onTap: () => this.clearLine() });
    clear.position.set(1740, PANEL.y + 80);

    this.view.addChild(
      this.top,
      this.counter,
      this.targetStars,
      this.chips,
      this.panel,
      this.hint,
      ok,
      clear,
      this.cardLayer,
      this.dragLayer,
    );

    this.dragger = new Dragger(this.view, this.dragLayer, {
      canDrag: () => !this.busy,
      onTap: (c) => this.tapCard(c),
      onDrop: (c) => this.dropCard(c),
      onMove: (c) => this.drawPanel(this.inPanel(c)),
    });

    this.setupRound(wordPool(table, game.settings));
  }

  private setupRound(pool: Word[]) {
    // Toplam kart sayısı MAX_CARDS'ı aşmayacak şekilde hedef kelimeler seç.
    const counts = new Map<string, number>();
    for (const w of shuffle(pool.filter((w) => w.syllables.length <= 3))) {
      if (this.targets.length >= TARGETS) break;
      const next = new Map(counts);
      const own = new Map<string, number>();
      w.syllables.map(lowerTr).forEach((s) => own.set(s, (own.get(s) ?? 0) + 1));
      own.forEach((n, s) => next.set(s, Math.max(next.get(s) ?? 0, n)));
      const total = [...next.values()].reduce((a, b) => a + b, 0);
      if (total > MAX_CARDS) continue;
      this.targets.push(w);
      next.forEach((n, s) => counts.set(s, n));
    }

    const texts: string[] = [];
    counts.forEach((n, s) => {
      for (let i = 0; i < n; i++) texts.push(s);
    });
    const w = cardWidthFor(texts);
    const shuffled = shuffle(texts);
    const colors = shuffle(CARD_COLORS);
    const perRow = Math.ceil(shuffled.length / 2);
    shuffled.forEach((text, i) => {
      const row = i < perRow ? 0 : 1;
      const rowItems = row === 0 ? perRow : shuffled.length - perRow;
      const col = row === 0 ? i : i - perRow;
      const x0 = W / 2 - (rowItems * w + (rowItems - 1) * GAP) / 2 + w / 2;
      const card = new SyllableCard(text, colors[i % colors.length], w);
      card.home = { x: x0 + col * (w + GAP), y: TRAY_Y[row] };
      card.position.set(card.home.x, H + CARD_H);
      this.dragger.attach(card);
      this.cardLayer.addChild(card);
      this.cards.push(card);
      void wait(i * 50).then(() => tween(card, { y: card.home.y }, 450, easeOutBack));
    });

    this.updateHeader();
  }

  // --- Dizi (panel) yönetimi ---

  private inPanel(c: SyllableCard) {
    return Math.abs(c.x - PANEL.x) < PANEL.w / 2 + 40 && Math.abs(c.y - PANEL.y) < PANEL.h / 2 + 60;
  }

  private tapCard(card: SyllableCard) {
    if (this.line.includes(card)) {
      this.removeFromLine(card);
      void card.goHome();
    } else if (this.line.length < MAX_LINE) {
      this.line.push(card);
      this.cardLayer.addChild(card);
      this.layoutLine();
    }
  }

  private dropCard(card: SyllableCard) {
    this.drawPanel(false);
    this.cardLayer.addChild(card);
    const wasIn = this.line.includes(card);
    if (this.inPanel(card) && (wasIn || this.line.length < MAX_LINE)) {
      if (wasIn) this.line.splice(this.line.indexOf(card), 1);
      const at = this.line.filter((c) => c.x < card.x).length;
      this.line.splice(at, 0, card);
      this.layoutLine();
    } else {
      if (wasIn) this.removeFromLine(card);
      void card.goHome();
    }
  }

  private removeFromLine(card: SyllableCard) {
    this.line.splice(this.line.indexOf(card), 1);
    this.layoutLine();
  }

  private layoutLine() {
    this.hint.visible = this.line.length === 0;
    if (this.line.length === 0) return;
    const w = this.line[0].w;
    const gap = Math.min(16, (PANEL.w - 40 - this.line.length * w) / Math.max(1, this.line.length - 1));
    const total = this.line.length * w + (this.line.length - 1) * gap;
    const x0 = PANEL.x - total / 2 + w / 2;
    this.line.forEach((c, i) => void tween(c, { x: x0 + i * (w + gap), y: PANEL.y, scale: 1 }, 220));
  }

  private clearLine() {
    const cards = [...this.line];
    this.line = [];
    this.layoutLine();
    cards.forEach((c) => void c.goHome());
  }

  // --- Kontrol ---

  private async check() {
    if (this.busy) return;
    if (this.line.length < 2) {
      sfx.wrong();
      void shake(this.panel, 14);
      return;
    }
    const key = lowerTr(this.line.map((c) => c.syllable).join(''));
    const word = this.dict.get(key);
    const cards = [...this.line];

    if (!word) {
      sfx.wrong();
      cards.forEach((c) => c.setState('wrong'));
      await Promise.all(cards.map((c) => shake(c)));
      cards.forEach((c) => c.setState('idle'));
      return;
    }

    if (this.found.has(key)) {
      sfx.wrong();
      this.flash(`"${word.text}" zaten bulundu`);
      return;
    }

    this.busy = true;
    this.found.add(key);
    cards.forEach((c) => c.setState('correct'));
    sfx.win();
    confetti(this.view, PANEL.x, PANEL.y);
    speak(word.text, 0.75);
    this.game.stars++;
    void this.top.setStars(this.game.stars);
    this.addChip(word, this.targets.some((t) => lowerTr(t.text) === key));
    this.updateHeader();

    await wait(1100);
    this.line = [];
    this.layoutLine();
    await Promise.all(cards.map((c) => c.goHome()));
    this.busy = false;

    if (this.targets.every((t) => this.found.has(lowerTr(t.text)))) {
      showEndPanel(this.view, 'Harika!', `${this.found.size} kelime buldunuz.`, [
        { text: 'Yeni Tur', color: C.purple, onTap: () => this.game.go((g) => new FreeScene(g)) },
        { text: 'Menü', color: C.blue, onTap: () => this.toMenu() },
      ]);
    }
  }

  // --- Görsel yardımcılar ---

  private drawPanel(active: boolean) {
    const { x, y, w, h } = PANEL;
    this.panel.clear();
    this.panel
      .roundRect(x - w / 2, y - h / 2, w, h, 36)
      .fill({ color: active ? 0xfff4c2 : C.white, alpha: active ? 1 : 0.7 })
      .stroke({ width: 6, color: active ? C.yellow : C.line });
  }

  private updateHeader() {
    const foundTargets = this.targets.filter((t) => this.found.has(lowerTr(t.text))).length;
    this.counter.text = `Gizli kelimeler: ${foundTargets} / ${this.targets.length}`;
    this.targetStars.removeChildren().forEach((c) => c.destroy());
    this.targets.forEach((_, i) => {
      const s = i < foundTargets ? starIcon(C.yellow, 30) : starIcon(0xe9e1cc, 30);
      s.x = (i - (this.targets.length - 1) / 2) * 80;
      this.targetStars.addChild(s);
    });
  }

  private addChip(word: Word, isTarget: boolean) {
    const t = label(word.text, 48, isTarget ? C.green : C.blue);
    const w = t.width + 50;
    const chip = new Container();
    chip.addChild(
      new Graphics().roundRect(-w / 2, -38, w, 76, 38).fill(C.white).stroke({ width: 4, color: isTarget ? C.green : C.blue }),
      t,
    );
    this.chips.addChild(chip);
    // Yan yana ortala.
    const gap = 20;
    const widths = this.chips.children.map((c) => c.width);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1);
    let x = -total / 2;
    this.chips.children.forEach((c, i) => {
      c.x = x + widths[i] / 2;
      x += widths[i] + gap;
    });
    chip.scale.set(0.2);
    void tween(chip, { scale: 1 }, 400, easeOutBack);
  }

  private flash(message: string) {
    const t = label(message, 44, C.red);
    t.position.set(PANEL.x, PANEL.y - PANEL.h / 2 - 40);
    this.view.addChild(t);
    void wait(1200)
      .then(() => tween(t, { alpha: 0 }, 300))
      .then(() => t.destroy());
  }

  private toMenu() {
    this.game.go((g) => new MenuScene(g));
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') this.toMenu();
    else if (e.key === 'Enter') void this.check();
  }

  destroy() {
    speechSynthesis?.cancel();
  }
}
