import { Container, Graphics, Text } from 'pixi.js';
import type { Game, Scene } from '../game';
import { CURRICULUM } from '../data/curriculum';
import { SORT_SIZES, sortWordCount, twoSyllable } from '../data/sort';
import { parseCustomWords } from '../data/custom';
import { SENTENCE_SETS, parseCustomSentences, sentencesOf } from '../data/sentences';
import { Button } from '../ui/Button';
import { fishIcon, fullscreenIcon, playIcon } from '../ui/icons';
import { openListEditor } from '../ui/ListEditor';
import { ScrollList } from '../ui/ScrollList';
import { openShareDialog } from '../ui/ShareDialog';
import { shareUrl } from '../share';
import { C, GROUP_COLORS, W, label } from '../theme';
import { lowerTr } from '../data/syllabify';
import { currentVoice, onVoicesChanged, sfx, speak, turkishVoices, type SoundMode } from '../audio';
import type { Settings } from '../settings';
import { gamePool, mySentences, myWords, sentencePool, sortWords } from './common';
import { SentenceScene } from './SentenceScene';
import { SkyScene } from './SkyScene';
import { SortScene } from './SortScene';

const DISTRACTOR_STEPS = [0, 2, 4];
const SOUND_STEPS: SoundMode[] = ['on', 'effects', 'off'];
const SOUND_LABELS: Record<SoundMode, string> = { on: 'Açık', effects: 'Okuma kapalı', off: 'Sessiz' };
const CREATURE_STEPS = [4, 6, 8];

interface OptionDef {
  title: string;
  value: string;
  tap: () => void;
}

const CARD_Y = 130;
const CARD_H = 590;
const OPTIONS_Y = 815;

function tappable<T extends Container>(c: T, onTap: () => void): T {
  c.eventMode = 'static';
  c.cursor = 'pointer';
  c.on('pointertap', onTap);
  return c;
}

/** Onay kutusu ve yazısı; sol kenarı (0, 0) noktasında. */
function checkRow(text: string, on: boolean, size: number, fontSize: number, bold: boolean, onTap: () => void) {
  const box = new Graphics().roundRect(0, -size / 2, size, size, size * 0.22);
  if (on) {
    box.fill(C.green);
    box
      .moveTo(size * 0.24, 0)
      .lineTo(size * 0.43, size * 0.2)
      .lineTo(size * 0.77, -size * 0.2)
      .stroke({ width: size * 0.14, color: C.white, cap: 'round', join: 'round' });
  } else {
    box.fill(C.white).stroke({ width: 4, color: C.line });
  }
  const t = label(text, fontSize, on ? C.ink : C.muted, { fontWeight: bold ? '700' : '400' });
  t.anchor.set(0, 0.5);
  t.x = size + 18;
  const hit = new Graphics().rect(-10, -size / 2 - 10, t.x + t.width + 20, size + 20).fill({ color: 0xffffff, alpha: 0.001 });
  const row = new Container();
  row.addChild(hit, box, t);
  return tappable(row, () => {
    sfx.click();
    onTap();
  });
}

/**
 * Öğeleri satırlara dizer; bir öğe asla ortadan bölünmez (Pixi'nin kaydırması
 * "ka-lem" gibi heceli kelimeleri tireden böler). Sığmayanların yerine "…".
 */
function wrapItems(t: Text, items: string[], separator: string, maxWidth: number, maxLines: number): string {
  const lines: string[][] = [];
  let line: string[] = [];
  for (const item of items) {
    t.text = [...line, item].join(separator);
    if (line.length && (separator === '\n' || t.width > maxWidth)) {
      lines.push(line);
      if (lines.length === maxLines) break;
      line = [];
    }
    line.push(item);
  }
  if (lines.length < maxLines && line.length) lines.push(line);
  const shown = lines.reduce((n, l) => n + l.length, 0);
  return lines.map((l) => l.join(separator)).join('\n') + (shown < items.length ? '  …' : '');
}

/** İki satırlı ayar butonu: üstte başlık, altta değer. */
class OptionButton extends Container {
  private bg = new Graphics();
  private value: Text;

  constructor(title: string, private w: number, private h: number, onTap: () => void) {
    super();
    const t = label(title, 22, C.muted, { fontWeight: '400' });
    t.y = -17;
    this.value = label('', 30, C.ink);
    this.value.y = 16;
    this.addChild(this.bg, t, this.value);
    tappable(this, () => {
      sfx.click();
      onTap();
    });
  }

  set(value: string) {
    this.value.text = value;
    const { w, h } = this;
    this.bg.clear();
    this.bg.roundRect(-w / 2, -h / 2, w, h, 20).fill(C.white).stroke({ width: 3, color: C.line });
  }
}

/**
 * Öğretmen ekranı. Üstte iki bölüm: Hece Birleştir ve Cümle Okuyorum. Her
 * bölümde solda harf tablolarından gelen hazır içerik, sağda öğretmenin
 * kendi yazdıkları; ikisi ayrı ayrı açılıp kapanır (ikisi açıksa karışır).
 */
export class MenuScene implements Scene {
  view = new Container();
  private body = new Container();
  private offVoices: () => void;
  /** Kaydırılan listelerin konumu; menü yeniden çizilince kaldığı yerden devam eder. */
  private scrolled: Record<string, number> = {};

  constructor(private game: Game) {
    const fs = new Button({ width: 68, height: 62, color: C.muted, outline: true, flat: true, icon: fullscreenIcon(C.muted), onTap: () => game.toggleFullscreen() });
    fs.position.set(W - 80, 60);
    this.view.addChild(fs, this.body);
    // Tarayıcı sesleri geç yükleyebilir; gelince ses satırı güncellensin.
    this.offVoices = onVoicesChanged(() => this.refresh());
    this.refresh();
  }

  private get s() {
    return this.game.settings;
  }

  /** Ayarı değiştirir, kaydeder ve ekranı yeniden çizer. */
  private change(fn: () => void) {
    fn();
    this.game.save();
    this.refresh();
  }

  private refresh() {
    this.body.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.drawTabs();
    if (this.s.tab === 'syllable') this.drawSyllableTab();
    else if (this.s.tab === 'sort') this.drawSortTab();
    else this.drawSentenceTab();
    this.drawVoiceRow();
    const hint = label('Oyundan çıkmak için sağ üstteki çarka basılı tutun (ya da Esc).', 24, C.muted, { fontWeight: '400' });
    hint.anchor.set(0, 0.5);
    hint.position.set(66, 985);
    this.body.addChild(hint);
  }

  /** Bölüm seçimi: tek bir çubuk, seçili bölüm beyaz zeminde. */
  private drawTabs() {
    const tabs: { tab: Settings['tab']; text: string; color: number }[] = [
      { tab: 'syllable', text: 'Hece Birleştir', color: C.red },
      { tab: 'sort', text: 'Heceleri Bul', color: C.orange },
      { tab: 'sentence', text: 'Cümle Okuyorum', color: C.purple },
    ];
    this.segmented(
      tabs.map((t) => ({ text: t.text, color: t.color, on: this.s.tab === t.tab, tap: () => (this.s.tab = t.tab) })),
      W / 2,
      60,
      340,
      68,
      32,
    );
  }

  /** Sekme çubuğu: seçili sekme beyaz zeminde; dokununca ayar değişir ve ekran yenilenir. */
  private segmented(items: { text: string; color: number; on: boolean; tap: () => void }[], cx: number, cy: number, seg: number, h: number, fontSize: number) {
    const half = (seg * items.length) / 2;
    const track = new Graphics().roundRect(-half, -h / 2, half * 2, h, h / 2).fill(0xeee4cf);
    track.position.set(cx, cy);
    this.body.addChild(track);
    items.forEach((t, i) => {
      const c = new Container();
      if (t.on) {
        c.addChild(
          new Graphics()
            .roundRect(-seg / 2 + 6, -h / 2 + 9, seg - 12, h - 12, (h - 12) / 2)
            .fill({ color: 0x000000, alpha: 0.08 })
            .roundRect(-seg / 2 + 6, -h / 2 + 6, seg - 12, h - 12, (h - 12) / 2)
            .fill(C.white),
        );
      } else {
        c.addChild(new Graphics().rect(-seg / 2, -h / 2, seg, h).fill({ color: 0xffffff, alpha: 0.001 }));
      }
      c.addChild(label(t.text, fontSize, t.on ? t.color : C.muted, { fontWeight: t.on ? '700' : '400' }));
      c.position.set(cx - half + (i + 0.5) * seg, cy);
      this.body.addChild(
        tappable(c, () => {
          if (t.on) return;
          sfx.click();
          this.change(t.tap);
        }),
      );
    });
  }

  // --- Hece Birleştir ---

  private drawSyllableTab() {
    const s = this.s;
    this.drawTableCard();
    const total = parseCustomWords(s.customWords).words.length;
    const words = myWords(s);
    this.drawListCard({
      x: 1270,
      w: 590,
      top: -65,
      count: `${words.length} / ${total} kelime seçili`,
      preview: words.map((w) => w.syllables.join('-')),
      separator: '   ',
      empty: total
        ? `${total} kelime kayıtlı,\nhiçbiri seçili değil.`
        : 'Kendi kelimelerinizi yazın;\nkayıtlı kalır, istediğinizi seçersiniz.',
      button: total ? 'Seç / Düzenle' : 'Kelime Yaz',
      edit: () => this.editWords(),
    });

    this.drawOptions([
      {
        title: 'Fazladan hece',
        value: s.distractors === 0 ? 'Yok' : `${s.distractors} tane`,
        tap: () => (s.distractors = DISTRACTOR_STEPS[(DISTRACTOR_STEPS.indexOf(s.distractors) + 1) % DISTRACTOR_STEPS.length]),
      },
      {
        title: 'Hedef kelime',
        value: s.showWord ? 'Bulutta soluk' : 'Gizli',
        tap: () => (s.showWord = !s.showWord),
      },
      {
        title: 'Hece rengi',
        value: s.oneColor ? 'Tek renk' : 'Renkli',
        tap: () => (s.oneColor = !s.oneColor),
      },
      this.soundOption(),
    ]);

    const n = gamePool(s).length;
    const play = new Button({
      width: 370,
      height: 100,
      color: n > 0 ? C.green : C.line,
      text: 'Oyunu Başlat',
      fontSize: 42,
      icon: playIcon(C.white, 17),
      onTap: () => this.startSyllables(),
    });
    play.position.set(1455, OPTIONS_Y);
    this.drawShare(n > 0, 'Hece Birleştir');
    const info = label(n > 0 ? `Bu seçimle ${n} kelime var` : 'Bu seçimle kelime yok', 26, n > 0 ? C.muted : C.red, {
      fontWeight: '400',
    });
    info.position.set(1565, OPTIONS_Y + 88);
    this.body.addChild(play, info);
  }

  // --- Heceleri Bul ---

  /**
   * Heceleri Bul'un kendi bölümü: aynı kelime kaynakları, ama yalnız iki heceli ve
   * özel isim olmayan kelimeler; büyük harf hiç görünmez.
   */
  private drawSortTab() {
    const s = this.s;
    this.drawTableCard(true);
    const words = myWords(s);
    const fit = twoSyllable(words);
    this.drawListCard({
      x: 1270,
      w: 590,
      top: -65,
      count: `${fit.length} uygun kelime`,
      preview: fit.map((w) => lowerTr(w.syllables.join('-'))),
      separator: '   ',
      empty: words.length
        ? 'Seçili kelimelerden\niki heceli olan yok.'
        : 'Kendi kelimelerinizi yazın;\nyalnız iki heceliler gelir.',
      button: words.length ? 'Seç / Düzenle' : 'Kelime Yaz',
      edit: () => this.editWords(),
    });

    this.drawOptions([
      {
        title: 'Tahta',
        value: `${s.sortSize} × ${s.sortSize}`,
        tap: () => (s.sortSize = SORT_SIZES[(SORT_SIZES.indexOf(s.sortSize) + 1) % SORT_SIZES.length]),
      },
      this.soundOption(),
    ]);

    const n = sortWords(s).length;
    const need = sortWordCount(s.sortSize);
    const play = new Button({
      width: 370,
      height: 100,
      color: n > 0 ? C.green : C.line,
      text: 'Oyunu Başlat',
      fontSize: 42,
      icon: playIcon(C.white, 17),
      onTap: () => this.startSort(),
    });
    play.position.set(1455, OPTIONS_Y);
    this.drawShare(n > 0, 'Heceleri Bul');
    const text =
      n === 0 ? 'Bu seçimle uygun kelime yok' : n < need ? `${n} uygun kelime var, bazıları tekrar eder` : `Bu seçimle ${n} uygun kelime var`;
    const info = label(text, 26, n === 0 ? C.red : n < need ? C.orange : C.muted, { fontWeight: '400' });
    info.position.set(1565, OPTIONS_Y + 88);
    this.body.addChild(play, info);
  }

  // --- Cümle Okuyorum ---

  private drawSentenceTab() {
    const s = this.s;
    // İki kart, başlıksız: solda hazır cümle grupları, sağda öğretmenin cümleleri.
    // Seçili gruplar ve işaretli kendi cümleleri aynı havuzda karışır.
    const ready = sentencesOf(s.sentSets);
    const left = this.drawListCard({
      x: 60,
      w: 885,
      count: s.sentSets.length ? `${s.sentSets.join(' + ')} · ${ready.length} cümle` : '',
      preview: ready,
      separator: '\n',
      scroll: 'ready',
      top: 30,
      empty: 'Bir ya da iki grup seçin.',
    });
    // Grup düğmeleri (ANETİL 40 cümle, OKURIM 48 cümle), birden çok seçilebilir.
    SENTENCE_SETS.forEach((set, i) => {
      const bw = 380;
      const on = s.sentSets.includes(set.name);
      const b = new Button({
        width: bw,
        height: 64,
        radius: 20,
        color: GROUP_COLORS[set.group],
        soft: !on,
        text: `${set.name} · ${set.sentences.length} cümle`,
        fontSize: 30,
        onTap: () => this.toggleSentenceSet(set.name),
      });
      b.position.set(60 + 442.5 + (i - 0.5) * (bw + 24), CARD_Y + 66);
      left.addChild(b);
    });

    const total = parseCustomSentences(s.customSentences).sentences.length;
    const mine = mySentences(s);
    this.drawListCard({
      x: 975,
      w: 885,
      count: `${mine.length} / ${total} cümle seçili`,
      preview: mine,
      separator: '\n',
      scroll: 'mine',
      top: -65,
      empty: total
        ? `${total} cümle kayıtlı, hiçbiri seçili değil.`
        : 'Okutmak istediğiniz cümleleri yazın;\nkayıtlı kalır, istediğinizi seçersiniz.',
      button: total ? 'Seç / Düzenle' : 'Cümle Yaz',
      edit: () => this.editSentences(),
    });

    this.drawOptions([
      {
        title: 'Balık sayısı',
        value: `${s.creatures} tane`,
        tap: () => (s.creatures = CREATURE_STEPS[(CREATURE_STEPS.indexOf(s.creatures) + 1) % CREATURE_STEPS.length]),
      },
      this.soundOption(),
    ]);

    const n = sentencePool(s).length;
    const play = new Button({
      width: 370,
      height: 100,
      color: n > 0 ? C.blue : C.line,
      text: 'Akvaryum',
      fontSize: 42,
      icon: fishIcon(C.white),
      onTap: () => this.startSentences(),
    });
    play.position.set(1455, OPTIONS_Y);
    this.drawShare(n > 0, 'Cümle Okuyorum');
    const info = label(n > 0 ? `Bu seçimle ${n} cümle var` : 'Bu seçimle cümle yok', 26, n > 0 ? C.muted : C.red, {
      fontWeight: '400',
    });
    info.position.set(1565, OPTIONS_Y + 88);
    this.body.addChild(play, info);
  }

  // --- Ortak parçalar ---

  /** Başlıksız kart çerçevesi; içeriğin ekleneceği katmanı döner. */
  private card(x: number, w: number): Container {
    const bg = new Graphics();
    bg.roundRect(x, CARD_Y + 5, w, CARD_H, 32).fill({ color: 0x000000, alpha: 0.05 });
    bg.roundRect(x, CARD_Y, w, CARD_H, 32).fill(C.white).stroke({ width: 3, color: C.line });
    const content = new Container();
    this.body.addChild(bg, content);
    return content;
  }

  /** Harf tabloları. Heceleri Bul'da harfler küçük yazılır ve özel isim satırı yoktur. */
  private drawTableCard(sort = false) {
    const s = this.s;
    const body = this.card(60, 1180);

    CURRICULUM.forEach((group, gi) => {
      const y = CARD_Y + 70 + gi * 80;
      const color = GROUP_COLORS[gi];
      // Grup düğmesi gruptaki tüm tabloları birden seçer (hepsi seçiliyse kaldırır).
      const orders = group.tables.map((t) => t.order);
      const allOn = orders.every((o) => s.tables.includes(o));
      const name = new Button({
        width: 172,
        height: 56,
        radius: 18,
        color,
        outline: !allOn,
        flat: true,
        text: sort ? lowerTr(group.name) : group.name,
        fontSize: 22,
        onTap: () => this.toggleTables(orders),
      });
      name.position.set(100 + 86, y);
      body.addChild(name);

      let x = 296;
      for (const t of group.tables) {
        const w = t.label.length > 2 ? 168 : 76;
        const on = s.tables.includes(t.order);
        const b = new Button({
          width: w,
          height: 56,
          radius: 18,
          color,
          soft: !on,
          text: sort ? lowerTr(t.label) : t.label,
          fontSize: 32,
          onTap: () => this.toggleTables([t.order]),
        });
        b.position.set(x + w / 2, y);
        x += w + 10;
        body.addChild(b);
      }
    });

    const y = CARD_Y + CARD_H - 50;
    if (sort) {
      const note = label('Yalnız iki heceli kelimeler, özel isim yok', 24, C.muted, { fontWeight: '400' });
      note.anchor.set(0, 0.5);
      note.position.set(100, y);
      body.addChild(note);
    } else {
      const proper = checkRow('Özel isimler (Ali, Lale…)', s.proper, 34, 28, false, () =>
        this.change(() => (s.proper = !s.proper)),
      );
      proper.position.set(100, y);
      body.addChild(proper);
    }
    const hint = label(sort ? 'Grup düğmesi hepsini seçer' : 'Birden çok seçilebilir · grup düğmesi hepsini seçer', 22, C.muted, { fontWeight: '400' });
    hint.anchor.set(1, 0.5);
    hint.position.set(1196, y);
    body.addChild(hint);
  }

  /** Liste kartı: sayaç, kısa önizleme ve (varsa) yazma düğmesi. */
  private drawListCard(o: {
    x: number;
    w: number;
    count: string;
    preview: string[];
    separator: string;
    maxLines?: number;
    /** Sayaç ve önizlemenin ne kadar aşağıdan başlayacağı (üstte başka satır varsa). */
    top?: number;
    /** Verilirse önizleme kısaltılmaz: hepsi kaydırılabilir listede (konum bu adla saklanır). */
    scroll?: string;
    empty: string;
    button?: string;
    edit?: () => void;
  }): Container {
    const { x, w } = o;
    const cx = x + w / 2;
    const top = o.top ?? 0;
    const body = this.card(x, w);

    if (o.preview.length) {
      const n = label(o.count, 34, C.ink);
      n.position.set(cx, CARD_Y + 135 + top);
      const key = o.scroll;
      if (key) {
        const y = CARD_Y + 180 + top;
        const bottom = o.button ? CARD_Y + CARD_H - 115 : CARD_Y + CARD_H - 30;
        const list = new ScrollList(o.preview, w - 80, bottom - y, {
          offset: this.scrolled[key],
          onScroll: (v) => (this.scrolled[key] = v),
        });
        list.position.set(x + 40, y);
        body.addChild(n, list);
      } else {
        const preview = label('', 28, C.muted, { fontWeight: '400', lineHeight: 42 });
        preview.text = wrapItems(preview, o.preview, o.separator, w - 90, o.maxLines ?? 5);
        preview.anchor.set(0.5, 0);
        preview.position.set(cx, CARD_Y + 180 + top);
        body.addChild(n, preview);
      }
    } else {
      const hint = label(o.empty, 28, C.muted, { fontWeight: '400', lineHeight: 42 });
      hint.position.set(cx, CARD_Y + 270 + top);
      body.addChild(hint);
    }

    if (!o.button || !o.edit) return body;
    // Kart kapalıyken de soluk görünmesin: yazmak her zaman mümkün.
    const edit = new Button({ width: 280, height: 70, color: C.blue, outline: true, flat: true, text: o.button, fontSize: 32, onTap: o.edit });
    edit.position.set(cx, CARD_Y + CARD_H - 65);
    this.body.addChild(edit);
    return body;
  }

  /** Başlat'ın yanındaki "Adres Ver": bu ayarlarla açılan play.html adresini gösterir. */
  private drawShare(ready: boolean, what: string) {
    const b = new Button({
      width: 200,
      height: 100,
      color: ready ? C.blue : C.line,
      outline: true,
      flat: true,
      text: 'Adres Ver',
      fontSize: 32,
      onTap: () => {
        if (!ready) return sfx.wrong();
        openShareDialog(shareUrl(this.s), `"${what}"`);
      },
    });
    b.position.set(1760, OPTIONS_Y);
    this.body.addChild(b);
  }

  private soundOption(): OptionDef {
    const s = this.s;
    return {
      title: 'Ses',
      value: SOUND_LABELS[s.sound],
      tap: () => (s.sound = SOUND_STEPS[(SOUND_STEPS.indexOf(s.sound) + 1) % SOUND_STEPS.length]),
    };
  }

  private drawOptions(defs: OptionDef[]) {
    defs.forEach((d, i) => {
      const b = new OptionButton(d.title, 230, 90, () => this.change(d.tap));
      b.set(d.value);
      b.position.set(175 + i * 250, OPTIONS_Y);
      this.body.addChild(b);
    });
  }

  private drawVoiceRow() {
    if (this.s.sound !== 'on') return;
    const voices = turkishVoices();
    const voice = currentVoice();
    const name = voice?.name.replace(/^Microsoft\s+/, '').replace(/\s*-\s*Turkish.*$/i, '');
    const text = voice
      ? `Okuyan ses: ${name}   ›  ${voices.length > 1 ? 'değiştir' : 'dinle'}`
      : 'Bu tarayıcıda Türkçe okuma sesi bulunamadı';
    const row = label(text, 26, voice ? C.blue : C.red, { fontWeight: '400' });
    row.anchor.set(0, 0.5);
    row.position.set(66, 935);
    this.body.addChild(row);
    if (voice) tappable(row, () => this.nextVoice());
  }

  /** Tabloları seçer ya da kaldırır: hepsi seçiliyse kaldırır, değilse hepsini seçer (hiçbiri seçili olmayabilir). */
  private toggleTables(orders: number[]) {
    const s = this.s;
    const allOn = orders.every((o) => s.tables.includes(o));
    const rest = s.tables.filter((o) => !orders.includes(o));
    this.change(() => {
      s.tables = allOn ? rest : [...rest, ...orders].sort((a, b) => a - b);
    });
  }

  /** Hazır cümle grubunu seçer ya da kaldırır (hiçbiri seçili olmayabilir). */
  private toggleSentenceSet(name: string) {
    const s = this.s;
    const on = s.sentSets.includes(name);
    this.change(() => {
      s.sentSets = SENTENCE_SETS.map((x) => x.name).filter((n) => (n === name ? !on : s.sentSets.includes(n)));
    });
  }

  private editWords() {
    const s = this.s;
    openListEditor({
      title: 'Benim kelimelerim',
      help: 'Oyunda çıkmasını istediğiniz kelimeleri işaretleyin; seçili tabloların kelimeleriyle karışır. Yeni kelimeleri boşluk, virgül ya da alt satırla ayırın; heceler kendiliğinden ayrılır, isterseniz kendiniz ayırın: kap-lum-ba-ğa',
      placeholder: 'araba elma kalem …',
      items: parseCustomWords(s.customWords).words.map((w) => w.syllables.join('-')),
      off: s.wordsOff,
      key: (item) => lowerTr(item.replace(/-/g, '')),
      parse: (text) => {
        const { words, issues } = parseCustomWords(text);
        return { items: words.map((w) => w.syllables.join('-')), issues: issues.map((i) => `${i.text}: ${i.reason}`) };
      },
      onSave: (items, off) =>
        this.change(() => {
          s.customWords = items.join(' ');
          s.wordsOff = off;
        }),
    });
  }

  private editSentences() {
    const s = this.s;
    openListEditor({
      title: 'Kendi cümlelerim',
      help: 'Oyunda çıkmasını istediğiniz cümleleri işaretleyin. Yeni cümleleri her satıra bir tane yazın; seçili hazır cümlelerle aynı havuza eklenir.',
      placeholder: 'Ali okula koştu.\nKedi süt içti.',
      items: parseCustomSentences(s.customSentences).sentences,
      off: s.sentOff,
      key: lowerTr,
      parse: (text) => {
        const { sentences, issues } = parseCustomSentences(text);
        return { items: sentences, issues: issues.map((i) => `${i.text}: ${i.reason}`) };
      },
      onSave: (items, off) =>
        this.change(() => {
          s.customSentences = items.join('\n');
          s.sentOff = off;
        }),
    });
  }

  private nextVoice() {
    const voices = turkishVoices();
    const next = voices[(voices.indexOf(currentVoice()!) + 1) % voices.length];
    this.change(() => (this.s.voice = next.name));
    speak('araba, kalem, kaplumbağa', 0.8, true);
  }

  private startSyllables() {
    if (gamePool(this.s).length === 0) return sfx.wrong();
    this.game.go((g) => new SkyScene(g));
  }

  private startSort() {
    if (sortWords(this.s).length === 0) return sfx.wrong();
    this.game.go((g) => new SortScene(g));
  }

  private startSentences() {
    if (sentencePool(this.s).length === 0) return sfx.wrong();
    this.game.go((g) => new SentenceScene(g));
  }

  onKey(e: KeyboardEvent) {
    if (e.key !== 'Enter') return;
    if (this.s.tab === 'syllable') this.startSyllables();
    else if (this.s.tab === 'sort') this.startSort();
    else this.startSentences();
  }

  destroy() {
    this.offVoices();
  }
}
