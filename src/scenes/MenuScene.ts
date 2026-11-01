import { Container, Graphics, Text } from 'pixi.js';
import type { Game, Scene } from '../game';
import { CURRICULUM } from '../data/curriculum';
import { parseCustomWords } from '../data/custom';
import { SENTENCE_SETS, SENTENCES, parseCustomSentences } from '../data/sentences';
import { Button } from '../ui/Button';
import { fishIcon, fullscreenIcon, playIcon } from '../ui/icons';
import { openTextEditor } from '../ui/TextEditor';
import { C, GROUP_COLORS, W, label, mix } from '../theme';
import { currentVoice, onVoicesChanged, sfx, speak, turkishVoices, type SoundMode } from '../audio';
import type { Settings } from '../settings';
import { gamePool, sentencePool } from './common';
import { SentenceScene } from './SentenceScene';
import { SkyScene } from './SkyScene';

const DISTRACTOR_STEPS = [0, 2, 4];
const SOUND_STEPS: SoundMode[] = ['on', 'effects', 'off'];
const SOUND_LABELS: Record<SoundMode, string> = { on: 'Açık', effects: 'Okuma kapalı', off: 'Sessiz' };
const CREATURE_STEPS = [4, 6, 8];

/** Kelime/cümle kaynakları; her bölümde iki kaynaktan en az biri açık kalır. */
type Source = 'useTable' | 'useMine' | 'sentBuiltIn' | 'sentMine';
const PARTNER: Record<Source, Source> = { useTable: 'useMine', useMine: 'useTable', sentBuiltIn: 'sentMine', sentMine: 'sentBuiltIn' };

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
      { tab: 'sentence', text: 'Cümle Okuyorum', color: C.purple },
    ];
    const seg = 320;
    const h = 68;
    const track = new Graphics().roundRect(-seg, -h / 2, seg * 2, h, h / 2).fill(0xeee4cf);
    track.position.set(W / 2, 60);
    this.body.addChild(track);
    tabs.forEach((t, i) => {
      const on = this.s.tab === t.tab;
      const c = new Container();
      if (on) {
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
      c.addChild(label(t.text, 32, on ? t.color : C.muted, { fontWeight: on ? '700' : '400' }));
      c.position.set(W / 2 + (i - 0.5) * seg, 60);
      this.body.addChild(
        tappable(c, () => {
          if (on) return;
          sfx.click();
          this.change(() => (this.s.tab = t.tab));
        }),
      );
    });
  }

  // --- Hece Birleştir ---

  private drawSyllableTab() {
    const s = this.s;
    this.drawTableCard();
    const { words } = parseCustomWords(s.customWords);
    this.drawListCard({
      x: 1270,
      w: 590,
      title: 'Benim kelimelerim',
      source: 'useMine',
      count: `${words.length} kelime`,
      preview: words.map((w) => w.syllables.join('-')),
      separator: '   ',
      empty: 'Kendi kelimelerinizi yazın;\nhecelere kendiliğinden ayrılır.',
      button: words.length ? 'Düzenle' : 'Kelime Yaz',
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
      width: 440,
      height: 100,
      color: n > 0 ? C.green : C.line,
      text: 'Oyunu Başlat',
      fontSize: 46,
      icon: playIcon(C.white, 18),
      onTap: () => this.startSyllables(),
    });
    play.position.set(1565, OPTIONS_Y);
    const info = label(n > 0 ? `Bu seçimle ${n} kelime var` : 'Bu seçimle kelime yok', 26, n > 0 ? C.muted : C.red, {
      fontWeight: '400',
    });
    info.position.set(1565, OPTIONS_Y + 88);
    this.body.addChild(play, info);
  }

  // --- Cümle Okuyorum ---

  private drawSentenceTab() {
    const s = this.s;
    // İki eşit kart: hazır fiş cümleleri ve öğretmenin cümleleri (ikisi açıksa tek havuz).
    const short = (x: string) => (x.length > 44 ? x.slice(0, 43) + '…' : x);
    this.drawListCard({
      x: 60,
      w: 885,
      title: 'Hazır cümleler',
      source: 'sentBuiltIn',
      count: `${SENTENCE_SETS.map((x) => x.name).join(', ')} fişi · ${SENTENCES.length} cümle`,
      preview: SENTENCES.map(short),
      separator: '\n',
      maxLines: 9,
      empty: '',
    });
    const { sentences } = parseCustomSentences(s.customSentences);
    this.drawListCard({
      x: 975,
      w: 885,
      title: 'Benim cümlelerim',
      source: 'sentMine',
      count: `${sentences.length} cümle`,
      preview: sentences.map(short),
      separator: '\n',
      maxLines: 7,
      empty: 'Okutmak istediğiniz cümleleri yazın;\nhazır cümlelerle aynı havuza eklenir.',
      button: sentences.length ? 'Düzenle' : 'Cümle Yaz',
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
      width: 440,
      height: 100,
      color: n > 0 ? C.blue : C.line,
      text: 'Akvaryum',
      fontSize: 46,
      icon: fishIcon(C.white),
      onTap: () => this.startSentences(),
    });
    play.position.set(1565, OPTIONS_Y);
    const info = label(n > 0 ? `Bu seçimle ${n} cümle var` : 'Bu seçimle cümle yok', 26, n > 0 ? C.muted : C.red, {
      fontWeight: '400',
    });
    info.position.set(1565, OPTIONS_Y + 88);
    this.body.addChild(play, info);
  }

  // --- Ortak parçalar ---

  /** Kart çerçevesi ve başlıktaki onay kutusu; içeriğin ekleneceği katmanı döner. */
  private card(x: number, w: number, on: boolean, title: string, toggle: () => void): Container {
    const bg = new Graphics();
    bg.roundRect(x, CARD_Y + 5, w, CARD_H, 32).fill({ color: 0x000000, alpha: 0.05 });
    bg.roundRect(x, CARD_Y, w, CARD_H, 32).fill(C.white).stroke({ width: 3, color: C.line });
    const head = checkRow(title, on, 44, 36, true, toggle);
    head.position.set(x + 40, CARD_Y + 54);
    const content = new Container();
    content.alpha = on ? 1 : 0.4;
    this.body.addChild(bg, head, content);
    return content;
  }

  /** Harf tabloları (Hece Birleştir kelimeleri). */
  private drawTableCard() {
    const s = this.s;
    const body = this.card(60, 1180, s.useTable, 'Harf tablosu kelimeleri', () => this.toggleSource('useTable'));

    CURRICULUM.forEach((group, gi) => {
      const y = CARD_Y + 135 + gi * 74;
      const color = GROUP_COLORS[gi];
      // Grup adına dokunmak gruptaki tüm tabloları seçer (hepsi seçiliyse kaldırır).
      const name = label(group.name, 25, mix(color, C.muted, 0.5), { fontWeight: '400' });
      name.anchor.set(0, 0.5);
      name.position.set(100, y);
      body.addChild(
        tappable(name, () => {
          sfx.click();
          this.toggleTables(group.tables.map((t) => t.order));
        }),
      );

      let x = 290;
      for (const t of group.tables) {
        const w = t.label.length > 2 ? 168 : 76;
        const on = s.tables.includes(t.order);
        const b = new Button({
          width: w,
          height: 56,
          radius: 18,
          color,
          soft: !on,
          text: t.label,
          fontSize: 32,
          onTap: () => this.toggleTables([t.order]),
        });
        b.position.set(x + w / 2, y);
        x += w + 10;
        body.addChild(b);
      }
    });

    const y = CARD_Y + CARD_H - 50;
    const proper = checkRow('Özel isimler (Ali, Lale…)', s.proper, 34, 28, false, () =>
      this.change(() => (s.proper = !s.proper)),
    );
    proper.position.set(100, y);
    body.addChild(proper);
    const hint = label('Birden çok seçilebilir · grup adı hepsini seçer', 22, C.muted, { fontWeight: '400' });
    hint.anchor.set(1, 0.5);
    hint.position.set(1196, y);
    body.addChild(hint);
  }

  /** Liste kartı: sayaç, kısa önizleme ve (varsa) yazma düğmesi. */
  private drawListCard(o: {
    x: number;
    w: number;
    title: string;
    source: Source;
    count: string;
    preview: string[];
    separator: string;
    maxLines?: number;
    empty: string;
    button?: string;
    edit?: () => void;
  }) {
    const { x, w } = o;
    const cx = x + w / 2;
    const body = this.card(x, w, this.s[o.source], o.title, () => this.toggleSource(o.source));

    if (o.preview.length) {
      const n = label(o.count, 34, C.ink);
      n.position.set(cx, CARD_Y + 135);
      const preview = label('', 28, C.muted, { fontWeight: '400', lineHeight: 42 });
      preview.text = wrapItems(preview, o.preview, o.separator, w - 90, o.maxLines ?? 5);
      preview.anchor.set(0.5, 0);
      preview.position.set(cx, CARD_Y + 180);
      body.addChild(n, preview);
    } else {
      const hint = label(o.empty, 28, C.muted, { fontWeight: '400', lineHeight: 42 });
      hint.position.set(cx, CARD_Y + 270);
      body.addChild(hint);
    }

    if (!o.button || !o.edit) return;
    // Kart kapalıyken de soluk görünmesin: yazmak her zaman mümkün.
    const edit = new Button({ width: 280, height: 70, color: C.blue, outline: true, flat: true, text: o.button, fontSize: 32, onTap: o.edit });
    edit.position.set(cx, CARD_Y + CARD_H - 65);
    this.body.addChild(edit);
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

  /**
   * Tabloları seçer ya da kaldırır: hepsi seçiliyse kaldırır, değilse hepsini
   * seçer. Tablo kartı kapalıysa açar; son seçili tablo kaldırılamaz.
   */
  private toggleTables(orders: number[]) {
    const s = this.s;
    const allOn = s.useTable && orders.every((o) => s.tables.includes(o));
    const rest = s.tables.filter((o) => !orders.includes(o));
    if (allOn && rest.length === 0) return sfx.wrong();
    this.change(() => {
      s.tables = allOn ? rest : [...rest, ...orders].sort((a, b) => a - b);
      s.useTable = true;
    });
  }

  /** Kaynağı açar/kapar; bir bölümün iki kaynağı birden kapanamaz. */
  private toggleSource(which: Source) {
    const s = this.s;
    if (which === 'useMine' && !s.useMine && parseCustomWords(s.customWords).words.length === 0) return this.editWords();
    if (which === 'sentMine' && !s.sentMine && parseCustomSentences(s.customSentences).sentences.length === 0) {
      return this.editSentences();
    }
    if (s[which] && !s[PARTNER[which]]) return sfx.wrong();
    this.change(() => (s[which] = !s[which]));
  }

  /** Yazılanlar kaydedilince: bir şey varsa o kaynağı aç, yoksa kapatıp diğerini aç. */
  private saved(source: 'useMine' | 'sentMine', hasItems: boolean) {
    const s = this.s;
    s[source] = hasItems;
    if (!hasItems) s[PARTNER[source]] = true;
  }

  private editWords() {
    openTextEditor({
      title: 'Benim kelimelerim',
      help: 'Kelimeleri boşluk, virgül ya da alt satırla ayırın. Heceler kendiliğinden ayrılır; isterseniz kendiniz ayırın: kap-lum-ba-ğa',
      placeholder: 'araba elma kalem …',
      initial: this.s.customWords,
      check: (text) => {
        const { words, issues } = parseCustomWords(text);
        return {
          ok: words.map((w) => w.syllables.join('-')),
          bad: issues.map((i) => `${i.text} (${i.reason})`),
          count:
            (words.length ? `${words.length} kelime hazır` : 'Henüz kelime yok') +
            (issues.length ? ` · ${issues.length} tanesi alınmayacak` : ''),
        };
      },
      onSave: (text) =>
        this.change(() => {
          this.s.customWords = text;
          this.saved('useMine', parseCustomWords(text).words.length > 0);
        }),
    });
  }

  private editSentences() {
    openTextEditor({
      title: 'Benim cümlelerim',
      help: 'Her satıra bir cümle yazın. Hazır cümleler de açıksa aynı havuza eklenir;\nçocuk her balığa dokunduğunda havuzdan yeni bir cümle çıkar.',
      placeholder: 'Ali okula koştu.\nKedi süt içti.',
      initial: this.s.customSentences,
      check: (text) => {
        const { sentences, issues } = parseCustomSentences(text);
        return {
          ok: sentences,
          bad: issues.map((i) => `${i.text} (${i.reason})`),
          count:
            (sentences.length ? `${sentences.length} cümle hazır` : 'Henüz cümle yok') +
            (issues.length ? ` · ${issues.length} tanesi alınmayacak` : ''),
        };
      },
      onSave: (text) =>
        this.change(() => {
          this.s.customSentences = text;
          this.saved('sentMine', parseCustomSentences(text).sentences.length > 0);
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

  private startSentences() {
    if (sentencePool(this.s).length === 0) return sfx.wrong();
    this.game.go((g) => new SentenceScene(g));
  }

  onKey(e: KeyboardEvent) {
    if (e.key !== 'Enter') return;
    if (this.s.tab === 'syllable') this.startSyllables();
    else this.startSentences();
  }

  destroy() {
    this.offVoices();
  }
}
