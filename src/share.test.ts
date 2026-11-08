import { describe, expect, it } from 'vitest';
import { DEFAULTS, type Settings } from './settings';
import { decodeShared, encodeShared, shareUrl } from './share';
import { gamePool, sentencePool } from './scenes/common';

const teacher: Settings = {
  ...DEFAULTS,
  tables: [1, 9],
  customWords: 'araba kap-lum-ba-ğa çiçek',
  wordsOff: ['araba'],
  distractors: 4,
  oneColor: true,
  sound: 'effects',
  voice: 'Yelda',
  customSentences: 'Ayşe çiçek suladı.\nKedi süt içti.',
  sentOff: ['kedi süt içti.'],
  creatures: 8,
};

describe('shared game address', () => {
  it('carries the syllable game with only the checked teacher words', () => {
    const { mode, settings: s } = decodeShared(encodeShared({ ...teacher, tab: 'syllable' }))!;
    expect(mode).toBe('syllable');
    expect(s.tab).toBe('syllable');
    expect(s.tables).toEqual([1, 9]);
    expect(s.customWords).toBe('kap-lum-ba-ğa çi-çek');
    expect(s).toMatchObject({ distractors: 4, oneColor: true, sound: 'effects', voice: '' });
    expect(gamePool(s).map((w) => w.text)).toEqual(gamePool(teacher).map((w) => w.text));
  });

  it('carries the sentence game with only the checked teacher sentences', () => {
    const { mode, settings: s } = decodeShared(encodeShared({ ...teacher, tab: 'sentence', sentSets: [] }))!;
    expect(mode).toBe('sentence');
    expect(s.tab).toBe('sentence');
    expect(sentencePool(s)).toEqual(['Ayşe çiçek suladı.']);
    expect(s.creatures).toBe(8);
  });

  it('carries the chosen sheets; old addresses fall back to ANETİL', () => {
    const { settings: s } = decodeShared(encodeShared({ ...teacher, tab: 'sentence', sentSets: ['OKURIM'] }))!;
    expect(s.sentSets).toEqual(['OKURIM']);
    expect(sentencePool(s)).toContain('Ali ot al.');
    expect(sentencePool(s)).not.toContain('Tan nane at.');
    const old = btoa(JSON.stringify({ v: 1, mode: 'sentence', sound: 'on', sentBuiltIn: true, sentences: [] }));
    expect(decodeShared(old)!.settings.sentSets).toEqual(['ANETİL']);
    const oldMine = btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, mode: 'sentence', sound: 'on', sentBuiltIn: false, sentences: ['Kedi süt içti.'] }))));
    expect(sentencePool(decodeShared(oldMine)!.settings)).toEqual(['Kedi süt içti.']);
  });

  it('carries Hece Sort with its board size and the syllable game words', () => {
    const { mode, settings: s } = decodeShared(encodeShared({ ...teacher, tab: 'sentence', sortSize: 6 }, 'sort'))!;
    expect(mode).toBe('sort');
    expect(s.tab).toBe('sort');
    expect(s.sortSize).toBe(6);
    expect(decodeShared(encodeShared({ ...teacher, sortSize: 5 }, 'sort'))!.settings.sortSize).toBe(4);
    expect(gamePool(s).map((w) => w.text)).toEqual(gamePool(teacher).map((w) => w.text));
  });

  it('builds a URL-safe play.html address next to the teacher page', () => {
    const url = new URL(shareUrl({ ...teacher, tab: 'sentence' }, 'https://okul.example/hece/index.html?x=1'));
    expect(url.pathname).toBe('/hece/play.html');
    expect([...url.searchParams.keys()]).toEqual(['data']);
    expect(url.searchParams.get('data')).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('opens old addresses whose table words were switched off with only the teacher words', () => {
    const old = btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, mode: 'syllable', sound: 'on', tables: [3], useTable: false, words: ['ka-lem'] }))));
    const { settings: s } = decodeShared(old)!;
    expect(s.tables).toEqual([]);
    expect(gamePool(s).map((w) => w.text)).toEqual(['kalem']);
  });

  it('rejects broken data', () => {
    expect(decodeShared('bozuk-veri')).toBeNull();
    expect(decodeShared(btoa('{"v":2}'))).toBeNull();
    expect(decodeShared('')).toBeNull();
  });
});
