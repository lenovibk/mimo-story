import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CircleButton, SolidPillButton } from "@/components/Button/Button";
import { CameraPreview } from "@/components/CameraPreview/CameraPreview";
import { FloatingButtons } from "@/components/FloatingButtons/FloatingButtons";
import { RewardPopup } from "@/components/RewardPopup/RewardPopup";
import { Countdown } from "@/components/Speech/Countdown";
import { MicIndicator } from "@/components/Speech/MicIndicator";
import { Subtitle } from "@/components/Subtitle/Subtitle";
import { getStoryById } from "@/data/stories";
import { findActiveCue, findNearestCue, useSubtitles } from "@/hooks/useSubtitles";
import { getSpeechProvider } from "@/services/Speech";
import { useAppStore } from "@/store/useAppStore";
import type { PronunciationResult } from "@/types";

type Phase = "idle" | "countdown" | "listening" | "reward";

const LISTEN_DURATION_MS = 3200;

export function Player() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const story = id ? getStoryById(id) : undefined;
  const { en, vi, loading } = useSubtitles(story);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [practiceTarget, setPracticeTarget] = useState("");

  const stars = useAppStore((s) => s.stars);
  const subtitleEnOn = useAppStore((s) => s.subtitleEnOn);
  const subtitleViOn = useAppStore((s) => s.subtitleViOn);
  const shadowingOn = useAppStore((s) => s.shadowingOn);
  const toggleSubtitleEn = useAppStore((s) => s.toggleSubtitleEn);
  const toggleSubtitleVi = useAppStore((s) => s.toggleSubtitleVi);
  const toggleShadowing = useAppStore((s) => s.toggleShadowing);
  const addStars = useAppStore((s) => s.addStars);

  const currentEnCue = useMemo(() => findActiveCue(en, currentTime), [en, currentTime]);
  const currentViCue = useMemo(() => findActiveCue(vi, currentTime), [vi, currentTime]);

  useEffect(
    () => () => {
      if (listenTimerRef.current) clearTimeout(listenTimerRef.current);
      void getSpeechProvider().cancel();
    },
    []
  );

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
    const speechResult = await provider.stop();
    const scored = provider.score(practiceTarget, speechResult);
    setResult(scored);
    if (scored.passed) addStars(10);
    setPhase("reward");
  };

  const handleCountdownComplete = () => {
    setPhase("listening");
    // Arm the fallback timer immediately - if start() hangs (no mic, no network
    // speech backend, etc.) the child must never be stuck on "Listening..." forever.
    listenTimerRef.current = setTimeout(() => void finishListening(), LISTEN_DURATION_MS);
    getSpeechProvider()
      .start("en-US")
      .catch(() => {
        // No mic / permission denied - the fallback timer above still fires.
      });
  };

  const handleRewardContinue = () => {
    setPhase("idle");
    setResult(null);
    setIsPaused(false);
    void videoRef.current?.play();
  };

  const handleRetry = () => {
    setResult(null);
    setPhase("countdown");
  };

  return (
    <div ref={containerRef} className="relative h-svh w-full touch-none overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={story.video}
        autoPlay
        playsInline
        disablePictureInPicture
        onTimeUpdate={handleTimeUpdate}
        onContextMenu={(e) => e.preventDefault()}
        onEnded={() => navigate("/home")}
        className="h-full w-full object-contain"
      />

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 sm:p-6">
        <CircleButton
          icon="←"
          color="white"
          size={56}
          ariaLabel="Back to home"
          onClick={() => navigate("/home")}
        />
        <SolidPillButton
          icon="🦊"
          label={`${story.title}${story.episodeLabel ? ` - ${story.episodeLabel}` : ""}`}
          color="white"
          ariaLabel={story.title}
          className="hidden text-sm sm:flex"
        />
        <div className="hidden items-center gap-3 sm:flex">
          <SolidPillButton icon="⭐" label={stars} color="white" ariaLabel="Stars collected" />
          <SolidPillButton
            icon="🏠"
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

      {shadowingOn && phase !== "reward" && <CameraPreview boundsRef={containerRef} />}

      {phase === "countdown" && <Countdown onComplete={handleCountdownComplete} />}
      {phase === "listening" && <MicIndicator promptText={practiceTarget} />}
      {phase === "reward" && result && (
        <RewardPopup
          stars={result.stars}
          passed={result.passed}
          onContinue={handleRewardContinue}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}
