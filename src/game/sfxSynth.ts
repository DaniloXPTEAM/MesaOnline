/**
 * Efeitos curtos do soundboard gerados no navegador (Web Audio): funcionam sem
 * nenhum arquivo de som e sem internet. Cada efeito é um pequeno "instrumento".
 */
export const SYNTH_SFX = [
  { id: "plim", label: "Plim" },
  { id: "espada", label: "Espada" },
  { id: "porta", label: "Porta abrindo" },
  { id: "impacto", label: "Impacto" },
  { id: "magia", label: "Magia" },
  { id: "moedas", label: "Moedas" },
] as const;

export type SynthId = typeof SYNTH_SFX[number]["id"];

export const SYNTH_PREFIX = "synth:";

export function synthIdFromUrl(url: string): SynthId | null {
  if (!url.startsWith(SYNTH_PREFIX)) return null;
  const id = url.slice(SYNTH_PREFIX.length);
  return SYNTH_SFX.some((entry) => entry.id === id) ? id as SynthId : null;
}

let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!context) context = new Ctor();
  if (context.state === "suspended") void context.resume();
  return context;
}

function tone(ctx: AudioContext, out: AudioNode, options: { type: OscillatorType; from: number; to?: number; start?: number; length: number; gain: number }) {
  const start = ctx.currentTime + (options.start || 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = options.type;
  osc.frequency.setValueAtTime(options.from, start);
  if (options.to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, options.to), start + options.length);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(options.gain, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + options.length);
  osc.connect(gain).connect(out);
  osc.start(start);
  osc.stop(start + options.length + 0.05);
}

function noise(ctx: AudioContext, out: AudioNode, options: { start?: number; length: number; gain: number; filter?: { type: BiquadFilterType; frequency: number } }) {
  const start = ctx.currentTime + (options.start || 0);
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * options.length), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(options.gain, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + options.length);
  let node: AudioNode = source;
  if (options.filter) {
    const filter = ctx.createBiquadFilter();
    filter.type = options.filter.type;
    filter.frequency.value = options.filter.frequency;
    source.connect(filter);
    node = filter;
  }
  node.connect(gain).connect(out);
  source.start(start);
}

const RECIPES: Record<SynthId, (ctx: AudioContext, out: AudioNode) => void> = {
  // sino curto e cristalino
  plim(ctx, out) {
    tone(ctx, out, { type: "sine", from: 1568, length: 0.9, gain: 0.5 });
    tone(ctx, out, { type: "sine", from: 2352, length: 0.55, gain: 0.22 });
  },
  // choque de lâminas: ruído agudo + parciais metálicos
  espada(ctx, out) {
    noise(ctx, out, { length: 0.18, gain: 0.5, filter: { type: "highpass", frequency: 3200 } });
    tone(ctx, out, { type: "square", from: 2650, to: 2400, length: 0.5, gain: 0.12 });
    tone(ctx, out, { type: "triangle", from: 3960, to: 3700, length: 0.45, gain: 0.14 });
    tone(ctx, out, { type: "sine", from: 1320, length: 0.6, gain: 0.16 });
  },
  // rangido de dobradiça, subindo e descendo
  porta(ctx, out) {
    const start = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(85, start);
    osc.frequency.linearRampToValueAtTime(190, start + 0.55);
    osc.frequency.linearRampToValueAtTime(120, start + 1.0);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(520, start);
    filter.frequency.linearRampToValueAtTime(1100, start + 0.6);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.28, start + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.05);
    osc.connect(filter).connect(gain).connect(out);
    osc.start(start);
    osc.stop(start + 1.1);
  },
  // pancada grave
  impacto(ctx, out) {
    tone(ctx, out, { type: "sine", from: 150, to: 38, length: 0.45, gain: 0.9 });
    noise(ctx, out, { length: 0.14, gain: 0.45, filter: { type: "lowpass", frequency: 900 } });
  },
  // arpejo brilhante
  magia(ctx, out) {
    [880, 1108, 1318, 1760, 2217].forEach((frequency, index) => tone(ctx, out, { type: "sine", from: frequency, length: 0.5, start: index * 0.07, gain: 0.3 }));
  },
  // moedas caindo: tinidos rápidos e desencontrados
  moedas(ctx, out) {
    [0, 0.06, 0.13, 0.19, 0.27].forEach((start, index) => tone(ctx, out, { type: "triangle", from: 2100 + index * 260, length: 0.22, start, gain: 0.22 }));
  },
};

/** Toca um efeito gerado. Sem suporte de áudio no ambiente, não faz nada. */
export function playSynth(id: SynthId, volume = 0.7): void {
  const ctx = audioContext();
  if (!ctx) return;
  try {
    const master = ctx.createGain();
    master.gain.value = Math.max(0, Math.min(1, volume));
    master.connect(ctx.destination);
    RECIPES[id](ctx, master);
  } catch { /* silencioso */ }
}
