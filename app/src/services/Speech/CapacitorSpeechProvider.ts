import { SpeechRecognition } from "@capacitor-community/speech-recognition";
import type { PronunciationResult } from "@/types";
import { scorePronunciation } from "./scoring";
import type { SpeechProvider, SpeechRecognitionResult } from "./types";

/**
 * Native recognition on Android/iOS via Capacitor. Falls back to whatever the
 * platform reports through `available()`.
 */
export class CapacitorSpeechProvider implements SpeechProvider {
  private latestTranscript = "";
  private listening = false;

  get isSupported(): boolean {
    return true;
  }

  async start(lang: string): Promise<void> {
    const { available } = await SpeechRecognition.available();
    if (!available) throw new Error("Speech recognition not supported");

    const perms = await SpeechRecognition.checkPermissions();
    if (perms.speechRecognition !== "granted") {
      const requested = await SpeechRecognition.requestPermissions();
      if (requested.speechRecognition !== "granted") {
        throw new Error("Microphone permission denied");
      }
    }

    this.latestTranscript = "";
    await SpeechRecognition.removeAllListeners();
    await SpeechRecognition.addListener("partialResults", (data) => {
      if (data.matches?.length) this.latestTranscript = data.matches[0];
    });

    this.listening = true;
    await SpeechRecognition.start({
      language: lang,
      partialResults: true,
      popup: false,
    });
  }

  async stop(): Promise<SpeechRecognitionResult> {
    if (this.listening) {
      await SpeechRecognition.stop();
      this.listening = false;
    }
    await SpeechRecognition.removeAllListeners();
    return { transcript: this.latestTranscript };
  }

  async cancel(): Promise<void> {
    if (this.listening) {
      await SpeechRecognition.stop();
      this.listening = false;
    }
    await SpeechRecognition.removeAllListeners();
  }

  score(expectedText: string, result: SpeechRecognitionResult): PronunciationResult {
    return scorePronunciation(expectedText, result.transcript);
  }
}
