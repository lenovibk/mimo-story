import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleButton, SolidPillButton, type ButtonColor } from "@/components/Button/Button";
import { IconCheck, IconChevronLeft, IconStar, IconStarOutline } from "@/components/Icon/Icon";
import { SkyBackground } from "@/components/SkyBackground/SkyBackground";
import { getCategoryIcon } from "@/data/categoryVisuals";
import { useEnsureCatalogLoaded } from "@/hooks/useEnsureCatalogLoaded";
import { useEnsureGuestSession } from "@/hooks/useEnsureGuestSession";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/translate";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useCatalogStore } from "@/store/useCatalogStore";
import type { Gender, StoryCategory } from "@/types";

const AGES = [3, 4, 5, 6, 7] as const;
const AGE_COLORS = ["#FF92C2", "#FFB25C", "#FFD54A", "#8EE28E", "#5CC8FF"];

type Step = 0 | 1 | 2 | 3;

const STEP_META: { emoji: string; titleKey: TranslationKey; accent: string; btnColor: ButtonColor }[] = [
  { emoji: "🎈", titleKey: "onboarding.stepGenderTitle", accent: "#5CC8FF", btnColor: "primary" },
  { emoji: "✏️", titleKey: "onboarding.stepNameTitle", accent: "#FF92C2", btnColor: "pink" },
  { emoji: "🎂", titleKey: "onboarding.stepAgeTitle", accent: "#FFB25C", btnColor: "yellow" },
  { emoji: "🌈", titleKey: "onboarding.stepInterestsTitle", accent: "#8EE28E", btnColor: "green" },
];

const SPARKLES = [
  { top: "4%", left: "-4%", delay: 0, size: "text-lg" },
  { top: "-6%", left: "70%", delay: 0.7, size: "text-base" },
  { top: "88%", left: "-3%", delay: 1.2, size: "text-base" },
  { top: "92%", left: "88%", delay: 0.4, size: "text-lg" },
];

export function Onboarding() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = useEnsureGuestSession();
  useEnsureCatalogLoaded();
  const categories = useCatalogStore((s) => s.categories);
  const children = useAuthStore((s) => s.children);
  const addChild = useAuthStore((s) => s.addChild);
  const setActiveChild = useAuthStore((s) => s.setActiveChild);

  const [step, setStep] = useState<Step>(0);
  const [gender, setGender] = useState<Gender | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [interests, setInterests] = useState<StoryCategory[]>([]);
  const [saving, setSaving] = useState(false);

  // Adding a sibling from /select-child can be cancelled back there; the very
  // first child (no account to "go back" to yet) has nowhere to exit to.
  const canExit = children.length > 0;

  const canNext = [gender !== null, name.trim().length > 0, age !== null, true][step];
  const meta = STEP_META[step];

  const toggleInterest = (id: StoryCategory) =>
    setInterests((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const handleBack = () => {
    if (step > 0) {
      setStep((s) => (s - 1) as Step);
    } else if (canExit) {
      navigate("/select-child");
    }
  };

  const handleNext = async () => {
    if (step < 3) {
      setStep((s) => (s + 1) as Step);
      return;
    }
    if (!gender || age === null || !token) return;
    setSaving(true);
    try {
      const child = await api.createChild({ name: name.trim(), gender, age, interests });
      addChild(child);
      setActiveChild(child.id);
      navigate("/home", { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <SkyBackground />

      <motion.div
        animate={{
          boxShadow: `0 24px 60px -20px ${meta.accent}99`,
        }}
        transition={{ duration: 0.4 }}
        className="safe-px relative w-full max-w-sm overflow-visible rounded-[32px] bg-white p-7 pt-6"
      >
        {SPARKLES.map((s, i) => (
          <motion.span
            key={i}
            aria-hidden
            className={`pointer-events-none absolute ${s.size} text-white drop-shadow`}
            style={{ top: s.top, left: s.left }}
            animate={{ scale: [0.6, 1.2, 0.6], opacity: [0.4, 1, 0.4], rotate: [0, 15, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
          >
            ✨
          </motion.span>
        ))}

        <div className="flex w-full items-center justify-between">
          {step > 0 || canExit ? (
            <CircleButton
              icon={<IconChevronLeft className="h-5 w-5" />}
              color="white"
              size={36}
              ariaLabel={t("onboarding.backAriaLabel")}
              onClick={handleBack}
              className="text-slate-500 shadow-none ring-slate-200"
            />
          ) : (
            <span className="w-9" />
          )}

          <div className="flex gap-2">
            {STEP_META.map((_, i) => (
              <motion.span
                key={i}
                animate={i === step ? { y: [0, -4, 0] } : { y: 0 }}
                transition={{ duration: 1, repeat: i === step ? Infinity : 0, ease: "easeInOut" }}
              >
                {i <= step ? (
                  <IconStar className="h-5 w-5" style={{ color: STEP_META[i].accent }} />
                ) : (
                  <IconStarOutline className="h-5 w-5 text-slate-300" />
                )}
              </motion.span>
            ))}
          </div>

          <span className="w-9" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 28, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -28, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="mt-5 flex flex-col items-center gap-5 text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 14, delay: 0.05 }}
              className="flex items-center gap-2.5"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-xl shadow-md ring-2 ring-white/70"
                style={{ backgroundColor: meta.accent }}
              >
                {meta.emoji}
              </span>
              <p className="font-heading text-lg font-extrabold text-slate-700">{t(meta.titleKey)}</p>
            </motion.div>

            {step === 0 && (
              <div className="flex w-full gap-4">
                {(["boy", "girl"] as const).map((g, i) => {
                  const active = gender === g;
                  return (
                    <motion.button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.08 }}
                      whileTap={{ scale: 0.94 }}
                      className="relative flex flex-1 flex-col items-center gap-2 overflow-hidden rounded-3xl py-6 shadow-md outline-none transition-all"
                      style={{
                        background: g === "boy" ? "linear-gradient(160deg,#BFEAFF,#EAF7FF)" : "linear-gradient(160deg,#FFD6EA,#FFF0F6)",
                        boxShadow: active
                          ? `0 0 0 4px #FFFFFF, 0 10px 24px -8px ${g === "boy" ? "#5CC8FF" : "#FF92C2"}`
                          : undefined,
                      }}
                    >
                      {active && (
                        <motion.span
                          initial={{ scale: 0, rotate: -30 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 12 }}
                          className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#8EE28E] text-white shadow"
                        >
                          <IconCheck className="h-3.5 w-3.5" />
                        </motion.span>
                      )}
                      <motion.span
                        animate={active ? { scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] } : {}}
                        transition={{ duration: 0.5 }}
                        className="text-5xl drop-shadow-sm"
                      >
                        {g === "boy" ? "👦" : "👧"}
                      </motion.span>
                      <span className="font-heading font-bold text-slate-700">
                        {g === "boy" ? t("onboarding.boyLabel") : t("onboarding.girlLabel")}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {step === 1 && (
              <div className="flex w-full flex-col items-center gap-4">
                <input
                  type="text"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("onboarding.namePlaceholder")}
                  className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3.5 text-center font-heading text-lg text-slate-700 outline-none transition-colors focus:border-[#FF92C2]"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2.5 rounded-full px-4 py-2.5 shadow-md"
                  style={{ background: "linear-gradient(120deg,#FF92C2,#B79CFF)" }}
                >
                  <motion.span
                    animate={{ rotate: [0, -12, 10, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1 }}
                    className="text-2xl"
                  >
                    {gender === "boy" ? "👦" : gender === "girl" ? "👧" : "🧒"}
                  </motion.span>
                  <p className="font-heading text-sm font-bold text-white drop-shadow-sm">
                    {t("onboarding.greeting", { name: name.trim() || t("onboarding.greetingFallbackName") })}
                  </p>
                </motion.div>
              </div>
            )}

            {step === 2 && (
              <div className="flex w-full flex-col items-center gap-3">
                <div className="flex items-end justify-center gap-2.5">
                  {AGES.map((a, i) => {
                    const active = age === a;
                    const size = 44 + i * 5;
                    return (
                      <motion.button
                        key={a}
                        type="button"
                        onClick={() => setAge(a)}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 + i * 0.06, type: "spring", stiffness: 320, damping: 16 }}
                        whileTap={{ scale: 0.88 }}
                        className={`flex shrink-0 items-center justify-center rounded-full font-heading font-extrabold shadow-md outline-none transition-all ${
                          active ? "" : "ring-2 ring-slate-200"
                        }`}
                        style={{
                          width: size,
                          height: size,
                          backgroundColor: active ? AGE_COLORS[i] : "#F1F5F9",
                          color: active ? "#FFFFFF" : "#64748B",
                          boxShadow: active ? `0 8px 18px -6px ${AGE_COLORS[i]}` : undefined,
                        }}
                      >
                        <motion.span animate={active ? { scale: [1, 1.25, 1] } : {}} transition={{ duration: 0.4 }}>
                          {a === 7 ? "7+" : a}
                        </motion.span>
                      </motion.button>
                    );
                  })}
                </div>
                <p className="font-body text-xs text-slate-400">{t("onboarding.ageUnit")}</p>
              </div>
            )}

            {step === 3 && (
              <div className="flex w-full flex-col gap-3">
                <p className="-mt-2 font-body text-xs text-slate-400">
                  {t("onboarding.interestsHint", { count: interests.length })}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((c, i) => {
                    const Icon = getCategoryIcon(c.icon);
                    const active = interests.includes(c.id);
                    return (
                      <motion.button
                        key={c.id}
                        type="button"
                        onClick={() => toggleInterest(c.id)}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.03 * i, type: "spring", stiffness: 340, damping: 18 }}
                        whileTap={{ scale: 0.92, rotate: -3 }}
                        className={`relative flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left shadow-sm ring-2 transition-all ${
                          active ? "ring-offset-1" : "ring-transparent"
                        }`}
                        style={{
                          backgroundColor: active ? `${c.color}1A` : "#F8FAFC",
                          ["--tw-ring-color" as string]: active ? c.color : "transparent",
                        }}
                      >
                        {active && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 420, damping: 14 }}
                            className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#8EE28E] text-white shadow"
                          >
                            <IconCheck className="h-3 w-3" />
                          </motion.span>
                        )}
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
                          style={{ backgroundColor: c.color }}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="font-body text-xs font-bold text-slate-600">{c.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <SolidPillButton
          label={saving ? t("onboarding.saving") : step === 3 ? t("onboarding.finish") : t("onboarding.continueLabel")}
          color={meta.btnColor}
          ariaLabel={t("onboarding.continueLabel")}
          disabled={!canNext || saving || (step === 3 && !token)}
          onClick={handleNext}
          className="mt-6 w-full justify-center py-3.5 text-lg"
        />
      </motion.div>
    </div>
  );
}
