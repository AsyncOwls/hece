import { lowerTr } from './data/syllabify';

let ctx: AudioContext | null = null;

function audio(): AudioContext {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, at: number, dur: number, type: OscillatorType = 'sine', gain = 0.18) {
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

let voice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = speechSynthesis.getVoices();
  voice = voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith('tr')) ?? null;
}

if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener('voiceschanged', pickVoice);
}

export const canSpeak = () => voice !== null;

export function speak(text: string, rate = 0.8) {
  if (!voice) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(lowerTr(text));
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = rate;
  speechSynthesis.speak(u);
}
