import { ALL_TABLES, dictionaryUpTo, wordPool, type Table, type Word } from '../data/curriculum';
import { pairSet, twoSyllable } from '../data/sort';
import { parseCustomWords } from '../data/custom';
import { parseCustomSentences, sentencesOf } from '../data/sentences';
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

/** Oyunda sorulacak kelimeler: seçili tabloların kelimeleri ve öğretmenin işaretli kelimeleri. */
export function gamePool(s: Settings): Word[] {
  const seen = new Set<string>();
  const out: Word[] = [];
  const table = selectedTables(s).flatMap((t) => wordPool(t, { cumulative: false, proper: s.proper }));
  for (const w of [...table, ...myWords(s)]) {
    const key = lowerTr(w.text);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(w);
  }
  return out;
}

/**
 * Çeldirici heceler: seçili en ileri tabloya kadar okunabilen heceler (o harfe
 * gelen çocuk öncekileri de bilir) ve öğretmenin işaretli kelimelerinin heceleri.
 */
export function gameBank(s: Settings): string[] {
  const last = selectedTables(s).at(-1);
  const set = new Set(last ? syllableBank(last) : []);
  for (const w of myWords(s)) w.syllables.forEach((x) => set.add(lowerTr(x)));
  return [...set];
}

/** Cümle Okuyorum havuzu: seçili hazır cümle grupları ve öğretmenin işaretli cümleleri (sırası sahnede karıştırılır). */
export function sentencePool(s: Settings): string[] {
  return [...new Set([...sentencesOf(s.sentSets), ...mySentences(s)])];
}

export function capitalizeTr(s: string) {
  return s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);
}

/** Hece Sort tahtasına konabilecek kelimeler: oyun havuzunun iki heceli, özel isim olmayanları. */
export function sortWords(s: Settings): Word[] {
  return twoSyllable(gamePool(s));
}

/**
 * Hece Sort'ta birleşmesi kabul edilen kelimeler: tahtadakilerin yanında seçili en
 * ileri tabloya kadar okunabilen tüm iki heceli kelimeler ve öğretmenin kelimeleri.
 */
export function sortPairs(s: Settings): Set<string> {
  const last = selectedTables(s).at(-1);
  const readable = last ? [...dictionaryUpTo(last, false).values()] : [];
  return pairSet([...sortWords(s), ...readable, ...myWords(s)]);
}
