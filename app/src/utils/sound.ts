// Tiny synthesized UI sounds (no audio assets needed). Kept soft per PRD ("no harsh sounds").
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function blip(freqStart: number, freqEnd: number, duration: number, peakGain: number) {
  const audio = getCtx();
  if (!audio) return;
  const t = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freqStart, t);
  osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration * 0.7);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peakGain, t + duration * 0.15);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

let lastTickAt = 0;

/** Light "tick" as a new card snaps into focus while scrolling the story rail. */
export function playTick() {
  const now = performance.now();
  if (now - lastTickAt < 60) return; // avoid buzzing during fast flicks
  lastTickAt = now;
  blip(720, 980, 0.09, 0.14);
}

/** Soft "whoosh" for the prev/next arrow buttons. */
export function playWhoosh(direction: 1 | -1) {
  if (direction > 0) blip(500, 780, 0.16, 0.11);
  else blip(780, 500, 0.16, 0.11);
}
