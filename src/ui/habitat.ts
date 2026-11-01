import type { Container, Graphics } from 'pixi.js';
import { mix } from '../theme';

/** Dokununca cümle veren hayvan (balık). */
export interface Creature extends Container {
  /** Dokunulunca oynar (kabarcık, hızlanma…). */
  react(): void;
}

/** Bir "Cümle Okuyorum" sahnesinin resmi ve içindeki hayvanlar. */
export interface Habitat {
  /** Hayvanların arkasında kalan resim. */
  back: Container;
  /** Hayvanların önünde kalan parçalar (cam parlaması…); dokunulmaz. */
  front: Container;
  /** Resme en çok kaç hayvan sığar. */
  max: number;
  /** n tane hayvanı yerleştirip döner. */
  spawn(n: number): Creature[];
}

/** y0..y1 arasında yukarıdan aşağı renk geçişi (bantlarla). */
export function gradient(g: Graphics, x: number, y0: number, w: number, y1: number, top: number, bottom: number, bands = 40) {
  const h = (y1 - y0) / bands;
  for (let i = 0; i < bands; i++) g.rect(x, y0 + i * h, w, h + 1).fill(mix(top, bottom, i / (bands - 1)));
}

export const rand = (a: number, b: number) => a + Math.random() * (b - a);
