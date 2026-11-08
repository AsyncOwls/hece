import { lowerTr } from './syllabify';

/**
 * "Cümle Okuyorum" için hazır cümle fişleri (öğretmenin verdiği PDF'lerden
 * aktarıldı). Yeni bir fiş eklemek için listeye bir öğe eklemek yeterli.
 * group: harf tablosundaki ses grubu (0 = 1. Ses Grubu); menüde rengi buradan gelir.
 */
const SETS: { name: string; group: number; text: string }[] = [
  {
    name: 'ANETİL',
    group: 0,
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
  {
    name: 'O',
    group: 1,
    text: `
      Ali ot al.
      Ata not al.
      Lale olta al.
      Onat nane al.
      Onat oteli anlat.
      Nine ona et al.
      On tane atlet al.
      Lale o ata ot al.
    `,
  },
  {
    name: 'K',
    group: 1,
    text: `
      Onat kekik, nane kokla.
      Ela iki tane toka al.
      İnek ile ata ot al.
      Nine o etek lekeli.
      Kenan İlke ile nane ek.
      Kenan, Ali ile kekik al.
      Kenan kekik ile nane ek.
      Ali iki tane kekik al.
    `,
  },
  {
    name: 'U',
    group: 1,
    text: `
      Kenan okulu anlat.
      Tuana o ne?
      Utku, kokulu nane kokla.
      Ali, annene on kilo un al.
      Ela’nın eli unlu.
      Onat, koluna kolluk tak.
      Lale, o okul onun okulu.
      Utku onu oku, anla.
    `,
  },
  {
    name: 'R',
    group: 1,
    text: `
      Ela onu okur.
      İki tane nar tart.
      Erkan kuru nane al.
      Lale o kareli etek.
      O kartonu karala.
      İki nane ne tutar?
      Lila terlik on lira.
      Okan erken kalk.
    `,
  },
  {
    name: 'I',
    group: 1,
    text: `
      Tarık kalın atkı takar.
      Anıl altını ona taktı.
      Itır’a altı tane altın al.
      Ela renkli renkli toka tak.
      Rana, Anıl’a kolluk taktı.
      Nalan okul kuralını anlat.
      İlke renkli takı alır.
      Anıl renkli atık kutuları al.
    `,
  },
  {
    name: 'M',
    group: 1,
    text: `
      Ekrem minik minik erik al.
      Martılara ekmek atalım mı?
      Murat makinenin tekerini al.
      Kemal erken kalkar.
      Murat mutlu olur.
      Emir, Emel nereli?
      Emin, Mert’e lokum ikram et.
      Minik armutlu lokum alırım.
    `,
  },
];

const lines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

export const SENTENCE_SETS = SETS.map((s) => ({ name: s.name, group: s.group, sentences: lines(s.text) }));
export const SENTENCES: string[] = SENTENCE_SETS.flatMap((s) => s.sentences);
export const DEFAULT_SENTENCE_SETS = [SENTENCE_SETS[0].name];

/** Bilinen fiş adlarını fiş sırasıyla döner; hiçbiri kalmazsa varsayılan fiş. */
export function validSentenceSets(names: unknown): string[] {
  const list = Array.isArray(names) ? names : [];
  const valid = SENTENCE_SETS.map((s) => s.name).filter((n) => list.includes(n));
  return valid.length ? valid : [...DEFAULT_SENTENCE_SETS];
}

/** Seçili fişlerin cümleleri (fiş sırasıyla). */
export function sentencesOf(names: string[]): string[] {
  return SENTENCE_SETS.filter((s) => names.includes(s.name)).flatMap((s) => s.sentences);
}

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
