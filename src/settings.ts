import type { SoundMode } from './audio';

export interface Settings {
  /** ALL_TABLES içindeki seçili tablo. */
  table: number;
  /** Harf tablosunun kelimeleri kullanılsın. */
  useTable: boolean;
  /** Öğretmenin kendi kelimeleri kullanılsın. */
  useMine: boolean;
  /** Öğretmenin yazdığı kelimeler, olduğu gibi (bkz. parseCustomWords). */
  customWords: string;
  /** Önceki tabloların kelimelerini de kat. */
  cumulative: boolean;
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
  sound: SoundMode;
  /** Seçilen okuma sesinin adı; boşsa en iyi Türkçe ses. */
  voice: string;
}

const KEY = 'hece.settings.v1';

const DEFAULTS: Settings = {
  table: 0,
  useTable: true,
  useMine: false,
  customWords: '',
  cumulative: false,
  proper: true,
  distractors: 2,
  showWord: false,
  oneColor: false,
  roundSize: 10,
  sound: 'on',
  voice: '',
};

export function loadSettings(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
