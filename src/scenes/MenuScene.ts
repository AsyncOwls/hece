import { Container, Graphics, Text } from 'pixi.js';
import type { Game, Scene } from '../game';
import { CURRICULUM } from '../data/curriculum';
import { parseCustomWords } from '../data/custom';
import { Button } from '../ui/Button';
import { fullscreenIcon } from '../ui/icons';
import { openWordEditor } from '../ui/WordEditor';
import { C, GROUP_COLORS, W, label } from '../theme';
import { currentVoice, onVoicesChanged, sfx, speak, turkishVoices, type SoundMode } from '../audio';
import { gamePool } from './common';
import { SkyScene } from './SkyScene';

const DISTRACTOR_STEPS = [0, 2, 4];
const SOUND_STEPS: SoundMode[] = ['on', 'effects', 'off'];
const SOUND_LABELS: Record<SoundMode, string> = { on: 'Açık', effects: 'Okuma kapalı', off: 'Sessiz' };

const CARD_Y = 140;
const CARD_H = 650;
const OPTIONS_Y = 885;

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

/** İki satırlı ayar butonu: üstte başlık, altta değer. */
class OptionButton extends Container {
  private bg = new Graphics();
  private value: Text;

  constructor(title: string, private w: number, private h: number, onTap: () => void) {
    super();
    const t = label(title, 30, C.muted, { fontWeight: '400' });
    t.y = -24;
    this.value = label('', 38, C.ink);
    this.value.y = 22;
    this.addChild(this.bg, t, this.value);
    tappable(this, () => {
      sfx.click();
      onTap();
    });
  }

  set(value: string, on: boolean) {
    this.value.text = value;
    this.value.style.fill = on ? C.green : C.ink;
    const { w, h } = this;
    this.bg.clear();
    this.bg.roundRect(-w / 2, -h / 2 + 6, w, h, 24).fill({ color: 0x000000, alpha: 0.1 });
    this.bg.roundRect(-w / 2, -h / 2, w, h, 24).fill(C.white).stroke({ width: 4, color: on ? C.green : C.line });
  }
}

/**
 * Öğretmen ekranı. Solda harf tablosu kelimeleri, sağda öğretmenin kendi
 * kelimeleri; ikisi ayrı ayrı açılıp kapanır (ikisi açıksa kelimeler karışır).
 */
export class MenuScene implements Scene {
  view = new Container();
  private body = new Container();
  private offVoices: () => void;

  constructor(private game: Game) {
    const title = label('Hece Birleştir', 76, C.red);
    title.position.set(W / 2, 70);
    const fs = new Button({ width: 110, height: 100, color: C.ink, outline: true, icon: fullscreenIcon(C.ink), onTap: () => game.toggleFullscreen() });
    fs.position.set(W - 85, 70);
    this.view.addChild(title, fs, this.body);
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
    this.drawTableCard();
    this.drawMineCard();
    this.drawOptions();
    this.drawStart();
  }

  /** Kart çerçevesi ve başlıktaki onay kutusu; içeriğin ekleneceği katmanı döner. */
  private card(x: number, w: number, on: boolean, title: string, toggle: () => void): Container {
    const bg = new Graphics();
    bg.roundRect(x, CARD_Y + 6, w, CARD_H, 32).fill({ color: 0x000000, alpha: 0.08 });
    bg.roundRect(x, CARD_Y, w, CARD_H, 32).fill(C.white).stroke({ width: 5, color: on ? C.green : C.line });
    const head = checkRow(title, on, 54, 42, true, toggle);
    head.position.set(x + 44, CARD_Y + 62);
    const content = new Container();
    content.alpha = on ? 1 : 0.4;
    this.body.addChild(bg, head, content);
    return content;
  }

  private drawTableCard() {
    const s = this.s;
    const body = this.card(60, 1180, s.useTable, 'Harf tablosu kelimeleri', () => this.toggleSource('useTable'));

    CURRICULUM.forEach((group, gi) => {
      const y = CARD_Y + 150 + gi * 86;
      const color = GROUP_COLORS[gi];
      // Grup adına dokunmak gruptaki tüm tabloları seçer (hepsi seçiliyse kaldırır).
      const name = label(group.name, 30, color, { fontWeight: '400' });
      name.anchor.set(0, 0.5);
      name.position.set(104, y);
      body.addChild(
        tappable(name, () => {
          sfx.click();
          this.toggleTables(group.tables.map((t) => t.order));
        }),
      );

      let x = 330;
      for (const t of group.tables) {
        const w = t.label.length > 2 ? 220 : 100;
        const b = new Button({
          width: w,
          height: 70,
          color,
          outline: !s.tables.includes(t.order),
          text: t.label,
          fontSize: 42,
          onTap: () => this.toggleTables([t.order]),
        });
        b.position.set(x + w / 2, y);
        x += w + 14;
        body.addChild(b);
      }
    });

    const y = CARD_Y + CARD_H - 58;
    const proper = checkRow('Özel isimler (Ali, Lale…)', s.proper, 40, 32, false, () =>
      this.change(() => (s.proper = !s.proper)),
    );
    proper.position.set(104, y);
    const hint = label('Birden çok tablo seçilebilir.\nGrup adı, gruptakilerin hepsini seçer.', 26, C.muted, {
      fontWeight: '400',
      align: 'right',
    });
    hint.anchor.set(1, 0.5);
    hint.position.set(1196, y);
    body.addChild(proper, hint);
  }

  private drawMineCard() {
    const s = this.s;
    const { words } = parseCustomWords(s.customWords);
    const x = 1270;
    const w = 590;
    const cx = x + w / 2;
    const body = this.card(x, w, s.useMine, 'Benim kelimelerim', () => this.toggleSource('useMine'));

    if (words.length) {
      const n = label(`${words.length} kelime`, 40, C.ink);
      n.position.set(cx, CARD_Y + 150);
      let list = '';
      for (const word of words) {
        const part = word.syllables.join('-');
        if (list.length + part.length > 150) {
          list += '  …';
          break;
        }
        list += (list ? '   ' : '') + part;
      }
      const preview = label(list, 32, C.muted, { fontWeight: '400', wordWrap: true, wordWrapWidth: w - 90, lineHeight: 48 });
      preview.anchor.set(0.5, 0);
      preview.position.set(cx, CARD_Y + 200);
      body.addChild(n, preview);
    } else {
      const hint = label('Kendi kelimelerinizi yazın;\nhecelere kendiliğinden ayrılır.', 32, C.muted, {
        fontWeight: '400',
        lineHeight: 48,
      });
      hint.position.set(cx, CARD_Y + 300);
      body.addChild(hint);
    }

    // Kart kapalıyken de soluk görünmesin: kelime yazmak her zaman mümkün.
    const edit = new Button({
      width: 420,
      height: 96,
      color: C.blue,
      text: words.length ? 'Düzenle' : 'Kelime Yaz',
      fontSize: 44,
      onTap: () => this.editWords(),
    });
    edit.position.set(cx, CARD_Y + CARD_H - 75);
    this.body.addChild(edit);
  }

  private drawOptions() {
    const s = this.s;
    const defs: { title: string; value: [string, boolean]; tap: () => void }[] = [
      {
        title: 'Fazladan hece',
        value: [s.distractors === 0 ? 'Yok' : `${s.distractors} tane`, s.distractors > 0],
        tap: () => {
          const i = DISTRACTOR_STEPS.indexOf(s.distractors);
          s.distractors = DISTRACTOR_STEPS[(i + 1) % DISTRACTOR_STEPS.length];
        },
      },
      {
        title: 'Hedef kelime',
        value: [s.showWord ? 'Bulutta soluk' : 'Gizli', s.showWord],
        tap: () => (s.showWord = !s.showWord),
      },
      {
        title: 'Hece rengi',
        value: [s.oneColor ? 'Tek renk' : 'Renkli', !s.oneColor],
        tap: () => (s.oneColor = !s.oneColor),
      },
      {
        title: 'Ses',
        value: [SOUND_LABELS[s.sound], s.sound === 'on'],
        tap: () => (s.sound = SOUND_STEPS[(SOUND_STEPS.indexOf(s.sound) + 1) % SOUND_STEPS.length]),
      },
    ];
    defs.forEach((d, i) => {
      const b = new OptionButton(d.title, 282, 120, () => this.change(d.tap));
      b.set(...d.value);
      b.position.set(201 + i * 300, OPTIONS_Y);
      this.body.addChild(b);
    });

    if (s.sound !== 'on') return;
    const voices = turkishVoices();
    const voice = currentVoice();
    const name = voice?.name.replace(/^Microsoft\s+/, '').replace(/\s*-\s*Turkish.*$/i, '');
    const text = voice
      ? `Okuyan ses: ${name}   ›  ${voices.length > 1 ? 'değiştir' : 'dinle'}`
      : 'Bu tarayıcıda Türkçe okuma sesi bulunamadı';
    const row = label(text, 28, voice ? C.blue : C.red, { fontWeight: '400' });
    row.anchor.set(0, 0.5);
    row.position.set(66, 1005);
    this.body.addChild(row);
    if (voice) tappable(row, () => this.nextVoice());
  }

  private drawStart() {
    const n = gamePool(this.s).length;
    const play = new Button({
      width: 600,
      height: 140,
      color: n > 0 ? C.green : C.line,
      text: 'Oyunu Başlat',
      fontSize: 62,
      onTap: () => this.start(),
    });
    play.position.set(1560, OPTIONS_Y);
    const info = label(n > 0 ? `Bu seçimle ${n} kelime var` : 'Bu seçimle kelime yok', 30, n > 0 ? C.muted : C.red, {
      fontWeight: '400',
    });
    info.position.set(1560, 1000);
    const hint = label('Oyundan çıkmak için sağ üstteki çarka basılı tutun.', 24, C.muted, { fontWeight: '400' });
    hint.position.set(1560, 1042);
    this.body.addChild(play, info, hint);
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

  /** Kaynağı açar/kapar; ikisi birden kapanamaz. */
  private toggleSource(which: 'useTable' | 'useMine') {
    const s = this.s;
    const other = which === 'useTable' ? 'useMine' : 'useTable';
    if (which === 'useMine' && !s.useMine && parseCustomWords(s.customWords).words.length === 0) {
      return this.editWords();
    }
    if (s[which] && !s[other]) return sfx.wrong();
    this.change(() => (s[which] = !s[which]));
  }

  private editWords() {
    openWordEditor(this.s.customWords, (text) =>
      this.change(() => {
        const s = this.s;
        s.customWords = text;
        if (parseCustomWords(text).words.length > 0) s.useMine = true;
        else {
          s.useMine = false;
          s.useTable = true;
        }
      }),
    );
  }

  private nextVoice() {
    const voices = turkishVoices();
    const next = voices[(voices.indexOf(currentVoice()!) + 1) % voices.length];
    this.change(() => (this.s.voice = next.name));
    speak('araba, kalem, kaplumbağa', 0.8, true);
  }

  private start() {
    if (gamePool(this.s).length === 0) return sfx.wrong();
    this.game.go((g) => new SkyScene(g));
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'Enter') this.start();
  }

  destroy() {
    this.offVoices();
  }
}
