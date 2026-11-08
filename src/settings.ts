import type { SoundMode } from './audio';
import { validSentenceSets } from './data/sentences';

export interface Settings {
  /** Menüde açık bölüm. */
  tab: 'syllable' | 'sentence' | 'sort';
  /** Seçili tablolar (ALL_TABLES sırası); farklı ses gruplarından karışık olabilir. */
  tables: number[];
  /** Harf tablosunun kelimeleri kullanılsın. */
  useTable: boolean;
  /** Öğretmenin kendi kelimeleri kullanılsın. */
  useMine: boolean;
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
  /** Cümle Okuyorum: seçili harflerle okunabilen hazır cümleler kullanılsın. */
  sentBuiltIn: boolean;
  /** Cümle Okuyorum: seçili hazır fişler (SENTENCE_SETS adları, ör. 'ANETİL', 'O'). */
  sentSets: string[];
  /** Cümle Okuyorum: öğretmenin kendi cümleleri kullanılsın. */
  sentMine: boolean;
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
  useTable: true,
  useMine: false,
  customWords: '',
  wordsOff: [],
  proper: true,
  distractors: 2,
  showWord: false,
  oneColor: false,
  roundSize: 10,
  sentBuiltIn: true,
  sentSets: ['ANETİL'],
  sentMine: false,
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
    const s: Settings = { ...DEFAULTS, ...saved };
    s.sentSets = validSentenceSets(s.sentSets);
    return s;
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
