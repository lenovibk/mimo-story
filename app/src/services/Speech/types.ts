import type { PronunciationResult } from "@/types";

export interface SpeechRecognitionResult {
  transcript: string;
}

/**
 * Abstraction so the recognition backend can be swapped (Web Speech API today,
 * Azure/Google/OpenAI later) without touching the practice-speaking UI.
 */
export interface SpeechProvider {
  readonly isSupported: boolean;
  start(lang: string): Promise<void>;
  stop(): Promise<SpeechRecognitionResult>;
  cancel(): Promise<void>;
  score(expectedText: string, result: SpeechRecognitionResult): PronunciationResult;
}
