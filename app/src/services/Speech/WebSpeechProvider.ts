import type { PronunciationResult } from "@/types";
import { scorePronunciation } from "./scoring";
import type { SpeechProvider, SpeechRecognitionResult } from "./types";

function getRecognitionCtor(): { new (): SpeechRecognition } | undefined {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

/**
 * Browser-based recognition via the Web Speech API. Used on web and as the
 * fallback when a native plugin isn't available.
 */
export class WebSpeechProvider implements SpeechProvider {
  private recognition: SpeechRecognition | null = null;
  private finalTranscript = "";

  get isSupported(): boolean {
    return !!getRecognitionCtor();
  }

  start(lang: string): Promise<void> {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return Promise.reject(new Error("Speech recognition not supported"));

    this.finalTranscript = "";
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript + " ";
      }
      this.finalTranscript = text.trim();
    };

    this.recognition = recognition;

    return new Promise((resolve, reject) => {
      recognition.onstart = () => resolve();
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === "no-speech" || event.error === "aborted") {
          resolve();
          return;
        }
        reject(new Error(event.error));
      };
      recognition.start();
    });
  }

  stop(): Promise<SpeechRecognitionResult> {
    const recognition = this.recognition;
    if (!recognition) return Promise.resolve({ transcript: "" });

    return new Promise((resolve) => {
      // `onend` can fail to fire if recognition never truly started (no mic,
      // blocked network speech backend, etc.) - never let a child get stuck.
      const settle = () => resolve({ transcript: this.finalTranscript });
      const fallback = setTimeout(settle, 1500);
      recognition.onend = () => {
        clearTimeout(fallback);
        settle();
      };
      try {
        recognition.stop();
      } catch {
        clearTimeout(fallback);
        settle();
      }
    });
  }

  async cancel(): Promise<void> {
    this.recognition?.abort();
    this.recognition = null;
  }

  score(expectedText: string, result: SpeechRecognitionResult): PronunciationResult {
    return scorePronunciation(expectedText, result.transcript);
  }
}
