import { describe, expect, it } from 'vitest';
import { ALL_TABLES } from '../data/curriculum';
import { SENTENCE_SETS } from '../data/sentences';

const ANETIL = SENTENCE_SETS[0].sentences;
import { DEFAULTS, type Settings } from '../settings';
import { gameBank, gamePool, sentencePool, syllableBank } from './common';

const base: Settings = { ...DEFAULTS, tables: [0] };

describe('sentencePool', () => {
  it('combines the chosen sheets and the teacher sentences, independent of the letter tables', () => {
    const s = { ...base, tables: [20], sentSets: ['ANETİL'], customSentences: 'Kedi süt içti.\nBalık yüzdü.\nTan nane at.' };
    expect(sentencePool(s)).toEqual([...ANETIL, 'Kedi süt içti.', 'Balık yüzdü.']);
    expect(sentencePool({ ...s, sentSets: [] })).toEqual(['Kedi süt içti.', 'Balık yüzdü.', 'Tan nane at.']);
    expect(sentencePool({ ...s, customSentences: '' })).toEqual(ANETIL);
    expect(sentencePool({ ...s, customSentences: '', sentSets: ['ANETİL', 'OKURIM'] })).toEqual([...ANETIL, ...SENTENCE_SETS[1].sentences]);
    expect(sentencePool({ ...s, sentOff: ['kedi süt içti.', 'balık yüzdü.', 'tan nane at.'], sentSets: [] })).toEqual([]);
  });
});

describe('teacher selections', () => {
  it('only uses the checked teacher words and sentences, keeping the rest saved', () => {
    const s = {
      ...base,
      tables: [],
      customWords: 'araba kap-lum-ba-ğa elma',
      wordsOff: ['kaplumbağa'],
      sentSets: [],
      customSentences: 'Ali okula koştu.\nKedi süt içti.',
      sentOff: ['kedi süt içti.'],
    };
    expect(gamePool(s).map((w) => w.text)).toEqual(['araba', 'elma']);
    expect(gameBank(s)).not.toContain('lum');
    expect(sentencePool(s)).toEqual(['Ali okula koştu.']);
    expect(s.customWords).toContain('kap-lum-ba-ğa');
  });
});

describe('gamePool', () => {
  it('mixes words from tables in different sound groups', () => {
    const [a, b] = [ALL_TABLES[1], ALL_TABLES[10]];
    const pool = gamePool({ ...base, tables: [a.order, b.order] }).map((w) => w.text);
    const expected = new Set([...a.words, ...b.words].map((w) => w.text));
    expect(new Set(pool)).toEqual(expected);
    expect(pool).not.toContain(ALL_TABLES[5].words[0].text);
  });

  it('adds the teacher words and draws distractors up to the furthest table', () => {
    const s = { ...base, tables: [0, 7], customWords: 'kap-lum-ba-ğa' };
    expect(gamePool(s).map((w) => w.text)).toContain('kaplumbağa');
    const bank = gameBank(s);
    expect(bank).toEqual(expect.arrayContaining([...syllableBank(ALL_TABLES[7]), 'kap', 'ğa']));
  });
});
