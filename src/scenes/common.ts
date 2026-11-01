import { ALL_TABLES, wordPool, type Table } from '../data/curriculum';
import { lowerTr } from '../data/syllabify';
import type { Game } from '../game';

export function currentTable(game: Game): Table {
  return ALL_TABLES[Math.min(game.settings.table, ALL_TABLES.length - 1)];
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
