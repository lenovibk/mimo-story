import { PillButton } from "@/components/Button/Button";
import { IconFace, IconFlagEn, IconFlagVi, IconMic, IconPause, IconPlay } from "@/components/Icon/Icon";

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
    <div className="absolute top-1/2 right-2 z-20 flex -translate-y-1/2 flex-col gap-2 sm:right-6 sm:gap-4 landscape-compact:right-1.5 landscape-compact:gap-1.5">
      <PillButton
        icon={<IconFlagEn className="h-full w-full" />}
        flagIcon
        label="EN"
        sublabel="Subtitle"
        active={subtitleEnOn}
        onClick={onToggleEn}
        ariaLabel="Toggle English subtitle"
      />
      <PillButton
        icon={<IconFlagVi className="h-full w-full" />}
        flagIcon
        label="VI"
        sublabel="Subtitle"
        active={subtitleViOn}
        onClick={onToggleVi}
        ariaLabel="Toggle Vietnamese subtitle"
      />
      <PillButton
        icon={<IconFace className="h-5 w-5 sm:h-7 sm:w-7" />}
        label="Shadowing"
        sublabel={shadowingOn ? "ON" : "OFF"}
        color="green"
        active={shadowingOn}
        onClick={onToggleShadowing}
        ariaLabel="Toggle shadowing camera"
      />
      <PillButton
        icon={
          isPaused ? (
            <IconPlay className="h-4 w-4 sm:h-6 sm:w-6" />
          ) : (
            <IconPause className="h-4 w-4 sm:h-6 sm:w-6" />
          )
        }
        label={isPaused ? "Play" : "Pause"}
        color="night"
        onClick={onTogglePause}
        ariaLabel={isPaused ? "Resume video" : "Pause video"}
      />
      <PillButton
        icon={<IconMic className="h-4 w-4 sm:h-6 sm:w-6" />}
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
