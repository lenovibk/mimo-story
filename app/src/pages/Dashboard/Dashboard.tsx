import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleButton, SolidPillButton } from "@/components/Button/Button";
import { IconBack } from "@/components/Icon/Icon";
import { SkyBackground } from "@/components/SkyBackground/SkyBackground";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/translate";
import { api } from "@/services/api";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import type { DashboardStats } from "@/types";
import { formatDuration } from "@/utils/time";

const PLANS: { id: string; labelKey: TranslationKey }[] = [
  { id: "free", labelKey: "dashboard.planFree" },
  { id: "premium", labelKey: "dashboard.planPremium" },
  { id: "family", labelKey: "dashboard.planFamily" },
];

const WEEKDAY_KEYS: TranslationKey[] = [
  "dashboard.weekdaySun",
  "dashboard.weekdayMon",
  "dashboard.weekdayTue",
  "dashboard.weekdayWed",
  "dashboard.weekdayThu",
  "dashboard.weekdayFri",
  "dashboard.weekdaySat",
];

export function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const parent = useAuthStore((s) => s.parent);
  const children = useAuthStore((s) => s.children);
  const activeChildId = useAuthStore((s) => s.activeChildId);
  const speakingAttemptsByChild = useAppStore((s) => s.speakingAttemptsByChild);

  const [selectedChildId, setSelectedChildId] = useState(activeChildId ?? children[0]?.id ?? "");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [plan, setPlan] = useState(parent?.plan ?? "free");
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => {
    if (!selectedChildId) return;
    api.getDashboard(selectedChildId).then(setStats).catch(() => setStats(null));
  }, [selectedChildId]);

  const handleSelectPlan = async (nextPlan: string) => {
    // Paid plans need a real email on file - guests get sent to verify one first,
    // then land back here with the plan applied. Free never needs this.
    if (nextPlan !== "free" && parent?.isGuest) {
      navigate("/upgrade", { state: { plan: nextPlan } });
      return;
    }

    setSavingPlan(true);
    try {
      const res = await api.setSubscription(nextPlan);
      setPlan(res.plan as typeof plan);
    } finally {
      setSavingPlan(false);
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <SkyBackground />

      <div className="no-scrollbar relative z-10 h-full overflow-y-auto overscroll-contain pb-10">
        <header className="safe-px safe-pt flex items-center gap-4">
          <CircleButton
            icon={<IconBack className="h-6 w-6" />}
            color="white"
            size={44}
            ariaLabel={t("dashboard.backAriaLabel")}
            onClick={() => navigate("/home")}
          />
          <h1 className="font-heading text-xl font-bold text-white drop-shadow-sm">{t("dashboard.title")}</h1>
        </header>

        <div className="safe-px mt-4 flex gap-2 overflow-x-auto pb-1">
          {children.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedChildId(c.id)}
              className={`shrink-0 rounded-full px-4 py-2 font-heading text-sm font-bold transition-colors ${
                selectedChildId === c.id ? "bg-white text-[#5CC8FF]" : "bg-white/40 text-white"
              }`}
            >
              {c.gender === "boy" ? "👦" : "👧"} {c.name}
            </button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="safe-px mt-6 grid grid-cols-2 gap-3"
        >
          <StatCard label={t("dashboard.statTotalTime")} value={formatDuration(stats?.totalLearningSeconds ?? 0)} />
          <StatCard label={t("dashboard.statStoriesCompleted")} value={String(stats?.storiesCompleted ?? 0)} />
          <StatCard
            label={t("dashboard.statSpeakingAttempts")}
            value={String((selectedChildId && speakingAttemptsByChild[selectedChildId]) ?? 0)}
          />
          <StatCard label={t("dashboard.statFavorites")} value={String(stats?.favoritesCount ?? 0)} />
          <StatCard label={t("dashboard.statStreak")} value={t("dashboard.statStreakDays", { days: stats?.streakDays ?? 0 })} />
          <StatCard label={t("dashboard.statStars")} value={String(stats?.stars ?? 0)} />
        </motion.div>

        <div className="safe-px mt-6">
          <p className="mb-2 font-heading text-sm font-bold text-white drop-shadow-sm">{t("dashboard.weeklyActivityTitle")}</p>
          <div className="flex items-end gap-2 rounded-3xl bg-white/90 p-4 shadow-md">
            {(stats?.weeklyActivity ?? []).map((day) => {
              const minutes = Math.round(day.watchedSeconds / 60);
              const heightPct = Math.min(100, (day.watchedSeconds / 1800) * 100);
              const weekday = t(WEEKDAY_KEYS[new Date(day.date).getUTCDay()]);
              return (
                <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-20 w-full items-end overflow-hidden rounded-lg bg-slate-100">
                    <div
                      className="w-full rounded-lg bg-[#5CC8FF]"
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                      title={t("dashboard.minutesTitle", { minutes })}
                    />
                  </div>
                  <span className="font-body text-[10px] font-semibold text-slate-400">{weekday}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="safe-px mt-6">
          <p className="mb-2 font-heading text-sm font-bold text-white drop-shadow-sm">{t("dashboard.subscriptionTitle")}</p>
          <div className="flex flex-col gap-2 rounded-3xl bg-white/90 p-4 shadow-md">
            <p className="font-body text-xs text-slate-400">
              {t("dashboard.currentPlanLabel")}{" "}
              <span className="font-bold text-slate-600">
                {t(PLANS.find((p) => p.id === plan)?.labelKey ?? "dashboard.planFree")}
              </span>
              {" · "}
              {parent?.isGuest ? t("dashboard.emailNotVerified") : parent?.email}
            </p>
            <div className="flex gap-2">
              {PLANS.map((p) => (
                <SolidPillButton
                  key={p.id}
                  label={t(p.labelKey)}
                  color={plan === p.id ? "primary" : "white"}
                  ariaLabel={t("dashboard.selectPlanAriaLabel", { plan: t(p.labelKey) })}
                  disabled={savingPlan}
                  onClick={() => handleSelectPlan(p.id)}
                  className={`flex-1 justify-center py-2.5 text-sm ${plan !== p.id ? "text-slate-500" : ""}`}
                />
              ))}
            </div>
            <p className="font-body text-[11px] text-slate-400">{t("dashboard.mockPaymentNote")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-3xl bg-white/90 p-4 text-center shadow-md">
      <p className="font-body text-xs font-semibold text-slate-400">{label}</p>
      <p className="font-heading text-lg font-bold text-slate-700">{value}</p>
    </div>
  );
}
