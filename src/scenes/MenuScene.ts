import { Container, Graphics, Text } from 'pixi.js';
import type { Game, Scene } from '../game';
import { CURRICULUM, wordPool } from '../data/curriculum';
import { Button } from '../ui/Button';
import { fullscreenIcon } from '../ui/icons';
import { C, GROUP_COLORS, W, label } from '../theme';
import { SkyScene } from './SkyScene';
import { sfx } from '../audio';

const DISTRACTOR_STEPS = [0, 2, 4];

/** İki satırlı ayar butonu: üstte başlık, altta değer. */
class OptionButton extends Container {
  private bg = new Graphics();
  private value: Text;

  constructor(title: string, private w: number, private h: number, onTap: () => void) {
    super();
    const t = label(title, 30, C.muted, { fontWeight: '400' });
    t.y = -24;
    this.value = label('', 42, C.ink);
    this.value.y = 22;
    this.addChild(this.bg, t, this.value);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointertap', () => {
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

export class MenuScene implements Scene {
  view = new Container();
  private groupLayer = new Container();
  private tableLayer = new Container();
  private info: Text;
  private options: { btn: OptionButton; refresh: () => void }[] = [];

  constructor(private game: Game) {
    const title = label('Hece Birleştir', 110, C.red, { fontWeight: '700' });
    title.position.set(W / 2, 95);
    const sub = label('Öğretmen ayarları', 40, C.muted, { fontWeight: '400' });
    sub.position.set(W / 2, 180);

    const fs = new Button({ width: 110, height: 100, color: C.ink, outline: true, icon: fullscreenIcon(C.ink), onTap: () => game.toggleFullscreen() });
    fs.position.set(W - 85, 70);

    this.info = label('', 34, C.muted, { fontWeight: '400' });
    this.info.position.set(W / 2, 600);

    this.view.addChild(title, sub, fs, this.groupLayer, this.tableLayer, this.info);
    this.buildOptions();
    this.buildStartButtons();
    this.refresh();
  }

  private get table() {
    const all = CURRICULUM.flatMap((g) => g.tables);
    return all[Math.min(this.game.settings.table, all.length - 1)];
  }

  private refresh() {
    this.drawGroups();
    this.drawTables();
    this.options.forEach((o) => o.refresh());
    const n = wordPool(this.table, this.game.settings).length;
    this.info.text = `Bu seçimle ${n} kelime var`;
  }

  private drawGroups() {
    this.groupLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    const w = 330;
    const gap = 26;
    const x0 = W / 2 - (CURRICULUM.length * w + (CURRICULUM.length - 1) * gap) / 2 + w / 2;
    CURRICULUM.forEach((group, gi) => {
      const selected = this.table.groupIndex === gi;
      const color = GROUP_COLORS[gi];
      const letters = group.tables.map((t) => t.label).join(' ');
      const b = new Button({
        width: w,
        height: 180,
        color,
        outline: !selected,
        text: '',
        onTap: () => {
          this.game.settings.table = group.tables[0].order;
          this.game.save();
          this.refresh();
        },
      });
      const name = label(group.name, 36, selected ? C.white : color, { fontWeight: '400' });
      name.y = -40;
      const ls = label(letters, letters.length > 11 ? 44 : 52, selected ? C.white : color);
      ls.y = 25;
      b.addChild(name, ls);
      b.position.set(x0 + gi * (w + gap), 330);
      this.groupLayer.addChild(b);
    });
  }

  private drawTables() {
    this.tableLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    const group = CURRICULUM[this.table.groupIndex];
    const color = GROUP_COLORS[this.table.groupIndex];
    const caption = label('Harf tablosu:', 38, C.muted, { fontWeight: '400' });
    caption.anchor.set(1, 0.5);

    const sizes = group.tables.map((t) => (t.label.length > 2 ? 280 : 140));
    const gap = 22;
    const total = sizes.reduce((a, b) => a + b, 0) + gap * (sizes.length - 1);
    let x = W / 2 - total / 2 + 110;
    caption.position.set(x - 30, 490);
    this.tableLayer.addChild(caption);

    group.tables.forEach((t, i) => {
      const selected = t.order === this.table.order;
      const b = new Button({
        width: sizes[i],
        height: 120,
        color,
        outline: !selected,
        text: t.label,
        fontSize: 60,
        onTap: () => {
          this.game.settings.table = t.order;
          this.game.save();
          this.refresh();
        },
      });
      b.position.set(x + sizes[i] / 2, 490);
      x += sizes[i] + gap;
      this.tableLayer.addChild(b);
    });
  }

  private buildOptions() {
    const s = this.game.settings;
    const defs: { title: string; value: () => [string, boolean]; tap: () => void }[] = [
      {
        title: 'Önceki tablolar',
        value: () => [s.cumulative ? 'Dahil' : 'Yalnız bu tablo', s.cumulative],
        tap: () => (s.cumulative = !s.cumulative),
      },
      {
        title: 'Özel isimler',
        value: () => [s.proper ? 'Dahil' : 'Hariç', s.proper],
        tap: () => (s.proper = !s.proper),
      },
      {
        title: 'Fazladan hece',
        value: () => [s.distractors === 0 ? 'Yok' : `${s.distractors} tane`, s.distractors > 0],
        tap: () => {
          const i = DISTRACTOR_STEPS.indexOf(s.distractors);
          s.distractors = DISTRACTOR_STEPS[(i + 1) % DISTRACTOR_STEPS.length];
        },
      },
      {
        title: 'Hedef kelime',
        value: () => [s.showWord ? 'Bulutta soluk' : 'Gizli (dinle)', s.showWord],
        tap: () => (s.showWord = !s.showWord),
      },
    ];
    const w = 400;
    const gap = 30;
    const x0 = W / 2 - (defs.length * w + (defs.length - 1) * gap) / 2 + w / 2;
    defs.forEach((d, i) => {
      const btn = new OptionButton(d.title, w, 120, () => {
        d.tap();
        this.game.save();
        this.refresh();
      });
      btn.position.set(x0 + i * (w + gap), 730);
      this.view.addChild(btn);
      this.options.push({ btn, refresh: () => btn.set(...d.value()) });
    });
  }

  private buildStartButtons() {
    const play = new Button({
      width: 620,
      height: 150,
      color: C.green,
      text: 'Oyunu Başlat',
      fontSize: 66,
      onTap: () => this.start(),
    });
    play.position.set(W / 2, 925);
    const hint = label('Oyundayken ayarlara dönmek için sağ üstteki çarka basılı tutun (ya da Esc).', 30, C.muted, {
      fontWeight: '400',
    });
    hint.position.set(W / 2, 1035);
    this.view.addChild(play, hint);
  }

  private start() {
    this.game.go((g) => new SkyScene(g));
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'Enter') this.start();
  }

  destroy() {}
}
