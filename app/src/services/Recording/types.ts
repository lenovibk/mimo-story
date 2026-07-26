export interface AudioRecording {
  url: string;
  mimeType: string;
}

/**
 * Abstraction over platform audio capture, kept separate from SpeechProvider
 * since recognition (transcript) and recording (playback) are independent
 * concerns with different native backends.
 */
export interface AudioRecorder {
  readonly isSupported: boolean;
  start(): Promise<void>;
  stop(): Promise<AudioRecording | null>;
  cancel(): Promise<void>;
  /** Live mic stream while recording, for a reactive visualizer. Web only. */
  getStream?(): MediaStream | null;
}
