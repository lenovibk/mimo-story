import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { CircleButton, SolidPillButton } from "@/components/Button/Button";
import { CameraPreview } from "@/components/CameraPreview/CameraPreview";
import { FloatingButtons } from "@/components/FloatingButtons/FloatingButtons";
import { IconBack, IconHome } from "@/components/Icon/Icon";
import { ProgressBar } from "@/components/ProgressBar/ProgressBar";
import { RewardPopup } from "@/components/RewardPopup/RewardPopup";
import { Countdown } from "@/components/Speech/Countdown";
import { MicIndicator } from "@/components/Speech/MicIndicator";
import { StoryEndDialog } from "@/components/StoryEndDialog/StoryEndDialog";
import { Subtitle } from "@/components/Subtitle/Subtitle";
import { getStoryById, stories } from "@/data/stories";
import { findActiveCue, findNearestCue, useSubtitles } from "@/hooks/useSubtitles";
import { getAudioRecorder } from "@/services/Recording";
import {
  playReadyChime,
  playSuccessCheer,
  playTryAgainCue,
  primeAudio,
} from "@/services/Sound/feedbackSounds";
import { getSpeechProvider } from "@/services/Speech";
import { useAppStore } from "@/store/useAppStore";
import type { PronunciationResult } from "@/types";
import { formatDuration } from "@/utils/time";

type Phase = "idle" | "countdown" | "listening" | "reward";

const LISTEN_MIN_MS = 4000;
const LISTEN_MAX_MS = 12000;
const LISTEN_BASE_MS = 2200;
const LISTEN_MS_PER_WORD = 650;
// Recognition.stop() races the STT backend's own processing of the tail end
// of speech - if the child finishes right as the timer fires, the last word
// can still get dropped from the transcript even though the mic captured it.
// Pad the window so the backend has time to settle before we force a stop.
const LISTEN_SETTLE_MS = 900;
const CONTROLS_HIDE_DELAY_MS = 3000;

/**
 * A fixed listen window cuts kids off mid-sentence for anything longer than a
 * couple of words. Scale the window with how much the child actually has to
 * say, capped so a hung mic/session can't strand them on "Listening..." forever.
 */
function getListenDuration(target: string): number {
  const wordCount = target.split(/\s+/).filter(Boolean).length;
  const estimated = LISTEN_BASE_MS + wordCount * LISTEN_MS_PER_WORD + LISTEN_SETTLE_MS;
  return Math.min(LISTEN_MAX_MS, Math.max(LISTEN_MIN_MS, estimated));
}

export function Player() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const story = id ? getStoryById(id) : undefined;
  const { en, vi, loading } = useSubtitles(story);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const finishingRef = useRef(false);
  const wasPlayingBeforeScrubRef = useRef(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(story?.duration ?? 0);
  const [isPaused, setIsPaused] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [practiceTarget, setPracticeTarget] = useState("");
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showEndDialog, setShowEndDialog] = useState(false);

  const subtitleEnOn = useAppStore((s) => s.subtitleEnOn);
  const subtitleViOn = useAppStore((s) => s.subtitleViOn);
  const shadowingOn = useAppStore((s) => s.shadowingOn);
  const autoPlayNext = useAppStore((s) => s.autoPlayNext);
  const toggleSubtitleEn = useAppStore((s) => s.toggleSubtitleEn);
  const toggleSubtitleVi = useAppStore((s) => s.toggleSubtitleVi);
  const toggleShadowing = useAppStore((s) => s.toggleShadowing);
  const toggleAutoPlayNext = useAppStore((s) => s.toggleAutoPlayNext);
  const addStars = useAppStore((s) => s.addStars);
  const setStoryProgress = useAppStore((s) => s.setStoryProgress);
  const lastProgressSaveRef = useRef(0);

  const currentEnCue = useMemo(() => findActiveCue(en, currentTime), [en, currentTime]);
  const currentViCue = useMemo(() => findActiveCue(vi, currentTime), [vi, currentTime]);

  const nextStory = useMemo(() => {
    if (!story) return undefined;
    const index = stories.findIndex((s) => s.id === story.id);
    return index >= 0 ? stories[index + 1] : undefined;
  }, [story]);

  // Video swaps in place (via autoplay-next) rather than remounting the component,
  // so the readout needs to reset explicitly instead of picking up stale state.
  useEffect(() => {
    setCurrentTime(0);
    setVideoDuration(story?.duration ?? 0);
  }, [story?.id, story?.duration]);

  useEffect(
    () => () => {
      if (listenTimerRef.current) clearTimeout(listenTimerRef.current);
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
      void getSpeechProvider().cancel();
      void getAudioRecorder().cancel();
      if (audioUrlRef.current?.startsWith("blob:")) URL.revokeObjectURL(audioUrlRef.current);
    },
    []
  );

  const scheduleHideControls = () => {
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    if (isPaused) return;
    hideControlsTimerRef.current = setTimeout(() => setControlsVisible(false), CONTROLS_HIDE_DELAY_MS);
  };

  useEffect(() => {
    scheduleHideControls();
    return () => {
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  const revealControls = () => {
    setControlsVisible(true);
    scheduleHideControls();
  };

  const hideControlsNow = () => {
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    setControlsVisible(false);
  };

  const handleScreenTap = (e: MouseEvent<HTMLDivElement>) => {
    // Taps on real controls run their own handlers - just push out the auto-hide timer.
    if ((e.target as HTMLElement).closest("button")) {
      if (controlsVisible) scheduleHideControls();
      return;
    }
    if (controlsVisible) {
      hideControlsNow();
    } else {
      revealControls();
    }
  };

  if (!story) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#F7FBFF] px-6 text-center">
        <p className="font-heading text-2xl font-bold text-slate-600">Không tìm thấy truyện</p>
        <SolidPillButton
          label="Về trang chủ"
          color="primary"
          ariaLabel="Back to home"
          onClick={() => navigate("/home")}
        />
      </div>
    );
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);

    // Persist "continue learning" progress, throttled - this fires many times a second.
    const now = Date.now();
    if (story && video.duration > 0 && now - lastProgressSaveRef.current > 3000) {
      lastProgressSaveRef.current = now;
      setStoryProgress(story.id, video.currentTime / video.duration);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setVideoDuration(videoRef.current.duration);
  };

  const handleTogglePause = () => {
    const video = videoRef.current;
    if (!video || phase !== "idle") return;
    if (video.paused) {
      void video.play();
      setIsPaused(false);
    } else {
      video.pause();
      setIsPaused(true);
    }
  };

  const handleSeek = (time: number) => {
    const video = videoRef.current;
    if (!video || phase !== "idle") return;
    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleScrubStart = () => {
    const video = videoRef.current;
    if (!video || phase !== "idle") return;
    wasPlayingBeforeScrubRef.current = !video.paused;
    video.pause();
    setIsPaused(true);
  };

  const handleScrubEnd = () => {
    const video = videoRef.current;
    if (!video || phase !== "idle") return;
    if (wasPlayingBeforeScrubRef.current) {
      void video.play();
      setIsPaused(false);
    }
  };

  const startPractice = () => {
    const video = videoRef.current;
    if (!video || phase !== "idle") return;

    const target = currentEnCue ?? findNearestCue(en, currentTime);
    if (!target) return;

    primeAudio();
    video.pause();
    setIsPaused(true);
    setPracticeTarget(target.text);
    setPhase("countdown");
  };

  const finishListening = async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    if (listenTimerRef.current) {
      clearTimeout(listenTimerRef.current);
      listenTimerRef.current = null;
    }
    const provider = getSpeechProvider();
    const recorder = getAudioRecorder();
    const [speechResult, recording] = await Promise.all([
      provider.stop(),
      recorder.stop().catch(() => null),
    ]);
    const scored = provider.score(practiceTarget, speechResult);

    if (audioUrlRef.current?.startsWith("blob:")) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = recording?.url ?? null;

    setResult({ ...scored, audioUrl: recording?.url });
    if (scored.passed) {
      addStars(10);
      playSuccessCheer();
    } else {
      playTryAgainCue();
    }
    setPhase("reward");
  };

  const handleCountdownComplete = () => {
    finishingRef.current = false;
    setPhase("listening");
    playReadyChime();
    // Arm the stop timer immediately - if start() hangs (no mic, no network
    // speech backend, etc.) the child must never be stuck on "Listening..." forever.
    // Duration scales with sentence length so short cues don't wait needlessly
    // and longer ones aren't cut off mid-sentence.
    listenTimerRef.current = setTimeout(
      () => void finishListening(),
      getListenDuration(practiceTarget)
    );
    getSpeechProvider()
      .start("en-US")
      .catch(() => {
        // No mic / permission denied - the fallback timer above still fires.
      });
    getAudioRecorder()
      .start()
      .catch(() => {
        // No mic / permission denied - scoring still works, just no playback.
      });
  };

  const handleRewardContinue = () => {
    setPhase("idle");
    setResult(null);
    setIsPaused(false);
    void videoRef.current?.play();
  };

  const handleRetry = () => {
    primeAudio();
    setResult(null);
    setPhase("countdown");
  };

  const handleVideoEnded = () => {
    if (story) setStoryProgress(story.id, 1);
    if (autoPlayNext) {
      if (nextStory) navigate(`/story/${nextStory.id}`, { replace: true });
      else navigate("/home");
      return;
    }
    if (nextStory) setShowEndDialog(true);
    else navigate("/home");
  };

  const handleContinueNext = () => {
    setShowEndDialog(false);
    if (nextStory) navigate(`/story/${nextStory.id}`, { replace: true });
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none overflow-hidden bg-black"
      onClick={handleScreenTap}
    >
      <video
        key={story.id}
        ref={videoRef}
        src={story.video}
        autoPlay
        playsInline
        disablePictureInPicture
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onContextMenu={(e) => e.preventDefault()}
        onEnded={handleVideoEnded}
        className="h-full w-full object-contain"
      />

      <div
        className={`absolute inset-x-0 top-0 z-20 flex flex-col gap-2 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
        } pt-[max(0.75rem,var(--safe-t))] pb-[max(0.75rem,var(--safe-b))] pr-[max(0.75rem,var(--safe-r))] pl-[max(0.75rem,var(--safe-l))] sm:pt-[max(1.5rem,var(--safe-t))] sm:pb-[max(1.5rem,var(--safe-b))] sm:pr-[max(1.5rem,var(--safe-r))] sm:pl-[max(1.5rem,var(--safe-l))] landscape-compact:pt-[max(0.5rem,var(--safe-t))] landscape-compact:pb-[max(0.5rem,var(--safe-b))] landscape-compact:pr-[max(0.5rem,var(--safe-r))] landscape-compact:pl-[max(0.5rem,var(--safe-l))]`}
      >
        <div className="flex items-center justify-between">
          <CircleButton
            icon={<IconBack className="h-6 w-6 sm:h-7 sm:w-7" />}
            color="white"
            size={44}
            className="sm:h-14! sm:w-14! landscape-compact:h-9! landscape-compact:w-9!"
            ariaLabel="Back to home"
            onClick={() => navigate("/home")}
          />
          <div className="mx-3 hidden min-w-0 flex-1 items-center gap-3 rounded-full bg-white px-5 py-2.5 shadow-md shadow-black/10 sm:flex">
            <span className="shrink-0 truncate font-heading text-sm font-semibold text-[#5CC8FF]">
              {`${story.title}${story.episodeLabel ? ` - ${story.episodeLabel}` : ""}`}
            </span>
            {videoDuration > 0 && (
              <>
                <ProgressBar
                  currentTime={currentTime}
                  duration={videoDuration}
                  onSeek={handleSeek}
                  onScrubStart={handleScrubStart}
                  onScrubEnd={handleScrubEnd}
                  disabled={phase !== "idle"}
                  className="min-w-0 flex-1"
                />
                <span className="shrink-0 font-heading text-xs font-medium tabular-nums text-slate-400">
                  {formatDuration(currentTime)} / {formatDuration(videoDuration)}
                </span>
              </>
            )}
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <SolidPillButton
              icon={<IconHome className="h-5 w-5" />}
              label="Home"
              color="pink"
              ariaLabel="Home"
              onClick={() => navigate("/home")}
            />
          </div>
        </div>
      </div>

      <Subtitle
        enCue={currentEnCue}
        viCue={currentViCue}
        currentTime={currentTime}
        showEn={subtitleEnOn}
        showVi={subtitleViOn}
      />

      <div
        className={`transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <FloatingButtons
          subtitleEnOn={subtitleEnOn}
          subtitleViOn={subtitleViOn}
          shadowingOn={shadowingOn}
          isPaused={isPaused}
          onToggleEn={toggleSubtitleEn}
          onToggleVi={toggleSubtitleVi}
          onToggleShadowing={toggleShadowing}
          onTogglePause={handleTogglePause}
          onPracticeSpeaking={startPractice}
          practiceDisabled={phase !== "idle" || loading}
        />
      </div>

      {shadowingOn && phase !== "reward" && <CameraPreview boundsRef={containerRef} />}

      {phase === "countdown" && <Countdown onComplete={handleCountdownComplete} />}
      {phase === "listening" && (
        <MicIndicator
          promptText={practiceTarget}
          getStream={() => getAudioRecorder().getStream?.() ?? null}
          onStop={() => void finishListening()}
        />
      )}
      {phase === "reward" && result && (
        <RewardPopup
          stars={result.stars}
          passed={result.passed}
          words={result.words}
          audioUrl={result.audioUrl}
          onContinue={handleRewardContinue}
          onRetry={handleRetry}
        />
      )}

      <AnimatePresence>
        {showEndDialog && nextStory && (
          <StoryEndDialog
            nextTitle={nextStory.title}
            autoPlayNext={autoPlayNext}
            onToggleAutoPlay={toggleAutoPlayNext}
            onBackToList={() => navigate("/home")}
            onContinue={handleContinueNext}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
