import { describe, expect, it } from 'vitest';
import { ALL_TABLES } from './curriculum';
import { MAX_SENTENCE, SENTENCES, SENTENCE_SETS, parseCustomSentences, sentencesOf, validSentenceSets } from './sentences';

describe('sentences', () => {
  it('has the ANETİL sheet and one sheet per letter of the 2nd sound group, all unique and short enough', () => {
    expect(SENTENCE_SETS.map((s) => [s.name, s.sentences.length])).toEqual([
      ['ANETİL', 40], ['O', 8], ['K', 8], ['U', 8], ['R', 8], ['I', 8], ['M', 8],
    ]);
    expect(new Set(SENTENCES).size).toBe(SENTENCES.length);
    for (const s of SENTENCES) expect(s.length, s).toBeLessThanOrEqual(MAX_SENTENCE);
  });

  it('each sheet only uses the letters learned up to its table', () => {
    // Fişte olduğu gibi bırakıldı: U fişinde "Ela’nın" (ı henüz öğrenilmedi).
    const asOnSheet = new Set(['Ela’nın eli unlu.']);
    for (const set of SENTENCE_SETS) {
      const table = set.name === 'ANETİL' ? ALL_TABLES[1] : ALL_TABLES.find((t) => t.label === set.name)!;
      for (const s of set.sentences.filter((x) => !asOnSheet.has(x))) {
        for (const ch of s.toLocaleLowerCase('tr-TR').replace(/[^\p{L}]/gu, '')) expect(table.known.has(ch), s).toBe(true);
      }
    }
  });

  it('picks the chosen sheets in sheet order and falls back to ANETİL', () => {
    expect(sentencesOf(['K', 'O'])).toEqual([...SENTENCE_SETS[1].sentences, ...SENTENCE_SETS[2].sentences]);
    expect(validSentenceSets(['M', 'X', 'O'])).toEqual(['O', 'M']);
    expect(validSentenceSets(undefined)).toEqual(['ANETİL']);
    expect(validSentenceSets([])).toEqual(['ANETİL']);
  });

  it('parses one sentence per line', () => {
    const { sentences, issues } = parseCustomSentences('Ali okula koştu.\n\n  Kedi   süt içti. \nali okula koştu.\n' + 'a '.repeat(50));
    expect(sentences).toEqual(['Ali okula koştu.', 'Kedi süt içti.']);
    expect(issues).toHaveLength(1);
  });
});
