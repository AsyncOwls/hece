import { lowerTr } from './data/syllabify';

/** on: efektler + sesli okuma, effects: yalnız efektler, off: hiç ses yok. */
export type SoundMode = 'on' | 'effects' | 'off';

let mode: SoundMode = 'on';
let preferredVoice = '';

export function configureAudio(opts: { sound: SoundMode; voice: string }) {
  mode = opts.sound;
  preferredVoice = opts.voice;
  pickVoice();
  if (mode !== 'on' && 'speechSynthesis' in window) speechSynthesis.cancel();
}

let ctx: AudioContext | null = null;

function audio(): AudioContext {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, at: number, dur: number, type: OscillatorType = 'sine', gain = 0.18) {
  if (mode === 'off') return;
  const a = audio();
  const t0 = a.currentTime + at;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  click: () => tone(660, 0, 0.08, 'triangle', 0.12),
  pick: () => tone(520, 0, 0.07, 'triangle', 0.1),
  correct: () => {
    tone(660, 0, 0.12, 'triangle');
    tone(990, 0.08, 0.18, 'triangle');
  },
  wrong: () => {
    tone(200, 0, 0.18, 'square', 0.08);
    tone(150, 0.12, 0.22, 'square', 0.08);
  },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.3, 'triangle', 0.16)),
};

// --- Sesli okuma (tarayıcının Türkçe sesi varsa) ---

/**
 * Tarayıcıların Türkçe sesleri arasında kalite farkı büyük. Adında bunlar
 * geçenler (Edge'in "Emel Online (Natural)", macOS'un "Yelda (Premium)" gibi)
 * çok daha doğal okuduğu için önce onlar seçilir.
 */
const QUALITY = [/natural/i, /neural/i, /premium/i, /enhanced|gelişmiş/i, /online/i, /google/i];
const rank = (v: SpeechSynthesisVoice) => {
  const i = QUALITY.findIndex((r) => r.test(v.name));
  return i < 0 ? QUALITY.length : i;
};

let voices: SpeechSynthesisVoice[] = [];
let voice: SpeechSynthesisVoice | null = null;
const listeners = new Set<() => void>();

function loadVoices() {
  voices = speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('tr'))
    .sort((a, b) => rank(a) - rank(b));
  pickVoice();
  listeners.forEach((f) => f());
}

function pickVoice() {
  voice = voices.find((v) => v.name === preferredVoice) ?? voices[0] ?? null;
}

if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.addEventListener('voiceschanged', loadVoices);
}

/** Kullanılabilir Türkçe sesler, en iyisi başta. */
export const turkishVoices = () => voices;
export const currentVoice = () => voice;

/** Ses listesi değişince haber verir; aboneliği bırakan fonksiyonu döner. */
export function onVoicesChanged(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

/** `force`: ses ayarı kapalı olsa bile oku (öğretmenin ses denemesi için). */
export function speak(text: string, rate = 0.8, force = false) {
  if (!voice || (mode !== 'on' && !force)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(lowerTr(text));
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = rate;
  speechSynthesis.speak(u);
}
