import type { Word } from './curriculum';
import { lowerTr } from './syllabify';

/**
 * Hece Sort tahta boyutları (n×n). Hep çift: kelimeler satır içinde yan yana
 * kurulur (soldan sağa okunur), her satır tam kelimelere bölünür, hece artmaz.
 */
export const SORT_SIZES = [2, 4, 6];

/** Kayıtlı ya da adresten gelen boyut geçerli değilse (eski 3×3, 5×5) 4×4. */
export const sortSize = (n: number) => (SORT_SIZES.includes(n) ? n : 4);

/** n×n tahtadaki kelime sayısı. */
export const sortWordCount = (n: number) => (n * n) / 2;

/** Hece Sort'a uygun kelimeler: iki heceli, özel isim olmayan. */
export const twoSyllable = (pool: Word[]) => pool.filter((w) => w.syllables.length === 2 && !w.proper);

/** Yan yana iki hece (büyük/küçük harf farkı gözetmez). */
export const pairKey = (left: string, right: string) => `${lowerTr(left)}|${lowerTr(right)}`;

/** Kabul edilen kelimelerin hece çiftleri. */
export const pairSet = (words: Word[]) => new Set(twoSyllable(words).map((w) => pairKey(w.syllables[0], w.syllables[1])));

type Rand = () => number;

function shuffled<T>(arr: T[], rand: Rand): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Tahtadaki kelimeler; havuzda yeterince iki heceli kelime yoksa kelimeler tekrar eder. */
export function pickSortWords(pool: Word[], count: number, rand: Rand = Math.random): Word[] {
  const two = twoSyllable(pool);
  if (two.length === 0) return [];
  const out: Word[] = [];
  while (out.length < count) out.push(...shuffled(two, rand));
  return out.slice(0, count);
}

/** Tahtada (satır içinde yan yana) hazır bir kelime var mı. */
export function hasReadyWord(cells: string[], n: number, keys: Set<string>): boolean {
  for (let r = 0; r < n; r++) {
    for (let c = 0; c + 1 < n; c++) {
      if (keys.has(pairKey(cells[r * n + c], cells[r * n + c + 1]))) return true;
    }
  }
  return false;
}

/**
 * Hecelerin karışık dizilişi (satır satır, n×n). Başta hiçbir kelime kendiliğinden
 * kurulu olmasın diye birkaç kez karıştırılır.
 *
 * Tahtaya konan kelimelerle her zaman çözülebilir. Çocuk başka bir okunabilen kelime
 * kurarsa (ör. "anten" ve "nane"nin hecelerinden "anne") o da birleşir; kalan
 * hecelerle artık kelime kurulamıyorsa oyun biter (bkz. canFormWords). Satırı
 * tıkayan birleşmelerde bloklar kenara kaydırılır (bkz. rowBlocked).
 */
export function buildSortBoard(words: Word[], n: number, keys: Set<string> = pairSet(words), rand: Rand = Math.random): string[] {
  const all = words.flatMap((w) => w.syllables);
  let cells = shuffled(all, rand);
  for (let i = 0; i < 500 && hasReadyWord(cells, n, keys); i++) cells = shuffled(all, rand);
  return cells;
}

/**
 * Satırdaki kelime blokları (başladıkları sütunlar) yüzünden satıra gereken
 * kelimeler artık sığmıyor mu. Örn. 4'lük satırda 1-2. sütunlardaki blok iki
 * yanda tek hücre bırakır.
 */
export function rowBlocked(n: number, blockCols: number[]): boolean {
  const starts = new Set(blockCols);
  let room = 0;
  let run = 0;
  for (let c = 0; c < n; c++) {
    if (starts.has(c)) {
      room += Math.floor(run / 2);
      run = 0;
      c++;
    } else run++;
  }
  room += Math.floor(run / 2);
  return starts.size + room < Math.floor(n / 2);
}

/**
 * Bu hecelerden (her hece en çok bir kez) `need` tane kelime kurulabilir mi.
 * Hece sayısı küçük (en çok 25) olduğu için geri izleme + önbellek yeter.
 */
export function canFormWords(syllables: string[], need: number, pairs: Set<string>): boolean {
  const counts = new Map<string, number>();
  for (const s of syllables.map(lowerTr)) counts.set(s, (counts.get(s) ?? 0) + 1);
  const keys = [...counts.keys()].sort();
  const partners = new Map(
    keys.map((a) => [a, keys.filter((b) => pairs.has(pairKey(a, b)) || pairs.has(pairKey(b, a)))]),
  );
  const memo = new Map<string, boolean>();

  const go = (left: number, need: number): boolean => {
    if (need === 0) return true;
    if (left < need * 2) return false;
    const state = `${keys.map((k) => counts.get(k)).join(',')}/${need}`;
    const known = memo.get(state);
    if (known !== undefined) return known;
    // En küçük hece ya bir kelimeye katılır ya da artık kalır.
    const a = keys.find((k) => counts.get(k)! > 0)!;
    counts.set(a, counts.get(a)! - 1);
    let ok = false;
    for (const b of partners.get(a)!) {
      if (counts.get(b)! === 0) continue;
      counts.set(b, counts.get(b)! - 1);
      ok = go(left - 2, need - 1);
      counts.set(b, counts.get(b)! + 1);
      if (ok) break;
    }
    if (!ok) ok = go(left - 1, need);
    counts.set(a, counts.get(a)! + 1);
    memo.set(state, ok);
    return ok;
  };
  return go(syllables.length, need);
}
