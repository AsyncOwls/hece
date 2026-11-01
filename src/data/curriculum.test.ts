import { describe, expect, it } from 'vitest';
import { syllabify } from './syllabify';
import { ALL_TABLES, CURRICULUM } from './curriculum';

describe('syllabify', () => {
  it.each([
    ['araba', 'a-ra-ba'],
    ['elma', 'el-ma'],
    ['korkmak', 'kork-mak'],
    ['saat', 'sa-at'],
    ['traktör', 'trak-tör'],
    ['Türkçe', 'Türk-çe'],
    ['koala', 'ko-a-la'],
    ['kaplumbağa', 'kap-lum-ba-ğa'],
    ['İnal', 'İ-nal'],
    ['aile', 'a-i-le'],
    ['tekerlek', 'te-ker-lek'],
  ])('%s → %s', (word, expected) => {
    expect(syllabify(word).join('-')).toBe(expected);
  });
});

describe('curriculum', () => {
  it('has the five sound groups in order', () => {
    expect(CURRICULUM.map((g) => g.tables.map((t) => t.label).join(','))).toEqual([
      'A N E T İ,L',
      'O,K,U,R,I,M',
      'Ü,S,Ö,Y,D,Z',
      'Ç,B,G,C,Ş',
      'P,H,V,Ğ,F,J',
    ]);
  });

  it('every table has playable words', () => {
    for (const t of ALL_TABLES) expect(t.words.length, t.label).toBeGreaterThanOrEqual(8);
  });

  it('words only use letters known at that table', () => {
    for (const t of ALL_TABLES) {
      for (const w of t.words) {
        for (const ch of w.text.toLocaleLowerCase('tr-TR')) expect(t.known.has(ch), `${t.label}: ${w.text}`).toBe(true);
      }
    }
  });
});
