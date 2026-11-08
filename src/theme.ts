import { Container, Text, type TextStyleOptions } from 'pixi.js';

/** Sanal sahne boyutu; ekrana orantılı ölçeklenir. */
export const W = 1920;
export const H = 1080;

/** Çocuk yazısına yakın, tek katlı a ve g; Türkçe harflerin hepsi var. */
export const FONT = 'Comfortaa';

export const C = {
  bg: 0xfdf6e3,
  ink: 0x1f2a44,
  muted: 0x8a8170,
  white: 0xffffff,
  line: 0xd8ccb0,
  blue: 0x1e4fbf,
  teal: 0x0a9a9a,
  purple: 0x9b1fb0,
  red: 0xb3121b,
  orange: 0xe07b00,
  green: 0x2e9e44,
  yellow: 0xf5b700,
};

/** Çalışma kağıtlarındaki sütun renkleri. */
export const CARD_COLORS = [C.blue, C.teal, C.purple, C.red, C.orange];
export const GROUP_COLORS = [C.blue, C.teal, C.purple, C.red, C.orange];

export function darken(color: number, f = 0.75): number {
  const r = Math.round(((color >> 16) & 255) * f);
  const g = Math.round(((color >> 8) & 255) * f);
  const b = Math.round((color & 255) * f);
  return (r << 16) | (g << 8) | b;
}

/** İki rengin karışımı: t=0 → a, t=1 → b. */
export function mix(a: number, b: number, t: number): number {
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

let textResolution = 1;

/** Sahne büyütüldüğünde yazılar bulanık olmasın diye çözünürlüğü günceller. */
export function setTextResolution(res: number, root: Container) {
  textResolution = res;
  const walk = (c: Container) => {
    if (c instanceof Text) c.resolution = res;
    c.children.forEach((ch) => walk(ch as Container));
  };
  walk(root);
}

export function label(
  text: string,
  size: number,
  color: number = C.ink,
  style: Partial<TextStyleOptions> = {},
): Text {
  const t = new Text({
    text,
    resolution: textResolution,
    style: { fontFamily: FONT, fontSize: size, fill: color, fontWeight: '700', align: 'center', ...style },
  });
  t.anchor.set(0.5);
  return t;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
