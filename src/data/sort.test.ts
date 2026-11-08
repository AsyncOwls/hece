import { describe, expect, it } from 'vitest';
import type { Word } from './curriculum';
import { SORT_SIZES, buildSortBoard, canFormWords, hasReadyWord, pairSet, pickSortWords, rowBlocked, sortSize, sortWordCount } from './sort';

const w = (a: string, b: string): Word => ({ text: a + b, syllables: [a, b], proper: false });
const POOL = [w('ka', 'le'), w('la', 'le'), w('el', 'ma'), w('a', 'ta'), w('ke', 'di'), w('ma', 'sa'), w('ka', 'rakter'), w('a', 'na')];

describe('Heceleri Bul', () => {
  it('uses only even boards, filled with whole words', () => {
    expect(SORT_SIZES.map(sortWordCount)).toEqual([2, 8, 18]);
    expect([2, 3, 4, 5, 6].map(sortSize)).toEqual([2, 4, 4, 4, 6]);
  });

  it('uses only two-syllable words and repeats them when the pool is small', () => {
    const three: Word = { text: 'araba', syllables: ['a', 'ra', 'ba'], proper: false };
    const words = pickSortWords([three, w('ka', 'le'), w('el', 'ma')], 5);
    expect(words).toHaveLength(5);
    expect(words.every((x) => x.syllables.length === 2)).toBe(true);
    expect(pickSortWords([three], 3)).toEqual([]);
    expect(pickSortWords([{ text: 'Ali', syllables: ['A', 'li'], proper: true }], 2)).toEqual([]);
  });

  it('shuffles every syllable onto the board without a ready-made word', () => {
    for (const n of SORT_SIZES) {
      const words = pickSortWords(POOL, sortWordCount(n));
      const cells = buildSortBoard(words, n);
      expect(cells).toHaveLength(n * n);
      expect([...cells].sort()).toEqual(words.flatMap((x) => x.syllables).sort());
      expect(hasReadyWord(cells, n, pairSet(words))).toBe(false);
    }
  });

  it('detects a word block that leaves no room for the rest of the row', () => {
    expect(rowBlocked(4, [1])).toBe(true);
    expect(rowBlocked(4, [0])).toBe(false);
    expect(rowBlocked(4, [2])).toBe(false);
    expect(rowBlocked(2, [0])).toBe(false);
    expect(rowBlocked(6, [1])).toBe(true);
    expect(rowBlocked(6, [2])).toBe(false);
    expect(rowBlocked(6, [1, 3])).toBe(true);
    expect(rowBlocked(6, [0, 3])).toBe(true);
  });

  it('tells whether the remaining syllables can still form words', () => {
    const pairs = pairSet([w('an', 'ten'), w('na', 'ne'), w('an', 'ne'), w('ne', 'ne')]);
    // Tahtada anten + nane varken "anne" kurulursa geriye ten, na kalır: oyun biter.
    expect(canFormWords(['ten', 'na'], 1, pairs)).toBe(false);
    expect(canFormWords(['na', 'ne'], 1, pairs)).toBe(true);
    expect(canFormWords(['an', 'ne', 'na', 'ne', 'bo'], 2, pairs)).toBe(true);
    expect(canFormWords(['an', 'ten', 'na', 'ne'], 2, pairs)).toBe(true);
    expect(canFormWords(['ne', 'ne', 'ne'], 2, pairs)).toBe(false);
  });
});
