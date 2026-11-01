import { describe, expect, it } from 'vitest';
import { ALL_TABLES } from './curriculum';
import { MAX_SENTENCE, SENTENCES, parseCustomSentences } from './sentences';

describe('sentences', () => {
  it('has the 40 ANETİL sentences, all unique and short enough', () => {
    expect(SENTENCES).toHaveLength(40);
    expect(new Set(SENTENCES).size).toBe(40);
    for (const s of SENTENCES) expect(s.length, s).toBeLessThanOrEqual(MAX_SENTENCE);
  });

  it('ANETİL sentences only use A N E T İ L', () => {
    const known = ALL_TABLES[1].known;
    for (const s of SENTENCES) {
      for (const ch of s.toLocaleLowerCase('tr-TR').replace(/[^\p{L}]/gu, '')) expect(known.has(ch), s).toBe(true);
    }
  });

  it('parses one sentence per line', () => {
    const { sentences, issues } = parseCustomSentences('Ali okula koştu.\n\n  Kedi   süt içti. \nali okula koştu.\n' + 'a '.repeat(50));
    expect(sentences).toEqual(['Ali okula koştu.', 'Kedi süt içti.']);
    expect(issues).toHaveLength(1);
  });
});
