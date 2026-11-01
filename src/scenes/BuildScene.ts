import { Container, Graphics, Text } from 'pixi.js';
import type { Game, Scene } from '../game';
import { wordPool, type Table, type Word } from '../data/curriculum';
import { lowerTr } from '../data/syllabify';
import { Button } from '../ui/Button';
import { eyeIcon, speakerIcon } from '../ui/icons';
import { CARD_H, Slot, SyllableCard, cardWidthFor } from '../ui/SyllableCard';
import { Dragger } from '../ui/drag';
import { TopBar } from '../ui/TopBar';
import { confetti } from '../ui/confetti';
import { C, CARD_COLORS, H, W, label, shuffle } from '../theme';
import { easeOutBack, shake, tween, wait } from '../tween';
import { canSpeak, sfx, speak } from '../audio';
import { capitalizeTr, currentTable, showEndPanel, syllableBank, tableTitle } from './common';
import { MenuScene } from './MenuScene';

const WORD_Y = 250;
const SLOT_Y = 480;
const TRAY_Y = [760, 940];
const GAP = 36;

/**
 * "Kelime Kur": hedef kelime söylenir (ya da yazılı gösterilir), öğrenci
 * karışık heceleri doğru sırayla kutulara yerleştirir.
 */
export class BuildScene implements Scene {
  view = new Container();
  private table: Table;
  private words: Word[];
  private bank: string[];
  private index = 0;

  private top: TopBar;
  private progress = new Container();
  private wordText: Text;
  private listenBtn?: Button;
  private revealBtn: Button;
  private nextBtn: Button;
  private slotLayer = new Container();
  private cardLayer = new Container();
  private dragLayer = new Container();
  private mergeBg = new Graphics();

  private slots: Slot[] = [];
  private cards: SyllableCard[] = [];
  private dragger: Dragger;
  private revealed = false;
  private done = false;

  constructor(private game: Game) {
    const s = game.settings;
    this.table = currentTable(game);
    const pool = wordPool(this.table, s).filter((w) => w.syllables.length <= 5);
    this.words = shuffle(pool).slice(0, s.roundSize);
    this.bank = syllableBank(this.table);

    this.top = new TopBar(game, tableTitle(this.table), () => this.toMenu());
    this.progress.position.set(W / 2, 125);

    this.wordText = label('', 110, C.ink);
    this.wordText.position.set(W / 2, WORD_Y);

    if (canSpeak()) {
      this.listenBtn = new Button({
        width: 300,
        height: 120,
        color: C.blue,
        text: 'Dinle',
        fontSize: 52,
        icon: speakerIcon(C.white),
        onTap: () => this.speakWord(),
      });
      this.listenBtn.position.set(260, WORD_Y);
    }
    this.revealBtn = new Button({
      width: 300,
      height: 120,
      color: C.teal,
      text: 'Göster',
      fontSize: 52,
      icon: eyeIcon(C.white),
      onTap: () => this.toggleReveal(),
    });
    this.revealBtn.position.set(W - 260, WORD_Y);

    this.nextBtn = new Button({
      width: 460,
      height: 150,
      color: C.green,
      text: 'Sonraki',
      fontSize: 68,
      onTap: () => this.next(),
    });
    this.nextBtn.position.set(W / 2, 850);
    this.nextBtn.visible = false;

    this.slotLayer.addChild(this.mergeBg);
    this.view.addChild(
      this.top,
      this.progress,
      this.wordText,
      this.revealBtn,
      this.slotLayer,
      this.cardLayer,
      this.nextBtn,
      this.dragLayer,
    );
    if (this.listenBtn) this.view.addChild(this.listenBtn);

    this.dragger = new Dragger(this.view, this.dragLayer, {
      canDrag: (c) => !this.done && !this.slots.some((s) => s.card === c),
      onTap: (c) => this.tapCard(c),
      onDrop: (c) => this.dropCard(c),
      onMove: (c) => this.slots.forEach((s) => s.highlight(!s.card && s.contains(c.x, c.y))),
    });

    if (this.words.length === 0) {
      const t = label('Bu seçimle oynanacak kelime yok.\nMenüden ayarları değiştirin.', 56, C.muted);
      t.position.set(W / 2, H / 2);
      this.view.addChild(t);
      this.revealBtn.visible = false;
      if (this.listenBtn) this.listenBtn.visible = false;
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
    this.revealed = false;
    this.nextBtn.visible = false;
    this.mergeBg.clear();
    [...this.slots, ...this.cards].forEach((o) => o.destroy({ children: true }));
    this.slots = [];
    this.cards = [];

    const extras = this.pickDistractors(word, s.distractors);
    const texts = [...word.syllables, ...extras];
    const w = cardWidthFor(texts);

    // Kutular
    const n = word.syllables.length;
    const x0 = W / 2 - (n * w + (n - 1) * GAP) / 2 + w / 2;
    word.syllables.forEach((syl, i) => {
      const slot = new Slot(syl, w);
      slot.position.set(x0 + i * (w + GAP), SLOT_Y);
      slot.alpha = 0;
      void tween(slot, { alpha: 1 }, 300);
      this.slotLayer.addChild(slot);
      this.slots.push(slot);
    });

    // Kartlar (karışık, bir ya da iki sıra)
    const shuffled = shuffle(texts);
    const colors = shuffle(CARD_COLORS);
    const perRow = Math.max(1, Math.floor((W - 160 + GAP) / (w + GAP)));
    const rows: string[][] = [];
    for (let i = 0; i < shuffled.length; i += perRow) rows.push(shuffled.slice(i, i + perRow));
    if (rows.length === 1 && shuffled.length > 5) {
      // Tek uzun sıra yerine iki dengeli sıra daha okunaklı.
      const half = Math.ceil(shuffled.length / 2);
      rows.splice(0, 1, shuffled.slice(0, half), shuffled.slice(half));
    }
    let k = 0;
    rows.forEach((row, r) => {
      const rx0 = W / 2 - (row.length * w + (row.length - 1) * GAP) / 2 + w / 2;
      row.forEach((text, i) => {
        const card = new SyllableCard(text, colors[k % colors.length], w);
        card.home = { x: rx0 + i * (w + GAP), y: TRAY_Y[r] ?? TRAY_Y[1] };
        card.position.set(card.home.x, H + CARD_H);
        this.dragger.attach(card);
        this.cardLayer.addChild(card);
        this.cards.push(card);
        void wait(k * 60).then(() => tween(card, { y: card.home.y }, 450, easeOutBack));
        k++;
      });
    });

    this.updateWordText();
    this.updateProgress();
    if (!s.showWord) void wait(500).then(() => this.speakWord());
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

  private next() {
    if (!this.done) return;
    this.index++;
    if (this.index >= this.words.length) {
      this.nextBtn.visible = false;
      showEndPanel(this.view, 'Tebrikler!', `${this.words.length} kelime kurdunuz.`, [
        { text: 'Yeni Tur', color: C.blue, onTap: () => this.game.go((g) => new BuildScene(g)) },
        { text: 'Menü', color: C.purple, onTap: () => this.toMenu() },
      ]);
      return;
    }
    this.startWord();
  }

  // --- Yerleştirme ---

  private tapCard(card: SyllableCard) {
    const slot = this.slots.find((s) => !s.card);
    if (slot) this.tryPlace(card, slot);
  }

  private dropCard(card: SyllableCard) {
    this.slots.forEach((s) => s.highlight(false));
    const slot = this.slots.find((s) => s.contains(card.x, card.y));
    if (!slot || slot.card) {
      this.cardLayer.addChild(card);
      void card.goHome();
      return;
    }
    this.tryPlace(card, slot);
  }

  private async tryPlace(card: SyllableCard, slot: Slot) {
    this.cardLayer.addChild(card);
    if (lowerTr(card.syllable) === lowerTr(slot.expected)) {
      slot.card = card;
      card.eventMode = 'none';
      card.setState('correct');
      sfx.correct();
      speak(card.syllable);
      await tween(card, { x: slot.x, y: slot.y, scale: 1 }, 220);
      if (this.slots.every((s) => s.card)) void this.complete();
      return;
    }
    // Yanlış hece: kutunun önünde sallanıp yerine döner.
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
    const placed = this.slots.map((s) => s.card!);
    const extras = this.cards.filter((c) => !placed.includes(c));
    extras.forEach((c) => void tween(c, { alpha: 0, y: c.y + 80 }, 300));
    this.slots.forEach((s) => void tween(s, { alpha: 0 }, 300));

    await wait(250);
    // Heceler birleşip tek kelime olur.
    const tight = 4;
    const total = placed.reduce((sum, c) => sum + c.textWidth, 0) + tight * (placed.length - 1);
    let x = W / 2 - total / 2;
    const moves = placed.map((c) => {
      const cx = x + c.textWidth / 2;
      x += c.textWidth + tight;
      c.setState('merged');
      return tween(c, { x: cx, y: SLOT_Y, scale: 1.15 }, 380, easeOutBack);
    });
    const bw = total * 1.15 + 120;
    const bh = CARD_H + 30;
    this.mergeBg.clear();
    this.mergeBg
      .roundRect(W / 2 - bw / 2, SLOT_Y - bh / 2, bw, bh, 36)
      .fill(0xeaf7ec)
      .stroke({ width: 7, color: C.green });
    this.mergeBg.alpha = 0;
    void tween(this.mergeBg, { alpha: 1 }, 300);
    await Promise.all(moves);

    sfx.win();
    confetti(this.view, W / 2, SLOT_Y);
    this.revealed = true;
    this.updateWordText();
    void wait(350).then(() => speak(this.word.text, 0.75));

    this.game.stars++;
    void this.top.setStars(this.game.stars);
    this.updateProgress();

    this.nextBtn.setText(this.index === this.words.length - 1 ? 'Bitir' : 'Sonraki');
    this.nextBtn.visible = true;
    this.nextBtn.scale.set(0.3);
    void tween(this.nextBtn, { scale: 1 }, 400, easeOutBack);
  }

  // --- Yardımcılar ---

  private speakWord() {
    if (this.word) speak(this.word.text, 0.75);
  }

  private toggleReveal() {
    this.revealed = !this.revealed;
    this.updateWordText();
  }

  private updateWordText() {
    const show = this.game.settings.showWord || this.revealed;
    this.wordText.text = show ? this.word.text : '';
    this.revealBtn.visible = !this.game.settings.showWord;
    this.revealBtn.setText(this.revealed ? 'Gizle' : 'Göster');
  }

  private updateProgress() {
    this.progress.removeChildren().forEach((c) => c.destroy());
    const n = this.words.length;
    const gap = 46;
    this.words.forEach((_, i) => {
      const doneDot = i < this.index || (i === this.index && this.done);
      const g = new Graphics().circle(0, 0, i === this.index ? 15 : 12);
      if (doneDot) g.fill(C.green);
      else g.fill(C.white).stroke({ width: 4, color: i === this.index ? C.ink : C.line });
      g.x = (i - (n - 1) / 2) * gap;
      this.progress.addChild(g);
    });
  }

  private toMenu() {
    this.game.go((g) => new MenuScene(g));
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') this.toMenu();
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (this.done) this.next();
      else this.speakWord();
    }
  }

  destroy() {
    speechSynthesis?.cancel();
  }
}
