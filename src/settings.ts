export interface Settings {
  /** ALL_TABLES içindeki seçili tablo. */
  table: number;
  /** Önceki tabloların kelimelerini de kat. */
  cumulative: boolean;
  /** Özel isimleri (Ali, Lale…) dahil et. */
  proper: boolean;
  /** Kelime Kur'da doğru hecelere eklenen fazladan hece sayısı. */
  distractors: number;
  /** Hedef kelime yazılı olarak gösterilsin mi (yoksa sesli/öğretmen söyler). */
  showWord: boolean;
  /** Bir turdaki kelime sayısı. */
  roundSize: number;
}

const KEY = 'hece.settings.v1';

const DEFAULTS: Settings = {
  table: 0,
  cumulative: false,
  proper: true,
  distractors: 2,
  showWord: false,
  roundSize: 10,
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
