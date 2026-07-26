type AudioContextCtor = typeof AudioContext;

let ctx: AudioContext | null = null;

function resolveCtor(): AudioContextCtor | undefined {
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext
  );
}

/** Lazily creates (or returns) the app's single shared AudioContext. */
export function getSharedAudioContext(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = resolveCtor();
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

/**
 * Unlocks the shared context - call from inside a user-gesture handler
 * (button tap). Mobile browsers (iOS Safari especially) suspend any
 * AudioContext created/resumed outside a gesture, which silences both sound
 * effects and the recording visualizer's analyser.
 */
export function primeSharedAudioContext(): void {
  try {
    const audioCtx = getSharedAudioContext();
    if (audioCtx?.state === "suspended") void audioCtx.resume();
  } catch {
    // Web Audio unavailable - callers degrade gracefully on their own.
  }
}
