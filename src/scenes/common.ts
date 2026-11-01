import { ALL_TABLES, wordPool, type Table, type Word } from '../data/curriculum';
import { parseCustomWords } from '../data/custom';
import { lowerTr } from '../data/syllabify';
import type { Settings } from '../settings';

export function currentTable(s: Settings): Table {
  return ALL_TABLES[Math.min(s.table, ALL_TABLES.length - 1)];
}

/** Bu tabloya kadar okunabilen tüm heceler (çeldirici kaynağı). */
export function syllableBank(t: Table): string[] {
  const set = new Set<string>();
  for (const w of wordPool(t, { cumulative: true, proper: false })) {
    w.syllables.forEach((s) => set.add(lowerTr(s)));
  }
  return [...set];
}

const mine = (s: Settings) => (s.useMine ? parseCustomWords(s.customWords).words : []);

/** Ayarlara göre oyunda sorulacak kelimeler: tablo kelimeleri ve/veya öğretmenin kelimeleri. */
export function gamePool(s: Settings): Word[] {
  const seen = new Set<string>();
  const out: Word[] = [];
  const table = s.useTable ? wordPool(currentTable(s), s) : [];
  for (const w of [...table, ...mine(s)]) {
    const key = lowerTr(w.text);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(w);
  }
  return out;
}

/** Çeldirici heceler: yalnız öğretmenin kelimeleri seçiliyse onların heceleri. */
export function gameBank(s: Settings): string[] {
  const set = new Set(s.useTable ? syllableBank(currentTable(s)) : []);
  for (const w of mine(s)) w.syllables.forEach((x) => set.add(lowerTr(x)));
  return [...set];
}

export function capitalizeTr(s: string) {
  return s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);
}
