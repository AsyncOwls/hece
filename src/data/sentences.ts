import { lowerTr } from './syllabify';

/**
 * "Cümle Okuyorum" için hazır cümle fişleri (öğretmenin verdiği PDF'lerden
 * aktarıldı). Yeni bir fiş eklemek için listeye bir öğe eklemek yeterli.
 */
const SETS: { name: string; text: string }[] = [
  {
    name: 'ANETİL',
    text: `
      Ata ete nane at.
      Tan nane at.
      Tan tane tane at.
      Tan annene nane at.
      Anneanne ete nane at.
      Anne eti tat.
      Annen inat etti.
      Et ninene ait.
      Ata inat etti.
      İnan anteni itti.
      Nil antene itina et.
      İnan anten ninenin.
      İnan ninen ne inat.
      Talat lale al.
      Talat lila lale al.
      Talat annene lale al.
      Nil, Talat ile lila lale al.
      Anne elli lale al.
      Nine naneli eti al.
      Anneanne et naneli.
      Nail naneli eti tat.
      Nil tatili anlat.
      Talat ile Nalan’a anlat.
      Tatilini Ela ile anlat.
      Ali anteni al.
      Nalan tel ile anteni al.
      Anten ile teli eline al.
      Anten ile teli Nil’e ilet.
      Ali teli Nil’e iletti.
      Ali itina ile teli iletti.
      Eline elli tane tel al.
      Ailene tane tane anlat.
      Nil atlet al.
      Ela, Nil’e elli atlet al.
      Elli tane lila atlet al.
      Ela, elli tane lila atleti al.
      Ela, lila lale al.
      Talat, Nil’e lale al.
      Annene lila atleti anlat.
      Lina lila aleti ilet.
    `,
  },
];

const lines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

export const SENTENCE_SETS = SETS.map((s) => ({ name: s.name, sentences: lines(s.text) }));
export const SENTENCES: string[] = SENTENCE_SETS.flatMap((s) => s.sentences);

/** Ekranda iki satıra sığacak en uzun cümle. */
export const MAX_SENTENCE = 70;

export interface CustomSentences {
  sentences: string[];
  issues: { text: string; reason: string }[];
}

/** Öğretmenin cümleleri: her satırda bir cümle. */
export function parseCustomSentences(input: string): CustomSentences {
  const sentences: string[] = [];
  const issues: CustomSentences['issues'] = [];
  const seen = new Set<string>();
  for (const line of input.split('\n')) {
    const text = line.replace(/\s+/g, ' ').trim();
    if (!/\p{L}/u.test(text)) continue;
    const key = lowerTr(text);
    if (seen.has(key)) continue;
    seen.add(key);
    if (text.length > MAX_SENTENCE) issues.push({ text, reason: `çok uzun, en çok ${MAX_SENTENCE} harf` });
    else sentences.push(text);
  }
  return { sentences, issues };
}
