import { PillButton } from "@/components/Button/Button";

interface FloatingButtonsProps {
  subtitleEnOn: boolean;
  subtitleViOn: boolean;
  shadowingOn: boolean;
  isPaused: boolean;
  onToggleEn: () => void;
  onToggleVi: () => void;
  onToggleShadowing: () => void;
  onTogglePause: () => void;
  onPracticeSpeaking: () => void;
  practiceDisabled?: boolean;
}

export function FloatingButtons({
  subtitleEnOn,
  subtitleViOn,
  shadowingOn,
  isPaused,
  onToggleEn,
  onToggleVi,
  onToggleShadowing,
  onTogglePause,
  onPracticeSpeaking,
  practiceDisabled,
}: FloatingButtonsProps) {
  return (
    <div className="absolute top-1/2 right-3 z-20 flex -translate-y-1/2 flex-col gap-3 sm:right-6 sm:gap-4">
      <PillButton
        icon="🇬🇧"
        label="EN"
        sublabel="Subtitle"
        color="primary"
        active={subtitleEnOn}
        onClick={onToggleEn}
        ariaLabel="Toggle English subtitle"
      />
      <PillButton
        icon="🇻🇳"
        label="VI"
        sublabel="Subtitle"
        color="pink"
        active={subtitleViOn}
        onClick={onToggleVi}
        ariaLabel="Toggle Vietnamese subtitle"
      />
      <PillButton
        icon="😊"
        label="Shadowing"
        sublabel={shadowingOn ? "ON" : "OFF"}
        color="green"
        active={shadowingOn}
        onClick={onToggleShadowing}
        ariaLabel="Toggle shadowing camera"
      />
      <PillButton
        icon={isPaused ? "▶" : "⏸"}
        label={isPaused ? "Play" : "Pause"}
        color="night"
        onClick={onTogglePause}
        ariaLabel={isPaused ? "Resume video" : "Pause video"}
      />
      <PillButton
        icon="🎤"
        label="Practice"
        sublabel="Speaking"
        color="pink"
        solid
        disabled={practiceDisabled}
        onClick={onPracticeSpeaking}
        ariaLabel="Practice speaking"
      />
    </div>
  );
}
