import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { CircleButton } from "@/components/Button/Button";
import { IconBack, IconFlagEn, IconFlagVi, IconMusic, IconPlay } from "@/components/Icon/Icon";
import { SkyBackground } from "@/components/SkyBackground/SkyBackground";
import { ToggleSwitch } from "@/components/ToggleSwitch/ToggleSwitch";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuthStore } from "@/store/useAuthStore";
import { useSettingsStore, type ChildSettings, type PlaybackSpeed } from "@/store/useSettingsStore";

const PLAYBACK_SPEEDS: PlaybackSpeed[] = [0.75, 1, 1.25, 1.5];
const DAILY_LIMIT_PRESETS: (number | null)[] = [null, 30, 60, 90];

export function Settings() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();
  const activeChildId = useAuthStore((s) => s.activeChildId);
  const settings = useSettingsStore((s) => s.getSettings(activeChildId));
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const patch = (p: Partial<ChildSettings>) => {
    if (activeChildId) updateSettings(activeChildId, p);
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <SkyBackground />

      <div className="no-scrollbar relative z-10 h-full overflow-y-auto overscroll-contain">
        <header className="safe-px safe-pt flex items-center gap-4">
          <CircleButton
            icon={<IconBack className="h-6 w-6" />}
            color="white"
            size={44}
            ariaLabel={t("settings.backAriaLabel")}
            onClick={() => navigate(-1)}
          />
          <h1 className="font-heading text-xl font-bold text-white drop-shadow-sm">{t("settings.title")}</h1>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="safe-px mt-6 flex flex-col gap-4 pb-10"
        >
          <SettingsCard title={t("settings.languageSection")}>
            <div className="flex gap-2">
              <SegmentButton
                active={language === "vi"}
                icon={<IconFlagVi className="h-5 w-5 rounded-full" />}
                label={t("settings.languageVi")}
                ariaLabel={t("settings.languageAriaLabel")}
                onClick={() => setLanguage("vi")}
              />
              <SegmentButton
                active={language === "en"}
                icon={<IconFlagEn className="h-5 w-5 rounded-full" />}
                label={t("settings.languageEn")}
                ariaLabel={t("settings.languageAriaLabel")}
                onClick={() => setLanguage("en")}
              />
            </div>
          </SettingsCard>

          <SettingsCard title={t("settings.subtitleSection")} hint={t("settings.subtitleSectionHint")}>
            <ToggleRow
              icon={<IconFlagEn className="h-6 w-6 shrink-0 rounded-full" />}
              label={t("settings.subtitleEnLabel")}
              checked={settings.subtitleEnOn}
              ariaLabel={t("settings.subtitleEnAriaLabel")}
              onChange={() => patch({ subtitleEnOn: !settings.subtitleEnOn })}
            />
            <ToggleRow
              icon={<IconFlagVi className="h-6 w-6 shrink-0 rounded-full" />}
              label={t("settings.subtitleViLabel")}
              checked={settings.subtitleViOn}
              ariaLabel={t("settings.subtitleViAriaLabel")}
              onChange={() => patch({ subtitleViOn: !settings.subtitleViOn })}
            />
          </SettingsCard>

          <SettingsCard title={t("settings.playbackSection")}>
            <ToggleRow
              icon={<IconPlay className="h-6 w-6 shrink-0 text-[#5CC8FF]" />}
              label={t("settings.autoPlayNextLabel")}
              checked={settings.autoPlayNext}
              ariaLabel={t("settings.autoPlayNextAriaLabel")}
              onChange={() => patch({ autoPlayNext: !settings.autoPlayNext })}
            />
            <div>
              <p className="mb-2 font-body text-xs font-semibold text-slate-400">{t("settings.playbackSpeedLabel")}</p>
              <div className="flex gap-2">
                {PLAYBACK_SPEEDS.map((speed) => (
                  <SegmentButton
                    key={speed}
                    active={settings.playbackSpeed === speed}
                    label={`${speed}x`}
                    ariaLabel={`${speed}x`}
                    onClick={() => patch({ playbackSpeed: speed })}
                  />
                ))}
              </div>
            </div>
          </SettingsCard>

          <SettingsCard title={t("settings.soundSection")}>
            <ToggleRow
              icon={<IconMusic className="h-6 w-6 shrink-0 text-[#FF92C2]" />}
              label={t("settings.soundEffectsLabel")}
              checked={settings.soundEffectsOn}
              ariaLabel={t("settings.soundEffectsAriaLabel")}
              onChange={() => patch({ soundEffectsOn: !settings.soundEffectsOn })}
            />
            <div>
              <p className="mb-2 font-body text-xs font-semibold text-slate-400">{t("settings.soundVolumeLabel")}</p>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings.soundEffectsVolume * 100)}
                disabled={!settings.soundEffectsOn}
                onChange={(e) => patch({ soundEffectsVolume: Number(e.target.value) / 100 })}
                className="w-full accent-[#5CC8FF] disabled:opacity-40"
              />
            </div>
          </SettingsCard>

          <SettingsCard title={t("settings.parentalSection")} hint={t("settings.parentalHint")}>
            <div className="flex flex-wrap gap-2">
              {DAILY_LIMIT_PRESETS.map((preset) => (
                <SegmentButton
                  key={preset ?? "none"}
                  active={settings.dailyLimitMinutes === preset}
                  label={preset === null ? t("settings.parentalNoLimit") : t("settings.parentalMinutes", { minutes: preset })}
                  ariaLabel={preset === null ? t("settings.parentalNoLimit") : t("settings.parentalMinutes", { minutes: preset })}
                  onClick={() => patch({ dailyLimitMinutes: preset })}
                />
              ))}
            </div>
          </SettingsCard>
        </motion.div>
      </div>
    </div>
  );
}

function SettingsCard({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl bg-white/90 p-4 shadow-md">
      <p className="font-heading text-sm font-bold text-slate-700">{title}</p>
      {hint && <p className="mt-0.5 font-body text-xs text-slate-400">{hint}</p>}
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  checked,
  onChange,
  ariaLabel,
}: {
  icon?: ReactNode;
  label: string;
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 font-body text-sm font-semibold text-slate-600">
        {icon}
        {label}
      </span>
      <ToggleSwitch checked={checked} onChange={onChange} ariaLabel={ariaLabel} />
    </div>
  );
}

function SegmentButton({
  active,
  icon,
  label,
  onClick,
  ariaLabel,
}: {
  active: boolean;
  icon?: ReactNode;
  label: string;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`no-select flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 font-heading text-sm font-semibold transition-colors ${
        active ? "bg-[#5CC8FF] text-white" : "bg-slate-100 text-slate-500"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
