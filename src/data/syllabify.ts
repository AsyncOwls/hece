const VOWELS = new Set([...'aeıioöuüâîûAEIİOÖUÜÂÎÛ']);

export const isVowel = (ch: string) => VOWELS.has(ch);

/**
 * Türkçe heceleme: her hecede tek ünlü vardır. İki ünlü arasındaki
 * ünsüzlerden yalnızca sonuncusu sonraki heceye geçer.
 *   a-ra-ba, el-ma, kork-mak, sa-at, trak-tör
 */
export function syllabify(word: string): string[] {
  const chars = [...word];
  const vowels: number[] = [];
  chars.forEach((c, i) => {
    if (isVowel(c)) vowels.push(i);
  });
  if (vowels.length <= 1) return [word];

  const cuts: number[] = [];
  for (let k = 0; k < vowels.length - 1; k++) {
    const a = vowels[k];
    const b = vowels[k + 1];
    cuts.push(b - a === 1 ? b : b - 1);
  }

  const out: string[] = [];
  let start = 0;
  for (const cut of cuts) {
    out.push(chars.slice(start, cut).join(''));
    start = cut;
  }
  out.push(chars.slice(start).join(''));
  return out;
}

export const lowerTr = (s: string) => s.toLocaleLowerCase('tr-TR');
