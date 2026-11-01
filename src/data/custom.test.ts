import { describe, expect, it } from 'vitest';
import { parseCustomWords } from './custom';

describe('parseCustomWords', () => {
  it('splits on spaces, commas and lines and syllabifies', () => {
    const { words, issues } = parseCustomWords('araba, elma\nkalem;  Ali');
    expect(words.map((w) => w.syllables.join('-'))).toEqual(['a-ra-ba', 'el-ma', 'ka-lem', 'A-li']);
    expect(words.find((w) => w.text === 'Ali')?.proper).toBe(true);
    expect(issues).toEqual([]);
  });

  it('uses teacher-given syllables', () => {
    const { words } = parseCustomWords('kap-lum-ba-ğa sa–at');
    expect(words.map((w) => [w.text, w.syllables])).toEqual([
      ['kaplumbağa', ['kap', 'lum', 'ba', 'ğa']],
      ['saat', ['sa', 'at']],
    ]);
  });

  it('skips duplicates and reports unusable entries', () => {
    const { words, issues } = parseCustomWords('elma Elma top 3ka kelebekçilikte');
    expect(words.map((w) => w.text)).toEqual(['elma']);
    expect(issues.map((i) => i.text)).toEqual(['top', '3ka', 'kelebekçilikte']);
  });
});
