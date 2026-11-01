import type { SoundMode } from './audio';

export interface Settings {
  /** Menüde açık bölüm. */
  tab: 'syllable' | 'sentence';
  /** Seçili tablolar (ALL_TABLES sırası); farklı ses gruplarından karışık olabilir. */
  tables: number[];
  /** Harf tablosunun kelimeleri kullanılsın. */
  useTable: boolean;
  /** Öğretmenin kendi kelimeleri kullanılsın. */
  useMine: boolean;
  /** Öğretmenin yazdığı kelimeler, olduğu gibi (bkz. parseCustomWords). */
  customWords: string;
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
  /** Cümle Okuyorum: öğretmenin kendi cümleleri kullanılsın. */
  sentMine: boolean;
  /** Öğretmenin cümleleri, her satırda bir tane. */
  customSentences: string;
  /** Cümle Okuyorum'da akvaryumdaki balık sayısı. */
  creatures: number;
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
  proper: true,
  distractors: 2,
  showWord: false,
  oneColor: false,
  roundSize: 10,
  sentBuiltIn: true,
  sentMine: false,
  customSentences: '',
  creatures: 6,
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
    return { ...DEFAULTS, ...saved };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
