import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleButton, SolidPillButton } from "@/components/Button/Button";
import { Logo } from "@/components/Logo/Logo";
import { SkyBackground } from "@/components/SkyBackground/SkyBackground";
import { StoryCard } from "@/components/StoryCard/StoryCard";
import { stories } from "@/data/stories";
import { useAppStore } from "@/store/useAppStore";
import type { Story } from "@/types";

export function Home() {
  const navigate = useNavigate();
  const stars = useAppStore((s) => s.stars);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSelect = (story: Story) => navigate(`/story/${story.id}`);

  return (
    <div className="relative min-h-svh w-full overflow-hidden">
      <SkyBackground />
      <div
        className="absolute inset-x-0 bottom-0 h-28 bg-[#8EE28E]/70"
        style={{ borderRadius: "50% 50% 0 0 / 100% 100% 0 0", transform: "scale(1.4, 1)" }}
      />

      <div className="relative z-10 flex min-h-svh flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 px-5 pt-6 sm:px-10">
          <Logo />
          <h1 className="order-3 w-full text-center font-heading text-xl font-bold text-white drop-shadow-sm sm:order-2 sm:w-auto sm:text-2xl">
            ⭐ Chọn truyện để bắt đầu ⭐
          </h1>
          <div className="order-2 flex items-center gap-3 sm:order-3">
            <SolidPillButton
              icon="⭐"
              label={stars}
              color="white"
              ariaLabel="Stars collected"
              className="cursor-default"
            />
            <CircleButton
              icon="⚙️"
              color="white"
              size={56}
              ariaLabel="Settings"
              onClick={() => setSettingsOpen(true)}
            />
          </div>
        </header>

        <main className="flex flex-1 items-center px-5 py-10 sm:px-10">
          <div
            className="no-select flex w-full snap-x snap-proximity gap-5 overflow-x-auto pb-4 sm:gap-7"
            style={{ scrollPadding: "0 8px" }}
          >
            {stories.map((story) => (
              <div key={story.id} className="snap-start">
                <StoryCard story={story} onSelect={handleSelect} />
              </div>
            ))}
          </div>
        </main>

        <footer className="pb-6 text-center">
          <p className="mx-auto inline-block rounded-full bg-white/85 px-6 py-2 font-heading text-sm font-semibold text-slate-600 shadow-md">
            ⭐ Học mà chơi - Chơi mà học - Bé vui mỗi ngày! ❤️
          </p>
        </footer>
      </div>

      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 px-6"
            onClick={() => setSettingsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="flex w-full max-w-sm flex-col items-center gap-5 rounded-[28px] bg-white p-8 text-center shadow-2xl"
            >
              <Logo />
              <p className="font-body text-slate-500">MimoKids - phiên bản 1.0</p>
              <p className="font-heading text-lg font-bold text-slate-700">⭐ {stars} sao đã thu thập</p>
              <SolidPillButton
                label="Đóng"
                color="primary"
                ariaLabel="Close settings"
                onClick={() => setSettingsOpen(false)}
                className="px-8 py-3 text-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
