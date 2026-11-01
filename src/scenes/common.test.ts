import { describe, expect, it } from 'vitest';
import { ALL_TABLES } from '../data/curriculum';
import type { Settings } from '../settings';
import { gameBank, gamePool, syllableBank } from './common';

const base: Settings = {
  tables: [0],
  useTable: true,
  useMine: false,
  customWords: '',
  proper: true,
  distractors: 2,
  showWord: false,
  oneColor: false,
  roundSize: 10,
  sound: 'on',
  voice: '',
};

describe('gamePool', () => {
  it('mixes words from tables in different sound groups', () => {
    const [a, b] = [ALL_TABLES[1], ALL_TABLES[10]];
    const pool = gamePool({ ...base, tables: [a.order, b.order] }).map((w) => w.text);
    const expected = new Set([...a.words, ...b.words].map((w) => w.text));
    expect(new Set(pool)).toEqual(expected);
    expect(pool).not.toContain(ALL_TABLES[5].words[0].text);
  });

  it('adds the teacher words and draws distractors up to the furthest table', () => {
    const s = { ...base, tables: [0, 7], useMine: true, customWords: 'kap-lum-ba-ğa' };
    expect(gamePool(s).map((w) => w.text)).toContain('kaplumbağa');
    const bank = gameBank(s);
    expect(bank).toEqual(expect.arrayContaining([...syllableBank(ALL_TABLES[7]), 'kap', 'ğa']));
  });
});
