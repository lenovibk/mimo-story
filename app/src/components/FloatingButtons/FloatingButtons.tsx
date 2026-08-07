import { PillButton } from "@/components/Button/Button";
import { IconBook, IconFace, IconFlagEn, IconFlagVi, IconMic, IconPause, IconPlay } from "@/components/Icon/Icon";
import { useTranslation } from "@/i18n/useTranslation";

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
  /** Omitted when the story has no vocab/grammar content yet - hides the button entirely. */
  onOpenVocab?: () => void;
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
  onOpenVocab,
}: FloatingButtonsProps) {
  const { t } = useTranslation();

  return (
    <div className="absolute top-1/2 right-[max(0.5rem,var(--safe-r))] z-20 flex -translate-y-1/2 flex-col gap-2 sm:right-[max(1.5rem,var(--safe-r))] sm:gap-4 landscape-compact:right-[max(0.375rem,var(--safe-r))] landscape-compact:gap-1.5">
      <PillButton
        icon={<IconFlagEn className="h-full w-full" />}
        flagIcon
        label={t("floatingButtons.subtitleEnLabel")}
        sublabel={t("floatingButtons.subtitleSublabel")}
        active={subtitleEnOn}
        onClick={onToggleEn}
        ariaLabel={t("floatingButtons.subtitleEnAriaLabel")}
      />
      <PillButton
        icon={<IconFlagVi className="h-full w-full" />}
        flagIcon
        label={t("floatingButtons.subtitleViLabel")}
        sublabel={t("floatingButtons.subtitleSublabel")}
        active={subtitleViOn}
        onClick={onToggleVi}
        ariaLabel={t("floatingButtons.subtitleViAriaLabel")}
      />
      <PillButton
        icon={<IconFace className="h-5 w-5 sm:h-7 sm:w-7" />}
        label={t("floatingButtons.shadowingLabel")}
        sublabel={shadowingOn ? t("floatingButtons.shadowingOn") : t("floatingButtons.shadowingOff")}
        color="green"
        active={shadowingOn}
        onClick={onToggleShadowing}
        ariaLabel={t("floatingButtons.shadowingAriaLabel")}
      />
      <PillButton
        icon={
          isPaused ? (
            <IconPlay className="h-4 w-4 sm:h-6 sm:w-6" />
          ) : (
            <IconPause className="h-4 w-4 sm:h-6 sm:w-6" />
          )
        }
        label={isPaused ? t("floatingButtons.playLabel") : t("floatingButtons.pauseLabel")}
        color="night"
        onClick={onTogglePause}
        ariaLabel={isPaused ? t("floatingButtons.resumeAriaLabel") : t("floatingButtons.pauseAriaLabel")}
      />
      <PillButton
        icon={<IconMic className="h-4 w-4 sm:h-6 sm:w-6" />}
        label={t("floatingButtons.practiceLabel")}
        sublabel={t("floatingButtons.practiceSublabel")}
        color="pink"
        solid
        disabled={practiceDisabled}
        onClick={onPracticeSpeaking}
        ariaLabel={t("floatingButtons.practiceAriaLabel")}
      />
      {onOpenVocab && (
        <PillButton
          icon={<IconBook className="h-4 w-4 sm:h-6 sm:w-6" />}
          label={t("floatingButtons.vocabLabel")}
          color="yellow"
          onClick={onOpenVocab}
          ariaLabel={t("floatingButtons.vocabAriaLabel")}
        />
      )}
    </div>
  );
}
