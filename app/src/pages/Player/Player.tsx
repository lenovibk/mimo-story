import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { CircleButton, SolidPillButton } from "@/components/Button/Button";
import { CameraPreview } from "@/components/CameraPreview/CameraPreview";
import { FloatingButtons } from "@/components/FloatingButtons/FloatingButtons";
import { IconBack, IconHome, IconStar } from "@/components/Icon/Icon";
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

type Phase = "idle" | "countdown" | "listening" | "reward";

const LISTEN_DURATION_MS = 3200;
const CONTROLS_HIDE_DELAY_MS = 3000;

export function Player() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const story = id ? getStoryById(id) : undefined;
  const { en, vi, loading } = useSubtitles(story);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [practiceTarget, setPracticeTarget] = useState("");
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showEndDialog, setShowEndDialog] = useState(false);

  const stars = useAppStore((s) => s.stars);
  const subtitleEnOn = useAppStore((s) => s.subtitleEnOn);
  const subtitleViOn = useAppStore((s) => s.subtitleViOn);
  const shadowingOn = useAppStore((s) => s.shadowingOn);
  const autoPlayNext = useAppStore((s) => s.autoPlayNext);
  const toggleSubtitleEn = useAppStore((s) => s.toggleSubtitleEn);
  const toggleSubtitleVi = useAppStore((s) => s.toggleSubtitleVi);
  const toggleShadowing = useAppStore((s) => s.toggleShadowing);
  const toggleAutoPlayNext = useAppStore((s) => s.toggleAutoPlayNext);
  const addStars = useAppStore((s) => s.addStars);

  const currentEnCue = useMemo(() => findActiveCue(en, currentTime), [en, currentTime]);
  const currentViCue = useMemo(() => findActiveCue(vi, currentTime), [vi, currentTime]);

  const nextStory = useMemo(() => {
    if (!story) return undefined;
    const index = stories.findIndex((s) => s.id === story.id);
    return index >= 0 ? stories[index + 1] : undefined;
  }, [story]);

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
      <div className="flex h-svh flex-col items-center justify-center gap-4 bg-[#F7FBFF] px-6 text-center">
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
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
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
    setPhase("listening");
    playReadyChime();
    // Arm the fallback timer immediately - if start() hangs (no mic, no network
    // speech backend, etc.) the child must never be stuck on "Listening..." forever.
    listenTimerRef.current = setTimeout(() => void finishListening(), LISTEN_DURATION_MS);
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
      className="relative h-svh w-full touch-none overflow-hidden bg-black"
      onClick={handleScreenTap}
    >
      <video
        key={story.id}
        ref={videoRef}
        autoPlay
        playsInline
        disablePictureInPicture
        onTimeUpdate={handleTimeUpdate}
        onContextMenu={(e) => e.preventDefault()}
        onEnded={handleVideoEnded}
        className="h-full w-full object-contain"
      >
        {story.videoWebm && <source src={story.videoWebm} type="video/webm" />}
        <source src={story.video} type="video/mp4" />
      </video>

      <div
        className={`absolute inset-x-0 top-0 z-20 flex items-center justify-between p-3 transition-opacity duration-300 sm:p-6 landscape-compact:p-2 ${
          controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <CircleButton
          icon={<IconBack className="h-6 w-6 sm:h-7 sm:w-7" />}
          color="white"
          size={44}
          className="sm:h-14! sm:w-14! landscape-compact:h-9! landscape-compact:w-9!"
          ariaLabel="Back to home"
          onClick={() => navigate("/home")}
        />
        <SolidPillButton
          label={`${story.title}${story.episodeLabel ? ` - ${story.episodeLabel}` : ""}`}
          color="white"
          ariaLabel={story.title}
          className="hidden text-sm sm:flex"
        />
        <div className="hidden items-center gap-3 sm:flex">
          <SolidPillButton
            icon={<IconStar className="h-5 w-5 text-[#FFD54A]" />}
            label={stars}
            color="white"
            ariaLabel="Stars collected"
          />
          <SolidPillButton
            icon={<IconHome className="h-5 w-5" />}
            label="Home"
            color="pink"
            ariaLabel="Home"
            onClick={() => navigate("/home")}
          />
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
