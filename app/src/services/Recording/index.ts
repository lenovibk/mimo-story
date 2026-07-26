import { Capacitor } from "@capacitor/core";
import { CapacitorAudioRecorder } from "./CapacitorAudioRecorder";
import { WebAudioRecorder } from "./WebAudioRecorder";
import type { AudioRecorder } from "./types";

let cached: AudioRecorder | null = null;

/** Single entry point for the rest of the app - swaps the capture backend by platform. */
export function getAudioRecorder(): AudioRecorder {
  if (cached) return cached;
  cached = Capacitor.isNativePlatform() ? new CapacitorAudioRecorder() : new WebAudioRecorder();
  return cached;
}

export type { AudioRecorder, AudioRecording } from "./types";
