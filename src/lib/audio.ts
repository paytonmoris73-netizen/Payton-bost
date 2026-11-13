/**
 * Short synthesized cues for the workout player. No audio files, no network —
 * just a shared WebAudio context created lazily on first user gesture.
 */

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx ??= new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, duration: number, gain: number, when = 0) {
  const ac = context();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export const cues = {
  /** Called once on the first gesture so later cues are allowed to play. */
  unlock() {
    context();
  },
  /** Last three seconds of a phase. */
  tick() {
    tone(660, 0.1, 0.08);
  },
  /** A work interval begins. */
  go() {
    tone(880, 0.16, 0.12);
    tone(1320, 0.18, 0.08, 0.1);
  },
  /** A rest interval begins. */
  rest() {
    tone(520, 0.2, 0.09);
  },
  /** The whole workout is finished. */
  finish() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.4, 0.1, i * 0.11));
  },
};
