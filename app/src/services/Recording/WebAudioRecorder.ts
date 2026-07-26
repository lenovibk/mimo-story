import type { AudioRecorder, AudioRecording } from "./types";

/** Browser-based capture via MediaRecorder. Used on web. */
export class WebAudioRecorder implements AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: BlobPart[] = [];

  get isSupported(): boolean {
    return typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
  }

  async start(): Promise<void> {
    if (!this.isSupported) throw new Error("Audio recording not supported");

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = [];
    const recorder = new MediaRecorder(this.stream);
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };
    this.mediaRecorder = recorder;
    recorder.start();
  }

  stop(): Promise<AudioRecording | null> {
    const recorder = this.mediaRecorder;
    if (!recorder || recorder.state === "inactive") {
      this.releaseStream();
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(this.chunks, { type: mimeType });
        this.releaseStream();
        resolve(blob.size > 0 ? { url: URL.createObjectURL(blob), mimeType } : null);
      };
      recorder.stop();
    });
  }

  async cancel(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    this.releaseStream();
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  private releaseStream() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.mediaRecorder = null;
  }
}
