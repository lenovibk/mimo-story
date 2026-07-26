type AudioContextCtor = typeof AudioContext;

let ctx: AudioContext | null = null;

function ensureContext(): AudioContext | null {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

/**
 * Unlocks the shared audio context - call this from inside the user-gesture
 * handler that starts practice (button tap), so the later chime isn't
 * silently suspended by the browser's autoplay policy.
 */
export function primeChimeAudio(): void {
  try {
    const audioCtx = ensureContext();
    if (audioCtx?.state === "suspended") void audioCtx.resume();
  } catch {
    // Web Audio unavailable - the chime just won't play.
  }
}

/** Short bell "ting" cue played once the mic starts listening. */
export function playReadyChime(): void {
  try {
    const audioCtx = ensureContext();
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") void audioCtx.resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1318.5, now); // E6
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.09); // bright upward slide to A6

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  } catch {
    // Web Audio unavailable - the chime just won't play.
  }
}
