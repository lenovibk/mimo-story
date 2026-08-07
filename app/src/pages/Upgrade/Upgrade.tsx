import { motion } from "framer-motion";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SolidPillButton } from "@/components/Button/Button";
import { Logo } from "@/components/Logo/Logo";
import { SkyBackground } from "@/components/SkyBackground/SkyBackground";
import { useEnsureGuestSession } from "@/hooks/useEnsureGuestSession";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/translate";
import { ApiError, api } from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";

type Step = "email" | "code";

const PLAN_LABEL_KEYS: Record<string, TranslationKey> = {
  premium: "upgrade.planPremium",
  family: "upgrade.planFamily",
};

/**
 * Email is never required just to use the app (see RequireChild's guest
 * session). This page only shows up when a parent picks a paid plan in the
 * Dashboard - it verifies their email and upgrades the existing guest account
 * in place, keeping all children/favorites/progress already created.
 */
export function Upgrade() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const pendingPlan = (location.state as { plan?: string } | null)?.plan;
  const pendingPlanLabel = pendingPlan ? (PLAN_LABEL_KEYS[pendingPlan] ? t(PLAN_LABEL_KEYS[pendingPlan]) : pendingPlan) : undefined;
  useEnsureGuestSession();
  const login = useAuthStore((s) => s.login);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitEmail = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await api.requestCode(email.trim());
      setStep("code");
    } catch {
      setError(t("upgrade.emailErrorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.upgrade(email.trim(), code.trim());
      login(res.token, res.parent, res.children);
      if (pendingPlan) await api.setSubscription(pendingPlan).catch(() => {});
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === "email_in_use") {
        setError(t("upgrade.emailInUse"));
      } else if (err instanceof ApiError && err.code === "invalid_or_expired_code") {
        setError(t("upgrade.codeInvalid"));
      } else {
        setError(t("upgrade.genericError"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <SkyBackground />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="safe-px relative flex w-full max-w-sm flex-col items-center gap-6 rounded-[28px] bg-white p-8 text-center shadow-2xl"
      >
        <Logo />

        {step === "email" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitEmail();
            }}
            className="flex w-full flex-col gap-4"
          >
            <p className="font-heading text-lg font-bold text-slate-700">
              {t("upgrade.verifyEmailTitle")} {pendingPlan ? t("upgrade.verifyEmailForPlan", { plan: pendingPlanLabel ?? pendingPlan }) : ""}
            </p>
            <p className="font-body text-sm text-slate-500">{t("upgrade.verifyEmailHint")}</p>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("upgrade.emailPlaceholder")}
              className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-center font-body text-base text-slate-700 outline-none focus:border-[#5CC8FF]"
            />
            {error && <p className="font-body text-sm text-[#FF7A7A]">{error}</p>}
            <SolidPillButton
              label={loading ? t("upgrade.sending") : t("upgrade.sendCodeLabel")}
              color="primary"
              ariaLabel={t("upgrade.sendCodeLabel")}
              disabled={loading}
              onClick={() => void submitEmail()}
              className="w-full justify-center py-3.5 text-lg"
            />
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="font-body text-sm text-slate-400 underline"
            >
              {t("upgrade.backLabel")}
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitCode();
            }}
            className="flex w-full flex-col gap-4"
          >
            <p className="font-heading text-lg font-bold text-slate-700">{t("upgrade.enterCodeTitle")}</p>
            <p className="font-body text-sm text-slate-500">{t("upgrade.codeSentHint", { email })}</p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-center font-heading text-2xl tracking-[0.5em] text-slate-700 outline-none focus:border-[#5CC8FF]"
            />
            {error && <p className="font-body text-sm text-[#FF7A7A]">{error}</p>}
            <SolidPillButton
              label={loading ? t("upgrade.verifying") : t("upgrade.confirmLabel")}
              color="primary"
              ariaLabel={t("upgrade.confirmLabel")}
              disabled={loading || code.length !== 6}
              onClick={() => void submitCode()}
              className="w-full justify-center py-3.5 text-lg"
            />
            <button
              type="button"
              onClick={() => setStep("email")}
              className="font-body text-sm text-slate-400 underline"
            >
              {t("upgrade.changeEmailLabel")}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
