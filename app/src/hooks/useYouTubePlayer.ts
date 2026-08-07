import { useEffect, useRef, useState, type RefObject } from "react";

type YTPlayerInstance = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setPlaybackRate: (suggestedRate: number) => void;
  unloadModule: (moduleName: string) => void;
  destroy: () => void;
};

type YTStateChangeEvent = { data: number; target: YTPlayerInstance };

interface YTNamespace {
  Player: new (
    el: HTMLElement,
    options: {
      videoId: string;
      playerVars: Record<string, number>;
      events: {
        onReady?: (e: { target: YTPlayerInstance }) => void;
        onStateChange?: (e: YTStateChangeEvent) => void;
        onApiChange?: (e: { target: YTPlayerInstance }) => void;
      };
    }
  ) => YTPlayerInstance;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiLoadPromise: Promise<YTNamespace> | null = null;

/** Loads the YouTube IFrame API script once per page load; later calls reuse the same promise/instance. */
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiLoadPromise) return apiLoadPromise;

  apiLoadPromise = new Promise((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve(window.YT!);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return apiLoadPromise;
}

export interface YouTubePlayerController {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setPlaybackRate: (rate: number) => void;
}

interface YouTubePlayerHandlers {
  onTimeUpdate: (seconds: number) => void;
  onLoadedMetadata: (duration: number) => void;
  onEnded: () => void;
}

/**
 * Drives a YouTube-hosted video through the IFrame API with the same play/pause/seek/currentTime
 * primitives Player.tsx already uses for native <video>, so the rest of the player (progress bar,
 * subtitle sync, practice-speaking pause) doesn't need to know which source it's talking to. The
 * IFrame API has no `timeupdate` event, so current time is polled while the video is playing.
 */
export function useYouTubePlayer(
  containerRef: RefObject<HTMLDivElement | null>,
  videoId: string | undefined,
  handlers: YouTubePlayerHandlers
): { controller: YouTubePlayerController | null } {
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!videoId || !containerRef.current) return;
    let cancelled = false;
    setIsReady(false);

    loadYouTubeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;
      new YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          fs: 0,
          iv_load_policy: 3,
          // Suppresses YouTube's own (auto-generated or forced) captions - the app
          // already renders its own bilingual subtitle overlay from the story's .srt files.
          cc_load_policy: 0,
        },
        events: {
          onReady: (e) => {
            if (cancelled) return;
            playerRef.current = e.target;
            handlersRef.current.onLoadedMetadata(e.target.getDuration());
            setIsReady(true);
          },
          onStateChange: (e) => {
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            if (e.data === YT.PlayerState.PLAYING) {
              pollRef.current = setInterval(() => {
                handlersRef.current.onTimeUpdate(e.target.getCurrentTime());
              }, 250);
            } else if (e.data === YT.PlayerState.ENDED) {
              handlersRef.current.onEnded();
            }
          },
          // `cc_load_policy: 0` is silently ignored when the viewer has "always show
          // captions" turned on in their own YouTube/browser settings - unloading the
          // captions module once it's available is the only reliable way to force it off.
          onApiChange: (e) => {
            e.target.unloadModule("captions");
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const controller: YouTubePlayerController | null = isReady
    ? {
        play: () => playerRef.current?.playVideo(),
        pause: () => playerRef.current?.pauseVideo(),
        seekTo: (seconds: number) => playerRef.current?.seekTo(seconds, true),
        setPlaybackRate: (rate: number) => playerRef.current?.setPlaybackRate(rate),
      }
    : null;

  return { controller };
}
