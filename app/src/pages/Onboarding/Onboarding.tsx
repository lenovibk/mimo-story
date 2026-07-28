import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleButton, SolidPillButton } from "@/components/Button/Button";
import { IconChevronLeft } from "@/components/Icon/Icon";
import { Logo } from "@/components/Logo/Logo";
import { SkyBackground } from "@/components/SkyBackground/SkyBackground";
import { categoryVisuals } from "@/data/categoryVisuals";
import { storyCategories } from "@/data/stories";
import { useEnsureGuestSession } from "@/hooks/useEnsureGuestSession";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";
import type { Gender, StoryCategory } from "@/types";

const AGES = [3, 4, 5, 6, 7] as const;

type Step = 0 | 1 | 2 | 3;

export function Onboarding() {
  const navigate = useNavigate();
  const token = useEnsureGuestSession();
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
        key={step}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="safe-px relative flex w-full max-w-sm flex-col items-center gap-6 rounded-[28px] bg-white p-8 text-center shadow-2xl"
      >
        <div className="flex w-full items-center justify-between">
          {step > 0 || canExit ? (
            <CircleButton
              icon={<IconChevronLeft className="h-5 w-5" />}
              color="white"
              size={36}
              ariaLabel="Quay lại"
              onClick={handleBack}
              className="text-slate-500 shadow-none ring-slate-200"
            />
          ) : (
            <Logo />
          )}
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-2 w-6 rounded-full transition-colors ${i <= step ? "bg-[#5CC8FF]" : "bg-slate-200"}`}
              />
            ))}
          </div>
          <span className="w-10" />
        </div>

        {step === 0 && (
          <div className="flex w-full flex-col gap-4">
            <p className="font-heading text-lg font-bold text-slate-700">Bé nhà mình là...</p>
            <div className="flex gap-4">
              {(["boy", "girl"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`flex flex-1 flex-col items-center gap-2 rounded-3xl border-2 py-6 transition-colors ${
                    gender === g ? "border-[#5CC8FF] bg-[#5CC8FF]/10" : "border-slate-200"
                  }`}
                >
                  <span className="text-5xl">{g === "boy" ? "👦" : "👧"}</span>
                  <span className="font-heading font-bold text-slate-700">{g === "boy" ? "Bé trai" : "Bé gái"}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex w-full flex-col gap-4">
            <p className="font-heading text-lg font-bold text-slate-700">Tên của bé là gì?</p>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên bé"
              className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-center font-body text-base text-slate-700 outline-none focus:border-[#5CC8FF]"
            />
          </div>
        )}

        {step === 2 && (
          <div className="flex w-full flex-col gap-4">
            <p className="font-heading text-lg font-bold text-slate-700">Bé mấy tuổi rồi?</p>
            <div className="grid grid-cols-5 gap-2">
              {AGES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAge(a)}
                  className={`flex aspect-square items-center justify-center rounded-2xl border-2 font-heading text-lg font-bold transition-colors ${
                    age === a ? "border-[#5CC8FF] bg-[#5CC8FF]/10 text-[#5CC8FF]" : "border-slate-200 text-slate-600"
                  }`}
                >
                  {a === 7 ? "7+" : a}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex w-full flex-col gap-4">
            <p className="font-heading text-lg font-bold text-slate-700">Bé thích gì nhất?</p>
            <p className="font-body text-xs text-slate-400">Chọn một hoặc nhiều mục - có thể đổi sau</p>
            <div className="grid grid-cols-2 gap-2.5">
              {storyCategories.map((c) => {
                const visual = categoryVisuals[c.id];
                const Icon = visual.icon;
                const active = interests.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleInterest(c.id)}
                    className={`flex items-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-left transition-colors ${
                      active ? "border-[#5CC8FF] bg-[#5CC8FF]/10" : "border-slate-200"
                    }`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${visual.bg}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="font-body text-xs font-semibold text-slate-600">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <SolidPillButton
          label={saving ? "Đang lưu..." : step === 3 ? "Hoàn tất" : "Tiếp tục"}
          color="primary"
          ariaLabel="Tiếp tục"
          disabled={!canNext || saving || (step === 3 && !token)}
          onClick={handleNext}
          className="w-full justify-center py-3.5 text-lg"
        />
      </motion.div>
    </div>
  );
}
