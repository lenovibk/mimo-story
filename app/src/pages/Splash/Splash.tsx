import { motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo/Logo";
import { SkyBackground } from "@/components/SkyBackground/SkyBackground";
import { useEnsureCatalogLoaded } from "@/hooks/useEnsureCatalogLoaded";

const SPLASH_DURATION_MS = 2000;

export function Splash() {
  const navigate = useNavigate();
  useEnsureCatalogLoaded();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/home", { replace: true }), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <SkyBackground />

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "backOut" }}
        className="relative flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Logo size="lg" />
        </motion.div>
        <p className="font-heading text-lg font-semibold text-white/90 drop-shadow sm:text-xl">
          Học mà chơi - Chơi mà học!
        </p>
      </motion.div>
    </div>
  );
}
