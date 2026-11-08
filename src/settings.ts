import type { SoundMode } from './audio';
import { parseCustomWords } from './data/custom';
import { validSentenceSets } from './data/sentences';
import { lowerTr } from './data/syllabify';

export interface Settings {
  /** Menüde açık bölüm. */
  tab: 'syllable' | 'sentence' | 'sort';
  /** Seçili tablolar (ALL_TABLES sırası); farklı ses gruplarından karışık olabilir, boş da olabilir. */
  tables: number[];
  /** Öğretmenin kayıtlı kelimeleri (bkz. parseCustomWords). */
  customWords: string;
  /** Kayıtlı ama seçili olmayan kelimeler (küçük harfli). */
  wordsOff: string[];
  /** Özel isimleri (Ali, Lale…) dahil et. */
  proper: boolean;
  /** Doğru hecelere eklenen fazladan hece sayısı. */
  distractors: number;
  /** Hedef kelime yazılı olarak gösterilsin mi (yoksa sesli/öğretmen söyler). */
  showWord: boolean;
  /** Heceler tek renk (koyu) mu, yoksa her biri ayrı renkte mi. */
  oneColor: boolean;
  /** Bir turdaki kelime sayısı. */
  roundSize: number;
  /** Cümle Okuyorum: seçili hazır cümle grupları (SENTENCE_SETS adları: 'ANETİL', 'OKURIM'); boş olabilir. */
  sentSets: string[];
  /** Öğretmenin kayıtlı cümleleri, her satırda bir tane. */
  customSentences: string;
  /** Kayıtlı ama seçili olmayan cümleler (küçük harfli). */
  sentOff: string[];
  /** Cümle Okuyorum'da akvaryumdaki balık sayısı. */
  creatures: number;
  /** Hece Sort tahtasının boyutu (n×n; 2, 4 ya da 6). */
  sortSize: number;
  sound: SoundMode;
  /** Seçilen okuma sesinin adı; boşsa en iyi Türkçe ses. */
  voice: string;
}

const KEY = 'hece.settings.v1';

export const DEFAULTS: Settings = {
  tab: 'syllable',
  tables: [0],
  customWords: '',
  wordsOff: [],
  proper: true,
  distractors: 2,
  showWord: false,
  oneColor: false,
  roundSize: 10,
  sentSets: validSentenceSets(undefined),
  customSentences: '',
  sentOff: [],
  creatures: 6,
  sortSize: 4,
  sound: 'on',
  voice: '',
};

export function loadSettings(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    // Eski sürüm tek tablo + "önceki tablolar da" saklıyordu.
    if (!Array.isArray(saved.tables) && typeof saved.table === 'number') {
      const n: number = saved.table;
      saved.tables = saved.cumulative ? Array.from({ length: n + 1 }, (_, i) => i) : [n];
    }
    delete saved.table;
    delete saved.cumulative;
    // Eski sürümlerde kartların onay kutuları vardı: kapalı kaynak artık seçimsiz olarak taşınır.
    if (saved.useTable === false) saved.tables = [];
    if (saved.useMine === false && typeof saved.customWords === 'string') {
      saved.wordsOff = parseCustomWords(saved.customWords).words.map((w) => lowerTr(w.text));
    }
    delete saved.useTable;
    delete saved.useMine;
    const s: Settings = { ...DEFAULTS, ...saved };
    s.sentSets = validSentenceSets(s.sentSets);
    // Eski sürümler: hazır/benim cümleleri kartları ve grup sekmesi.
    delete (s as unknown as Record<string, unknown>).sentBuiltIn;
    delete (s as unknown as Record<string, unknown>).sentGroup;
    delete (s as unknown as Record<string, unknown>).sentMine;
    return s;
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
