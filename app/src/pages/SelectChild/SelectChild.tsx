import { motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SolidPillButton } from "@/components/Button/Button";
import { Logo } from "@/components/Logo/Logo";
import { SkyBackground } from "@/components/SkyBackground/SkyBackground";
import { useEnsureGuestSession } from "@/hooks/useEnsureGuestSession";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuthStore } from "@/store/useAuthStore";

export function SelectChild() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = useEnsureGuestSession();
  const children = useAuthStore((s) => s.children);
  const setActiveChild = useAuthStore((s) => s.setActiveChild);

  useEffect(() => {
    if (token && children.length === 0) navigate("/onboarding", { replace: true });
  }, [token, children, navigate]);

  const handleSelect = (childId: string) => {
    setActiveChild(childId);
    navigate("/home", { replace: true });
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
        <p className="font-heading text-lg font-bold text-slate-700">{t("selectChild.title")}</p>

        <div className="grid w-full grid-cols-2 gap-3">
          {children.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => handleSelect(child.id)}
              className="flex flex-col items-center gap-2 rounded-3xl border-2 border-slate-200 py-5 transition-colors hover:border-[#5CC8FF]"
            >
              <span className="text-5xl">{child.gender === "boy" ? "👦" : "👧"}</span>
              <span className="font-heading font-bold text-slate-700">{child.name}</span>
            </button>
          ))}
        </div>

        <SolidPillButton
          label={t("selectChild.addChildLabel")}
          color="white"
          ariaLabel={t("selectChild.addChildAriaLabel")}
          onClick={() => navigate("/onboarding")}
          className="w-full justify-center py-3 text-slate-500"
        />
      </motion.div>
    </div>
  );
}
