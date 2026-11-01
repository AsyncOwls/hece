import { Container, Graphics } from 'pixi.js';
import { Button } from '../ui/Button';
import { starIcon } from '../ui/icons';
import { C, H, W, label } from '../theme';
import { easeOutBack, tween } from '../tween';
import { ALL_TABLES, CURRICULUM, wordPool, type Table } from '../data/curriculum';
import { lowerTr } from '../data/syllabify';
import type { Game } from '../game';

export function currentTable(game: Game): Table {
  return ALL_TABLES[Math.min(game.settings.table, ALL_TABLES.length - 1)];
}

export function tableTitle(t: Table) {
  return `${CURRICULUM[t.groupIndex].name} · ${t.label} tablosu`;
}

/** Bu tabloya kadar okunabilen tüm heceler (çeldirici kaynağı). */
export function syllableBank(t: Table): string[] {
  const set = new Set<string>();
  for (const w of wordPool(t, { cumulative: true, proper: false })) {
    w.syllables.forEach((s) => set.add(lowerTr(s)));
  }
  return [...set];
}

export function capitalizeTr(s: string) {
  return s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);
}

/** Tur sonu paneli. */
export function showEndPanel(
  parent: Container,
  title: string,
  subtitle: string,
  buttons: { text: string; color: number; onTap: () => void }[],
) {
  const layer = new Container();
  const dim = new Graphics().rect(0, 0, W, H).fill({ color: 0x1f2a44, alpha: 0.45 });
  dim.eventMode = 'static';
  layer.addChild(dim);

  const panel = new Container();
  panel.position.set(W / 2, H / 2);
  const pw = 1000;
  const ph = 620;
  panel.addChild(
    new Graphics()
      .roundRect(-pw / 2, -ph / 2 + 10, pw, ph, 48)
      .fill({ color: 0x000000, alpha: 0.2 })
      .roundRect(-pw / 2, -ph / 2, pw, ph, 48)
      .fill(C.white)
      .stroke({ width: 6, color: C.yellow }),
  );
  for (let i = 0; i < 3; i++) {
    const s = starIcon(C.yellow, i === 1 ? 70 : 52);
    s.position.set((i - 1) * 150, -190 + (i === 1 ? -15 : 0));
    panel.addChild(s);
  }
  const t = label(title, 96, C.red);
  t.y = -40;
  const st = label(subtitle, 46, C.ink, { fontWeight: '400' });
  st.y = 60;
  panel.addChild(t, st);

  const bw = 400;
  buttons.forEach((b, i) => {
    const btn = new Button({ width: bw, height: 130, color: b.color, text: b.text, fontSize: 56, onTap: b.onTap });
    btn.position.set((i - (buttons.length - 1) / 2) * (bw + 40), 200);
    panel.addChild(btn);
  });

  layer.addChild(panel);
  parent.addChild(layer);
  panel.scale.set(0.6);
  layer.alpha = 0;
  void tween(layer, { alpha: 1 }, 200);
  void tween(panel, { scale: 1 }, 450, easeOutBack);
}
