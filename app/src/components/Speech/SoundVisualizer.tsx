import { useEffect, useRef } from "react";
import { getSharedAudioContext } from "@/services/Sound/audioContext";

interface SoundVisualizerProps {
  /** Returns the live mic stream once available. Omit/return null to use the decorative fallback. */
  getStream?: () => MediaStream | null;
}

const BAR_COUNT = 5;
const BAR_COLORS = ["#FF92C2", "#FFD54A", "#5CC8FF", "#8EE28E", "#FF92C2"];
const STREAM_POLL_MS = 100;
const STREAM_POLL_ATTEMPTS = 15;

/**
 * Cute animated bars shown while the child is being recorded. Reacts to real
 * mic volume on web (via AnalyserNode on the recorder's own stream); falls
 * back to a lively procedural bounce when no live stream is available
 * (native/Capacitor, or permission not yet granted).
 *
 * Uses the app's shared AudioContext (primed from the practice-start button
 * tap) rather than creating its own - a fresh context created outside a user
 * gesture is left "suspended" by mobile browsers' autoplay policy, which
 * silently starves the analyser of data and made the visualizer look dead
 * on phones.
 */
export function SoundVisualizer({ getStream }: SoundVisualizerProps) {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    let attempts = 0;
    let source: MediaStreamAudioSourceNode | null = null;
    let analyserNode: AnalyserNode | null = null;

    const setBars = (scales: number[]) => {
      scales.forEach((scale, i) => {
        const el = barRefs.current[i];
        if (el) el.style.transform = `scaleY(${scale})`;
      });
    };

    const animateDecorative = (t: number) => {
      if (cancelled) return;
      const scales = Array.from(
        { length: BAR_COUNT },
        (_, i) => 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(t / 220 + i * 1.3))
      );
      setBars(scales);
      raf = requestAnimationFrame(animateDecorative);
    };

    const animateReactive = (analyser: AnalyserNode, freqData: Uint8Array<ArrayBuffer>) => {
      const step = () => {
        if (cancelled) return;
        analyser.getByteFrequencyData(freqData);
        const scales = Array.from({ length: BAR_COUNT }, (_, i) => {
          const value = freqData[(i * 3) % freqData.length] / 255;
          return 0.3 + value * 1.3;
        });
        setBars(scales);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const tryConnectStream = () => {
      if (cancelled) return;
      const stream = getStream?.();
      if (stream && stream.getAudioTracks().length > 0) {
        try {
          const audioCtx = getSharedAudioContext();
          if (!audioCtx) throw new Error("Web Audio unavailable");
          if (audioCtx.state === "suspended") void audioCtx.resume();

          source = audioCtx.createMediaStreamSource(stream);
          analyserNode = audioCtx.createAnalyser();
          analyserNode.fftSize = 64;
          analyserNode.smoothingTimeConstant = 0.6;
          source.connect(analyserNode);
          animateReactive(analyserNode, new Uint8Array(analyserNode.frequencyBinCount));
          return;
        } catch {
          // Fall through to the decorative animation below.
        }
      }
      if (attempts < STREAM_POLL_ATTEMPTS) {
        attempts += 1;
        setTimeout(tryConnectStream, STREAM_POLL_MS);
      } else {
        raf = requestAnimationFrame(animateDecorative);
      }
    };

    tryConnectStream();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      source?.disconnect();
      analyserNode?.disconnect();
    };
  }, [getStream]);

  return (
    <div className="flex h-16 items-end justify-center gap-2">
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <div
          key={i}
          ref={(el) => {
            barRefs.current[i] = el;
          }}
          style={{ backgroundColor: BAR_COLORS[i], transformOrigin: "bottom" }}
          className="h-16 w-3 rounded-full transition-transform duration-75 ease-out"
        />
      ))}
    </div>
  );
}
