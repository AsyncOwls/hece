import { ALL_TABLES } from './data/curriculum';
import { DEFAULTS, type Settings } from './settings';
import type { SoundMode } from './audio';
import { mySentences, myWords } from './scenes/common';

/**
 * Paylaşılan oyun adresi (play.html?data=…) içindeki veri. Yalnızca seçili
 * bölümün ayarları ve öğretmenin işaretli kelime/cümleleri girer; okuma sesi
 * cihaza özel olduğu için girmez.
 */
interface Shared {
  v: 1;
  mode: Settings['tab'];
  sound: SoundMode;
  // Hece Birleştir
  tables?: number[];
  useTable?: boolean;
  words?: string[];
  proper?: boolean;
  distractors?: number;
  showWord?: boolean;
  oneColor?: boolean;
  roundSize?: number;
  // Cümle Okuyorum
  sentBuiltIn?: boolean;
  sentences?: string[];
  creatures?: number;
}

function pack(s: Settings): Shared {
  const base = { v: 1 as const, mode: s.tab, sound: s.sound };
  if (s.tab === 'sentence') {
    return { ...base, sentBuiltIn: s.sentBuiltIn, sentences: s.sentMine ? mySentences(s) : [], creatures: s.creatures };
  }
  return {
    ...base,
    tables: s.tables,
    useTable: s.useTable,
    words: s.useMine ? myWords(s).map((w) => w.syllables.join('-')) : [],
    proper: s.proper,
    distractors: s.distractors,
    showWord: s.showWord,
    oneColor: s.oneColor,
    roundSize: s.roundSize,
  };
}

/** Türkçe harfler bozulmasın diye UTF-8; adreste sorun çıkarmasın diye URL'ye uygun base64 (+/= yok). */
function toBase64Url(text: string): string {
  let bin = '';
  new TextEncoder().encode(text).forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(data: string): string {
  const b64 = data.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '==='.slice((b64.length + 3) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export const encodeShared = (s: Settings) => toBase64Url(JSON.stringify(pack(s)));

/** Paylaşılan oyunun adresi; öğretmen sayfasının yanındaki play.html. */
export function shareUrl(s: Settings, from = location.href): string {
  const url = new URL('play.html', from);
  url.search = '';
  url.searchParams.set('data', encodeShared(s));
  return url.toString();
}

const strings = (x: unknown): x is string[] => Array.isArray(x) && x.every((v) => typeof v === 'string');
const bool = (x: unknown, d: boolean) => (typeof x === 'boolean' ? x : d);
const int = (x: unknown, d: number, min: number, max: number) =>
  Number.isInteger(x) && (x as number) >= min && (x as number) <= max ? (x as number) : d;

/** Adresteki veriyi oyun ayarlarına çevirir; bozuksa null. */
export function decodeShared(data: string): Settings | null {
  let raw: Partial<Shared>;
  try {
    raw = JSON.parse(fromBase64Url(data));
  } catch {
    return null;
  }
  if (!raw || raw.v !== 1 || (raw.mode !== 'syllable' && raw.mode !== 'sentence')) return null;

  const tables = Array.isArray(raw.tables)
    ? raw.tables.filter((n) => Number.isInteger(n) && n >= 0 && n < ALL_TABLES.length)
    : [];
  const words = strings(raw.words) ? raw.words : [];
  const sentences = strings(raw.sentences) ? raw.sentences : [];
  const useTable = bool(raw.useTable, true) && tables.length > 0;
  const sentBuiltIn = bool(raw.sentBuiltIn, true);
  return {
    ...DEFAULTS,
    tab: raw.mode,
    sound: raw.sound === 'effects' || raw.sound === 'off' ? raw.sound : 'on',
    tables: tables.length ? tables : DEFAULTS.tables,
    useTable,
    useMine: words.length > 0,
    customWords: words.join(' '),
    proper: bool(raw.proper, DEFAULTS.proper),
    distractors: int(raw.distractors, DEFAULTS.distractors, 0, 4),
    showWord: bool(raw.showWord, DEFAULTS.showWord),
    oneColor: bool(raw.oneColor, DEFAULTS.oneColor),
    roundSize: int(raw.roundSize, DEFAULTS.roundSize, 1, 50),
    sentBuiltIn: sentBuiltIn || sentences.length === 0,
    sentMine: sentences.length > 0,
    customSentences: sentences.join('\n'),
    creatures: int(raw.creatures, DEFAULTS.creatures, 1, 8),
  };
}
