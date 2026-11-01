import { GROUPS } from './tables';
import { lowerTr, syllabify } from './syllabify';

export interface Word {
  text: string;
  syllables: string[];
  /** Özel isim mi (büyük harfle başlıyor). */
  proper: boolean;
}

export interface Table {
  groupIndex: number;
  tableIndex: number;
  /** Tüm tablolar içindeki sıra (0'dan başlar). */
  order: number;
  label: string;
  letters: string[];
  /** Bu tabloya kadar öğrenilmiş tüm harfler. */
  known: Set<string>;
  /** En az iki heceli, yalnızca bilinen harflerle yazılmış kelimeler. */
  words: Word[];
  /** Henüz öğrenilmemiş harf içerdiği için dışarıda bırakılanlar. */
  rejected: string[];
}

export interface Group {
  name: string;
  tables: Table[];
}

const isProper = (w: string) => w[0] !== lowerTr(w[0]);

function buildCurriculum(): Group[] {
  const known = new Set<string>();
  let order = 0;

  return GROUPS.map((group, groupIndex) => ({
    name: group.name,
    tables: group.tables.map((raw, tableIndex) => {
      raw.letters.forEach((l) => known.add(l));
      const snapshot = new Set(known);

      const seen = new Set<string>();
      const words: Word[] = [];
      const rejected: string[] = [];

      for (const text of raw.words.split(/\s+/).filter(Boolean)) {
        if (seen.has(text)) continue;
        seen.add(text);
        const letters = [...lowerTr(text)];
        if (!letters.every((ch) => snapshot.has(ch))) {
          rejected.push(text);
          continue;
        }
        const syllables = syllabify(text);
        if (syllables.length < 2) continue;
        words.push({ text, syllables, proper: isProper(text) });
      }

      return {
        groupIndex,
        tableIndex,
        order: order++,
        label: raw.label,
        letters: raw.letters,
        known: snapshot,
        words,
        rejected,
      };
    }),
  }));
}

export const CURRICULUM: Group[] = buildCurriculum();
export const ALL_TABLES: Table[] = CURRICULUM.flatMap((g) => g.tables);

export interface PoolOptions {
  /** Önceki tabloların kelimelerini de kat. */
  cumulative: boolean;
  /** Özel isimleri dahil et. */
  proper: boolean;
}

export function wordPool(table: Table, opts: PoolOptions): Word[] {
  const tables = opts.cumulative ? ALL_TABLES.slice(0, table.order + 1) : [table];
  const seen = new Set<string>();
  const out: Word[] = [];
  for (const t of tables) {
    for (const w of t.words) {
      if (!opts.proper && w.proper) continue;
      if (seen.has(w.text)) continue;
      seen.add(w.text);
      out.push(w);
    }
  }
  return out;
}

/**
 * Serbest oyunda kabul edilecek kelimeler: bu tabloya kadar olan tüm
 * tablolardaki kelimeler (küçük harfe çevrilmiş).
 */
export function dictionaryUpTo(table: Table, proper: boolean): Map<string, Word> {
  const map = new Map<string, Word>();
  for (const t of ALL_TABLES.slice(0, table.order + 1)) {
    for (const w of t.words) {
      if (!proper && w.proper) continue;
      map.set(lowerTr(w.text), w);
    }
  }
  return map;
}
