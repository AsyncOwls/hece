import type { Word } from './curriculum';
import { lowerTr } from './syllabify';

/**
 * Heceleri Bul tahta boyutları (n×n). Hep çift: kelimeler satır içinde yan yana
 * kurulur (soldan sağa okunur), her satır tam kelimelere bölünür, hece artmaz.
 */
export const SORT_SIZES = [2, 4];

/** Kayıtlı ya da adresten gelen boyut geçerli değilse (eski 3×3, 5×5, 6×6) 4×4. */
export const sortSize = (n: number) => (SORT_SIZES.includes(n) ? n : 4);

/** n×n tahtadaki kelime sayısı. */
export const sortWordCount = (n: number) => (n * n) / 2;

/** Heceleri Bul'a uygun kelimeler: iki heceli, özel isim olmayan. */
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
 * kurarsa o da birleşir; kalan heceler artık tam kelimelere bölünemiyorsa birkaç
 * hece değiştirilerek tahta yeniden çözülebilir yapılır (bkz. repairSyllables).
 * Böylece oyun hep tahta dolunca biter. Satırı
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

/**
 * Hecelerden en çok kelime kuran eşleşmede artakalan hecelerin indeksleri.
 * Hece sayısı küçük (en çok 16) olduğu için bit maskesiyle önbellekli arama yeter.
 */
export function unpaired(syllables: string[], pairs: Set<string>): number[] {
  const s = syllables.map(lowerTr);
  const n = s.length;
  const ok = (a: number, b: number) => pairs.has(pairKey(s[a], s[b])) || pairs.has(pairKey(s[b], s[a]));
  const firstFree = (mask: number) => {
    let i = 0;
    while (i < n && mask & (1 << i)) i++;
    return i;
  };
  const memo = new Map<number, number>();
  const best = (mask: number): number => {
    const i = firstFree(mask);
    if (i >= n) return 0;
    const known = memo.get(mask);
    if (known !== undefined) return known;
    let r = best(mask | (1 << i));
    for (let j = i + 1; j < n; j++) {
      if (!(mask & (1 << j)) && ok(i, j)) r = Math.max(r, 1 + best(mask | (1 << i) | (1 << j)));
    }
    memo.set(mask, r);
    return r;
  };

  const left: number[] = [];
  let mask = 0;
  for (let i = firstFree(mask); i < n; i = firstFree(mask)) {
    const target = best(mask);
    let partner = -1;
    for (let j = i + 1; j < n && partner < 0; j++) {
      if (!(mask & (1 << j)) && ok(i, j) && 1 + best(mask | (1 << i) | (1 << j)) === target) partner = j;
    }
    if (partner >= 0) mask |= (1 << i) | (1 << partner);
    else {
      left.push(i);
      mask |= 1 << i;
    }
  }
  return left;
}

/**
 * Çocuk tahtadakinden farklı bir kelime kurunca (ör. "nene" ve "tatil" varken
 * "tane") kalan heceler tam kelimelere bölünemeyebilir ("ne", "til"). O zaman en
 * az heceyi değiştirerek tahta yeniden çözülebilir yapılır: artakalan heceler
 * ikişer ele alınır; birine eş olabilecek bir hece varsa yalnız öteki değişir
 * ("til" → "ne": nene), yoksa ikisi de yeni bir kelimenin hecesi olur. Eşler önce
 * `preferred` (tahtaya konan kelimeler), yoksa `pairs` içinden seçilir.
 * Döner: değişecek hecenin indeksi → yeni hece. Tahta zaten çözülebilirse boş.
 */
export function repairSyllables(free: string[], pairs: Set<string>, preferred: Set<string>, rand: Rand = Math.random): Map<number, string> {
  const out = new Map<number, string>();
  const left = unpaired(free, pairs);
  const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const split = (keys: Set<string>) => [...keys].map((k) => k.split('|') as [string, string]);
  const sources = [split(preferred), split(pairs)];
  const partners = (syl: string) => {
    const s = lowerTr(syl);
    for (const keys of sources) {
      const found = keys.flatMap(([a, b]) => (a === s ? [b] : b === s ? [a] : []));
      if (found.length) return found;
    }
    return [];
  };
  for (let k = 0; k + 1 < left.length; k += 2) {
    const [a, b] = [left[k], left[k + 1]];
    const forA = partners(free[a]);
    if (forA.length) {
      out.set(b, pick(forA));
      continue;
    }
    const forB = partners(free[b]);
    if (forB.length) {
      out.set(a, pick(forB));
      continue;
    }
    const keys = sources.find((x) => x.length) ?? [];
    if (!keys.length) continue;
    const [x, y] = pick(keys);
    out.set(a, x);
    out.set(b, y);
  }
  return out;
}
