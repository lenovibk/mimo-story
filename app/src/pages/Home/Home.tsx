import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleButton, SolidPillButton } from "@/components/Button/Button";
import { IconChevronLeft, IconChevronRight, IconHeart, IconSettings, IconStar } from "@/components/Icon/Icon";
import { Logo } from "@/components/Logo/Logo";
import { SkyBackground } from "@/components/SkyBackground/SkyBackground";
import { StoryCard } from "@/components/StoryCard/StoryCard";
import { stories, storyCategories } from "@/data/stories";
import { useAppStore } from "@/store/useAppStore";
import type { Story, StoryCategory } from "@/types";
import { playTick, playWhoosh } from "@/utils/sound";

export function Home() {
  const navigate = useNavigate();
  const stars = useAppStore((s) => s.stars);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [category, setCategory] = useState<StoryCategory | null>(null);

  const visibleStories = category ? stories.filter((s) => s.category === category) : stories;

  const handleSelect = (story: Story) => navigate(`/story/${story.id}`);

  const railRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());
  const [activeId, setActiveId] = useState(visibleStories[0]?.id);
  const [edge, setEdge] = useState({ atStart: true, atEnd: false });
  const [isDragging, setIsDragging] = useState(false);
  // `down`: a mouse button is held. `dragging`: movement crossed the drag threshold, so we're
  // actively panning the rail and should swallow the click that follows.
  const dragState = useRef({ down: false, dragging: false, startX: 0, startScrollLeft: 0 });
  const suppressNextClick = useRef(false);
  const DRAG_THRESHOLD = 10;

  // Recompute which card is centered, and the scroll edges, from actual DOM positions
  // (robust to responsive card widths/gaps instead of hardcoding sizes).
  const updateFromScroll = () => {
    const rail = railRef.current;
    if (!rail) return;

    setEdge({
      atStart: rail.scrollLeft <= 4,
      atEnd: rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 4,
    });

    const center = rail.getBoundingClientRect().left + rail.clientWidth / 2;
    let closestId: string | undefined;
    let closestDist = Infinity;
    for (const story of visibleStories) {
      const el = cardRefs.current.get(story.id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const dist = Math.abs(rect.left + rect.width / 2 - center);
      if (dist < closestDist) {
        closestDist = dist;
        closestId = story.id;
      }
    }
    if (closestId) {
      setActiveId((prev) => {
        if (prev !== closestId) playTick();
        return closestId;
      });
    }
  };

  useEffect(() => {
    const rail = railRef.current;
    if (rail) rail.scrollLeft = 0;
    setActiveId(visibleStories[0]?.id);
    updateFromScroll();
    const onResize = () => updateFromScroll();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const rafRef = useRef<number>(0);
  const handleScroll = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateFromScroll);
  };

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    const rail = railRef.current;
    if (!rail) return;
    // Let a normal (vertical) mouse wheel drive the horizontal rail too.
    rail.scrollLeft += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  };

  // Click-and-drag scrolling for desktop mice (touch/pen keep native momentum scrolling).
  // Dragging only actually engages once the pointer moves past DRAG_THRESHOLD, so a plain
  // click never grabs pointer capture or nudges scrollLeft — that's what was swallowing taps.
  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (e.pointerType !== "mouse") return;
    const rail = railRef.current;
    if (!rail) return;
    dragState.current = { down: true, dragging: false, startX: e.clientX, startScrollLeft: rail.scrollLeft };
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const rail = railRef.current;
    const drag = dragState.current;
    if (!rail || !drag.down) return;
    const dx = e.clientX - drag.startX;

    if (!drag.dragging) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      drag.dragging = true;
      rail.setPointerCapture(e.pointerId);
      setIsDragging(true);
    }

    rail.scrollLeft = drag.startScrollLeft - dx;
  };

  const endDrag: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (e.pointerType !== "mouse") return;
    dragState.current.down = false;
    if (dragState.current.dragging) {
      dragState.current.dragging = false;
      suppressNextClick.current = true;
    }
    setIsDragging(false);
  };

  // Swallow the click that follows a real drag so it doesn't also open the story.
  const handleClickCapture: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (suppressNextClick.current) {
      e.stopPropagation();
      e.preventDefault();
      suppressNextClick.current = false;
    }
  };

  const goTo = (direction: 1 | -1) => {
    const index = visibleStories.findIndex((s) => s.id === activeId);
    const target = visibleStories[Math.min(Math.max(index + direction, 0), visibleStories.length - 1)];
    const el = target && cardRefs.current.get(target.id);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    playWhoosh(direction);
  };

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
          <h1 className="order-3 flex w-full items-center justify-center gap-2 text-center font-heading text-xl font-bold text-white drop-shadow-sm sm:order-2 sm:w-auto sm:text-2xl">
            <IconStar className="h-5 w-5 text-[#FFD54A] sm:h-6 sm:w-6" />
            Chọn truyện để bắt đầu
            <IconStar className="h-5 w-5 text-[#FFD54A] sm:h-6 sm:w-6" />
          </h1>
          <div className="order-2 flex items-center gap-3 sm:order-3">
            <SolidPillButton
              icon={<IconStar className="h-5 w-5 text-[#FFD54A]" />}
              label={stars}
              color="white"
              ariaLabel="Stars collected"
              className="cursor-default"
            />
            <CircleButton
              icon={<IconSettings className="h-6 w-6" />}
              color="white"
              size={56}
              ariaLabel="Settings"
              onClick={() => setSettingsOpen(true)}
            />
          </div>
        </header>

        <div className="no-select flex gap-2 overflow-x-auto px-5 pt-4 sm:justify-center sm:px-10">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`shrink-0 rounded-full px-4 py-2 font-heading text-sm font-semibold shadow-md transition-colors ${
              category === null ? "bg-white text-[#5CC8FF]" : "bg-white/40 text-white hover:bg-white/60"
            }`}
          >
            Tất cả
          </button>
          {storyCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`shrink-0 rounded-full px-4 py-2 font-heading text-sm font-semibold shadow-md transition-colors ${
                category === c.id ? "bg-white text-[#5CC8FF]" : "bg-white/40 text-white hover:bg-white/60"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <main className="relative flex flex-1 items-center px-5 py-10 sm:px-10">
          <CircleButton
            icon={<IconChevronLeft className="h-7 w-7" />}
            color="white"
            size={56}
            ariaLabel="Truyện trước"
            onClick={() => goTo(-1)}
            disabled={edge.atStart}
            className="absolute top-1/2 left-1 z-10 hidden -translate-y-1/2 sm:flex"
          />
          <CircleButton
            icon={<IconChevronRight className="h-7 w-7" />}
            color="white"
            size={56}
            ariaLabel="Truyện tiếp theo"
            onClick={() => goTo(1)}
            disabled={edge.atEnd}
            className="absolute top-1/2 right-1 z-10 hidden -translate-y-1/2 sm:flex"
          />

          <div
            ref={railRef}
            onScroll={handleScroll}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            onPointerCancel={endDrag}
            onClickCapture={handleClickCapture}
            className={`no-select flex w-full snap-x snap-proximity gap-5 overflow-x-auto pb-4 sm:gap-7 ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{ scrollPadding: "0 8px" }}
          >
            {visibleStories.map((story) => (
              <div
                key={story.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(story.id, el);
                  else cardRefs.current.delete(story.id);
                }}
                className="snap-start"
              >
                <StoryCard story={story} onSelect={handleSelect} isActive={story.id === activeId} />
              </div>
            ))}
          </div>
        </main>

        <footer className="pb-6 text-center">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/85 px-6 py-2 font-heading text-sm font-semibold text-slate-600 shadow-md">
            <IconStar className="h-4 w-4 text-[#FFD54A]" />
            Học mà chơi - Chơi mà học - Bé vui mỗi ngày!
            <IconHeart className="h-4 w-4 text-[#FF92C2]" />
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
              <p className="flex items-center gap-2 font-heading text-lg font-bold text-slate-700">
                <IconStar className="h-5 w-5 text-[#FFD54A]" />
                {stars} sao đã thu thập
              </p>
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
