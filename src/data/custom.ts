import { MAX_SYLLABLES, isProper, type Word } from './curriculum';
import { lowerTr, syllabify } from './syllabify';

export interface CustomIssue {
  text: string;
  reason: string;
}

export interface CustomWords {
  words: Word[];
  /** Oyuna alınmayan girdiler ve nedenleri. */
  issues: CustomIssue[];
}

const LETTERS = /^[a-zçğıöşüâîûA-ZÇĞİÖŞÜÂÎÛ]+$/;

/**
 * Öğretmenin yazdığı kelimeler: boşluk, virgül ya da satırla ayrılır.
 * Heceler kendiliğinden ayrılır; tireyle elle de verilebilir (kap-lum-ba-ğa).
 */
export function parseCustomWords(input: string): CustomWords {
  const words: Word[] = [];
  const issues: CustomIssue[] = [];
  const seen = new Set<string>();

  for (const raw of input.split(/[\s,;.]+/)) {
    const token = raw.replace(/[–—·]/g, '-').replace(/^-+|-+$/g, '');
    if (!token) continue;
    const parts = token.split('-').filter(Boolean);
    const text = parts.join('');
    if (!LETTERS.test(text)) {
      issues.push({ text: token, reason: 'harf olmayan işaret var' });
      continue;
    }
    const key = lowerTr(text);
    if (seen.has(key)) continue;
    seen.add(key);

    const syllables = parts.length > 1 ? parts : syllabify(text);
    if (syllables.length < 2) issues.push({ text: token, reason: 'tek hece' });
    else if (syllables.length > MAX_SYLLABLES) issues.push({ text: token, reason: `en çok ${MAX_SYLLABLES} hece` });
    else words.push({ text, syllables, proper: isProper(text) });
  }
  return { words, issues };
}
