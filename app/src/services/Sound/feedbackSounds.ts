import { getSharedAudioContext, primeSharedAudioContext } from "./audioContext";

/** Unlocks audio for the whole practice flow - call from a button tap. */
export const primeAudio = primeSharedAudioContext;

/** Module-level sound-effects preference, set from the active child's settings (see
 * Settings.tsx / useSettingsStore) - Player.tsx keeps this in sync on mount and whenever
 * the setting changes, so these play* calls don't need a settings param threaded through. */
let soundConfig = { enabled: true, volume: 1 };

export function configureFeedbackSounds(config: { enabled: boolean; volume: number }): void {
  soundConfig = config;
}

function ensureRunning(audioCtx: AudioContext): void {
  if (audioCtx.state === "suspended") void audioCtx.resume();
}

function playTone(
  audioCtx: AudioContext,
  start: number,
  freq: number,
  duration: number,
  peakGain: number,
  type: OscillatorType = "sine"
): void {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peakGain, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(start);
  osc.stop(start + duration);
}

/** Short bell "ting" cue played once the mic starts listening. */
export function playReadyChime(): void {
  if (!soundConfig.enabled) return;
  try {
    const audioCtx = getSharedAudioContext();
    if (!audioCtx) return;
    ensureRunning(audioCtx);

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1318.5, now); // E6
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.09); // bright upward slide to A6

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.28 * soundConfig.volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  } catch {
    // Web Audio unavailable - the chime just won't play.
  }
}

/** Cheerful clap-like bursts + a rising fanfare, played when the child passes. */
export function playSuccessCheer(): void {
  if (!soundConfig.enabled) return;
  try {
    const audioCtx = getSharedAudioContext();
    if (!audioCtx) return;
    ensureRunning(audioCtx);

    const now = audioCtx.currentTime;

    // Filtered noise bursts to suggest a few quick claps.
    const clapOffsets = [0, 0.09, 0.17, 0.24];
    clapOffsets.forEach((offset, i) => {
      const duration = 0.08;
      const bufferSize = Math.floor(audioCtx.sampleRate * duration);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = (Math.random() * 2 - 1) * (1 - j / bufferSize);
      }

      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1800 + i * 200;
      filter.Q.value = 0.8;
      const gain = audioCtx.createGain();
      const start = now + offset;
      gain.gain.setValueAtTime(0.5 * soundConfig.volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start(start);
      noise.stop(start + duration);
    });

    // Rising major arpeggio on top - reads as "ta-da!".
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      playTone(audioCtx, now + 0.15 + i * 0.09, freq, 0.35, 0.22 * soundConfig.volume, "triangle");
    });
  } catch {
    // Web Audio unavailable - the cheer just won't play.
  }
}

/** Gentle two-note dip played when the child's attempt doesn't pass. */
export function playTryAgainCue(): void {
  if (!soundConfig.enabled) return;
  try {
    const audioCtx = getSharedAudioContext();
    if (!audioCtx) return;
    ensureRunning(audioCtx);

    const now = audioCtx.currentTime;
    const notes = [440, 349.23]; // A4 -> F4, soft descending "aw"
    notes.forEach((freq, i) => {
      playTone(audioCtx, now + i * 0.16, freq, 0.3, 0.2 * soundConfig.volume, "sine");
    });
  } catch {
    // Web Audio unavailable - the cue just won't play.
  }
}
