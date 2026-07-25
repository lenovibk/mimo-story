import { Capacitor } from "@capacitor/core";
import { CapacitorSpeechProvider } from "./CapacitorSpeechProvider";
import { WebSpeechProvider } from "./WebSpeechProvider";
import type { SpeechProvider } from "./types";

let cached: SpeechProvider | null = null;

/**
 * Single entry point for the rest of the app — swap the underlying engine
 * (Azure/Google/OpenAI later) by changing only this factory.
 */
export function getSpeechProvider(): SpeechProvider {
  if (cached) return cached;
  cached = Capacitor.isNativePlatform() ? new CapacitorSpeechProvider() : new WebSpeechProvider();
  return cached;
}

export type { SpeechProvider, SpeechRecognitionResult } from "./types";
