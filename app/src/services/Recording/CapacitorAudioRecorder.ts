import { VoiceRecorder } from "capacitor-voice-recorder";
import type { AudioRecorder, AudioRecording } from "./types";

/** Native capture on Android/iOS via capacitor-voice-recorder. */
export class CapacitorAudioRecorder implements AudioRecorder {
  private recording = false;

  get isSupported(): boolean {
    return true;
  }

  async start(): Promise<void> {
    const { value: hasPermission } = await VoiceRecorder.hasAudioRecordingPermission();
    if (!hasPermission) {
      const { value: granted } = await VoiceRecorder.requestAudioRecordingPermission();
      if (!granted) throw new Error("Microphone permission denied");
    }

    await VoiceRecorder.startRecording();
    this.recording = true;
  }

  async stop(): Promise<AudioRecording | null> {
    if (!this.recording) return null;
    this.recording = false;

    const { value } = await VoiceRecorder.stopRecording();
    if (!value.recordDataBase64) return null;
    return { url: `data:${value.mimeType};base64,${value.recordDataBase64}`, mimeType: value.mimeType };
  }

  async cancel(): Promise<void> {
    if (!this.recording) return;
    this.recording = false;
    try {
      await VoiceRecorder.stopRecording();
    } catch {
      // Already stopped/never started - nothing to clean up.
    }
  }
}
