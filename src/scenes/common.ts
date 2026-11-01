import { ALL_TABLES, wordPool, type Table, type Word } from '../data/curriculum';
import { parseCustomWords } from '../data/custom';
import { SENTENCES, parseCustomSentences } from '../data/sentences';
import { lowerTr } from '../data/syllabify';
import type { Settings } from '../settings';

/** Seçili tablolar, müfredat sırasıyla. */
export function selectedTables(s: Settings): Table[] {
  return ALL_TABLES.filter((t) => s.tables.includes(t.order));
}

/** Bu tabloya kadar okunabilen tüm heceler (çeldirici kaynağı). */
export function syllableBank(t: Table): string[] {
  const set = new Set<string>();
  for (const w of wordPool(t, { cumulative: true, proper: false })) {
    w.syllables.forEach((s) => set.add(lowerTr(s)));
  }
  return [...set];
}

/** Öğretmenin kayıtlı kelimelerinden seçili olanlar. */
export function myWords(s: Settings): Word[] {
  return parseCustomWords(s.customWords).words.filter((w) => !s.wordsOff.includes(lowerTr(w.text)));
}

/** Öğretmenin kayıtlı cümlelerinden seçili olanlar. */
export function mySentences(s: Settings): string[] {
  return parseCustomSentences(s.customSentences).sentences.filter((x) => !s.sentOff.includes(lowerTr(x)));
}

const mine = (s: Settings) => (s.useMine ? myWords(s) : []);

/** Ayarlara göre oyunda sorulacak kelimeler: tablo kelimeleri ve/veya öğretmenin kelimeleri. */
export function gamePool(s: Settings): Word[] {
  const seen = new Set<string>();
  const out: Word[] = [];
  const table = s.useTable ? selectedTables(s).flatMap((t) => wordPool(t, { cumulative: false, proper: s.proper })) : [];
  for (const w of [...table, ...mine(s)]) {
    const key = lowerTr(w.text);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(w);
  }
  return out;
}

/**
 * Çeldirici heceler: seçili en ileri tabloya kadar okunabilen heceler (o harfe
 * gelen çocuk öncekileri de bilir); yalnız öğretmenin kelimeleri seçiliyse onların heceleri.
 */
export function gameBank(s: Settings): string[] {
  const last = selectedTables(s).at(-1);
  const set = new Set(s.useTable && last ? syllableBank(last) : []);
  for (const w of mine(s)) w.syllables.forEach((x) => set.add(lowerTr(x)));
  return [...set];
}

/** Cümle Okuyorum havuzu: hazır cümleler ve/veya öğretmenin cümleleri (sırası sahnede karıştırılır). */
export function sentencePool(s: Settings): string[] {
  const builtIn = s.sentBuiltIn ? SENTENCES : [];
  return [...new Set([...builtIn, ...(s.sentMine ? mySentences(s) : [])])];
}

export function capitalizeTr(s: string) {
  return s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);
}
