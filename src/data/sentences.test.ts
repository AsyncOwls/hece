import { describe, expect, it } from 'vitest';
import { ALL_TABLES } from './curriculum';
import { MAX_SENTENCE, SENTENCES, SENTENCE_SETS, parseCustomSentences, sentencesOf, validSentenceSets } from './sentences';

describe('sentences', () => {
  it('has two groups: the 40 ANETİL sentences and the 48 OKURIM sentences, all unique and short enough', () => {
    expect(SENTENCE_SETS.map((s) => [s.name, s.sentences.length])).toEqual([
      ['ANETİL', 40],
      ['OKURIM', 48],
    ]);
    expect(new Set(SENTENCES).size).toBe(SENTENCES.length);
    for (const s of SENTENCES) expect(s.length, s).toBeLessThanOrEqual(MAX_SENTENCE);
  });

  it('each group only uses the letters learned up to its last table', () => {
    const last = { ANETİL: ALL_TABLES[1], OKURIM: ALL_TABLES.find((t) => t.label === 'M')! } as const;
    for (const set of SENTENCE_SETS) {
      const known = last[set.name as keyof typeof last].known;
      for (const s of set.sentences) {
        for (const ch of s.toLocaleLowerCase('tr-TR').replace(/[^\p{L}]/gu, '')) expect(known.has(ch), s).toBe(true);
      }
    }
  });

  it('uses the chosen groups in order; none chosen is allowed', () => {
    const [anetil, okurim] = SENTENCE_SETS.map((s) => s.sentences);
    expect(sentencesOf(['OKURIM', 'ANETİL'])).toEqual([...anetil, ...okurim]);
    expect(sentencesOf(['OKURIM'])).toEqual(okurim);
    expect(validSentenceSets(['OKURIM', 'X'])).toEqual(['OKURIM']);
    expect(validSentenceSets(['O', 'K'])).toEqual(['OKURIM']);
    expect(validSentenceSets([])).toEqual([]);
    expect(validSentenceSets(undefined)).toEqual(['ANETİL', 'OKURIM']);
  });

  it('parses one sentence per line', () => {
    const { sentences, issues } = parseCustomSentences('Ali okula koştu.\n\n  Kedi   süt içti. \nali okula koştu.\n' + 'a '.repeat(50));
    expect(sentences).toEqual(['Ali okula koştu.', 'Kedi süt içti.']);
    expect(issues).toHaveLength(1);
  });
});
