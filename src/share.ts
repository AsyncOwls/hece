import { ALL_TABLES } from './data/curriculum';
import { DEFAULTS, type Settings } from './settings';
import type { SoundMode } from './audio';
import { mySentences, myWords } from './scenes/common';
import { sortSize } from './data/sort';
import { validSentenceSets } from './data/sentences';

/**
 * Paylaşılan oyun adresi (play.html?data=…) içindeki veri. Yalnızca seçili
 * bölümün ayarları ve öğretmenin işaretli kelime/cümleleri girer; okuma sesi
 * cihaza özel olduğu için girmez.
 */
/** Paylaşılan adresin açacağı oyun. */
export type SharedMode = Settings['tab'];

export interface SharedGame {
  mode: SharedMode;
  settings: Settings;
}

interface Shared {
  v: 1;
  mode: SharedMode;
  sound: SoundMode;
  // Hece Birleştir
  tables?: number[];
  /** Eski adresler: tablo kelimeleri kapalıysa false. */
  useTable?: boolean;
  words?: string[];
  proper?: boolean;
  distractors?: number;
  showWord?: boolean;
  oneColor?: boolean;
  roundSize?: number;
  // Heceleri Bul (kelimeler Hece Birleştir ayarlarından)
  sortSize?: number;
  // Cümle Okuyorum
  /** Eski adresler: hazır cümleler (o zaman yalnız ANETİL) açık mı. */
  sentBuiltIn?: boolean;
  sentSets?: string[];
  sentences?: string[];
  creatures?: number;
}

function pack(s: Settings, mode: SharedMode): Shared {
  const base = { v: 1 as const, mode, sound: s.sound };
  if (mode === 'sentence') {
    return { ...base, sentSets: s.sentSets, sentences: mySentences(s), creatures: s.creatures };
  }
  return {
    ...base,
    tables: s.tables,
    words: myWords(s).map((w) => w.syllables.join('-')),
    proper: s.proper,
    distractors: s.distractors,
    showWord: s.showWord,
    oneColor: s.oneColor,
    roundSize: s.roundSize,
    ...(mode === 'sort' ? { sortSize: s.sortSize } : {}),
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

/** `mode` verilmezse menüde açık bölüm. */
export const encodeShared = (s: Settings, mode: SharedMode = s.tab) => toBase64Url(JSON.stringify(pack(s, mode)));

/** Paylaşılan oyunun adresi; öğretmen sayfasının yanındaki play.html. */
export function shareUrl(s: Settings, from = location.href, mode: SharedMode = s.tab): string {
  const url = new URL('play.html', from);
  url.search = '';
  url.searchParams.set('data', encodeShared(s, mode));
  return url.toString();
}

const strings = (x: unknown): x is string[] => Array.isArray(x) && x.every((v) => typeof v === 'string');
const bool = (x: unknown, d: boolean) => (typeof x === 'boolean' ? x : d);
const int = (x: unknown, d: number, min: number, max: number) =>
  Number.isInteger(x) && (x as number) >= min && (x as number) <= max ? (x as number) : d;

/** Adresteki veriyi oyuna ve ayarlarına çevirir; bozuksa null. */
export function decodeShared(data: string): SharedGame | null {
  let raw: Partial<Shared>;
  try {
    raw = JSON.parse(fromBase64Url(data));
  } catch {
    return null;
  }
  if (!raw || raw.v !== 1 || (raw.mode !== 'syllable' && raw.mode !== 'sentence' && raw.mode !== 'sort')) return null;
  const mode = raw.mode;

  const tables = Array.isArray(raw.tables)
    ? raw.tables.filter((n) => Number.isInteger(n) && n >= 0 && n < ALL_TABLES.length)
    : [];
  const words = strings(raw.words) ? raw.words : [];
  const sentences = strings(raw.sentences) ? raw.sentences : [];
  // Eski adreslerde tablo kelimeleri kapatılabiliyordu.
  const chosen = bool(raw.useTable, true) ? tables : [];
  // Eski adreslerde fiş listesi yok: hazır cümleler açıksa yalnız ANETİL vardı.
  const sets = Array.isArray(raw.sentSets) ? validSentenceSets(raw.sentSets) : bool(raw.sentBuiltIn, true) ? ['ANETİL'] : [];
  const settings: Settings = {
    ...DEFAULTS,
    tab: mode,
    sound: raw.sound === 'effects' || raw.sound === 'off' ? raw.sound : 'on',
    tables: chosen.length || words.length ? chosen : DEFAULTS.tables,
    customWords: words.join(' '),
    proper: bool(raw.proper, DEFAULTS.proper),
    distractors: int(raw.distractors, DEFAULTS.distractors, 0, 4),
    showWord: bool(raw.showWord, DEFAULTS.showWord),
    oneColor: bool(raw.oneColor, DEFAULTS.oneColor),
    roundSize: int(raw.roundSize, DEFAULTS.roundSize, 1, 50),
    sentSets: sets.length || sentences.length ? sets : ['ANETİL'],
    customSentences: sentences.join('\n'),
    creatures: int(raw.creatures, DEFAULTS.creatures, 1, 8),
    sortSize: sortSize(int(raw.sortSize, DEFAULTS.sortSize, 2, 6)),
  };
  return { mode, settings };
}
