import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleButton, SolidPillButton } from "@/components/Button/Button";
import {
  IconChevronLeft,
  IconChevronRight,
  IconFamily,
  IconFace,
  IconHeart,
  IconSettings,
  IconStar,
} from "@/components/Icon/Icon";
import { Logo } from "@/components/Logo/Logo";
import { SkyBackground } from "@/components/SkyBackground/SkyBackground";
import { StoryCard } from "@/components/StoryCard/StoryCard";
import { categoryVisuals } from "@/data/categoryVisuals";
import { stories, storyCategories } from "@/data/stories";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import type { Story, StoryCategory } from "@/types";
import { recommendStories } from "@/utils/recommend";
import { playTick, playWhoosh } from "@/utils/sound";

/** Fades whichever edge still has more content to scroll to, so a rail never looks
 * like it just ends mid-list when there's more just out of view. */
function edgeFadeStyle(atStart: boolean, atEnd: boolean, fade = 28) {
  const gradient = `linear-gradient(to right, ${atStart ? "black" : "transparent"} 0px, black ${fade}px, black calc(100% - ${fade}px), ${atEnd ? "black" : "transparent"} 100%)`;
  return { maskImage: gradient, WebkitMaskImage: gradient };
}

/** Small "there's more" nudge that sits on top of the fade zone - a card peeking a
 * single pixel through the fade reads as an accident, not an invitation to scroll. */
function ScrollHint({ side = "right" }: { side?: "left" | "right" }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-500 shadow-sm ${
        side === "right" ? "right-1" : "left-1"
      }`}
    >
      {side === "right" ? <IconChevronRight className="h-4 w-4" /> : <IconChevronLeft className="h-4 w-4" />}
    </span>
  );
}

/** A colorful sticker-badge + bold label used to head every rail/section, so each one reads
 * as its own distinct "shelf" instead of a plain white heading blending into the next. */
function SectionTitle({ emoji, title, accent }: { emoji: string; title: string; accent: string }) {
  return (
    <h2 className="flex items-center gap-2.5">
      <motion.span
        aria-hidden
        initial={{ scale: 0, rotate: -25 }}
        whileInView={{ scale: 1, rotate: -8 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 280, damping: 14 }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-lg shadow-md ring-2 ring-white/70 sm:h-10 sm:w-10 sm:text-xl"
        style={{ backgroundColor: accent }}
      >
        {emoji}
      </motion.span>
      <span className="font-heading text-lg font-extrabold tracking-tight text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.25)] sm:text-xl">
        {title}
      </span>
    </h2>
  );
}

/** A small round icon button with a caption underneath, for the header actions. */
/** A colorful floating sticker-badge for the header, matching the category chips'
 * look below - its own bobbing idle animation so the row feels alive, not a static toolbar. */
function HeaderMenuButton({
  icon,
  label,
  color,
  bobDelay = 0,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  bobDelay?: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileTap={{ scale: 0.88, rotate: -6 }}
      className="no-select flex shrink-0 flex-col items-center gap-1"
    >
      <motion.span
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, delay: bobDelay, ease: "easeInOut" }}
        whileHover={{ scale: 1.1 }}
        className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-md ring-4 ring-white/50 sm:h-14 sm:w-14"
        style={{ backgroundColor: color }}
      >
        {icon}
      </motion.span>
      <span className="font-heading text-[10px] font-bold text-white drop-shadow-sm sm:text-xs">{label}</span>
    </motion.button>
  );
}

/** A horizontally-scrolling row of story cards with a title and a "see more" nudge arrow. */
function StoryRail({
  title,
  emoji,
  accent,
  items,
  onSelect,
  getProgress,
  isFavorite,
  onToggleFavorite,
}: {
  title: string;
  emoji: string;
  accent: string;
  items: Story[];
  onSelect: (story: Story) => void;
  getProgress?: (story: Story) => number | undefined;
  isFavorite?: (story: Story) => boolean;
  onToggleFavorite?: (story: Story) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ atStart: true, atEnd: true });
  const scrollBy = (dir: 1 | -1) => railRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });

  const updateEdge = () => {
    const rail = railRef.current;
    if (!rail) return;
    setEdge({
      atStart: rail.scrollLeft <= 4,
      atEnd: rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 4,
    });
  };

  useEffect(() => {
    updateEdge();
    window.addEventListener("resize", updateEdge);
    return () => window.removeEventListener("resize", updateEdge);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  if (items.length === 0) return null;

  return (
    <section className="pt-8 landscape-compact:pt-4">
      <div className="safe-px mb-3 flex items-center justify-between">
        <SectionTitle emoji={emoji} title={title} accent={accent} />
        <CircleButton
          icon={<IconChevronRight className="h-5 w-5" />}
          color="white"
          size={40}
          ariaLabel={`Xem thêm ${title}`}
          onClick={() => scrollBy(1)}
          className="hidden can-hover:flex"
        />
      </div>
      <div className="relative">
        <div
          ref={railRef}
          onScroll={updateEdge}
          className="no-scrollbar safe-px flex gap-4 overflow-x-auto pt-3 pb-2"
          style={{ scrollSnapType: "x proximity", ...edgeFadeStyle(edge.atStart, edge.atEnd) }}
        >
          {items.map((story) => (
            <div key={story.id} style={{ scrollSnapAlign: "start" }}>
              <StoryCard
                story={story}
                onSelect={onSelect}
                size="compact"
                progress={getProgress?.(story)}
                favorite={isFavorite?.(story)}
                onToggleFavorite={onToggleFavorite}
              />
            </div>
          ))}
        </div>
        {!edge.atEnd && <ScrollHint side="right" />}
      </div>
    </section>
  );
}

// Stable empty fallbacks - a fresh `{}`/`[]` literal inside the selector would give
// useSyncExternalStore a new reference on every call and loop the render forever.
const EMPTY_PROGRESS: Record<string, { ratio: number; updatedAt: number }> = {};
const EMPTY_FAVORITES: string[] = [];

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

const GREETINGS = [
  { text: "Hôm nay mình khám phá gì nào?", emoji: "🚀", accent: "#5CC8FF" },
  { text: "Bạn Mimo đang chờ mình đó!", emoji: "🦊", accent: "#FFB25C" },
  { text: "Sẵn sàng phiêu lưu chưa nào?", emoji: "🌈", accent: "#B79CFF" },
  { text: "Cùng học tiếng Anh thật vui nhé!", emoji: "🎈", accent: "#FF92C2" },
  { text: "Hôm nay là một ngày siêu tuyệt vời!", emoji: "✨", accent: "#FFD54A" },
  { text: "Xem truyện gì trước nhỉ?", emoji: "🍿", accent: "#8EE28E" },
];

const GREETING_SPARKLES = [
  { top: "-10%", left: "6%", delay: 0, size: "text-base" },
  { top: "-14%", left: "38%", delay: 0.9, size: "text-lg" },
  { top: "6%", left: "94%", delay: 0.5, size: "text-sm" },
  { top: "72%", left: "-3%", delay: 1.3, size: "text-base" },
  { top: "88%", left: "90%", delay: 0.2, size: "text-lg" },
];

/** A big, colorful, tappable mascot card that greets the active child by name. */
function HomeGreeting({ name, gender }: { name: string; gender: "boy" | "girl" }) {
  const greeting = useMemo(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)], [name]);
  const [bump, setBump] = useState(0);

  const handleBoop = () => {
    setBump((n) => n + 1);
    playTick();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -18, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
      className="safe-px relative mt-4"
    >
      <div
        className="relative flex items-center gap-3 overflow-hidden rounded-[28px] py-3 pr-5 pl-3 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${greeting.accent}, #FF92C2)` }}
      >
        {GREETING_SPARKLES.map((s, i) => (
          <motion.span
            key={i}
            aria-hidden
            className={`pointer-events-none absolute ${s.size} text-white/90 drop-shadow-sm`}
            style={{ top: s.top, left: s.left }}
            animate={{ scale: [0.6, 1.2, 0.6], opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
          >
            ✨
          </motion.span>
        ))}

        <motion.button
          type="button"
          onClick={handleBoop}
          aria-label={`Chào ${name}`}
          animate={{ rotate: [0, -14, 12, -10, 8, 0], y: [0, -4, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
          whileTap={{ scale: 0.82 }}
          className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-4xl shadow-md ring-4 ring-white/50 sm:h-[72px] sm:w-[72px] sm:text-5xl"
        >
          <motion.span
            key={bump}
            initial={{ scale: 1.7, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 12 }}
          >
            {gender === "girl" ? "👧" : "👦"}
          </motion.span>
        </motion.button>

        <div className="relative z-10 min-w-0">
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, ease: "easeOut" }}
            className="truncate font-heading text-lg font-extrabold text-white drop-shadow-sm sm:text-2xl"
          >
            {timeOfDayGreeting()}, {name}! 👋
          </motion.p>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.38, ease: "easeOut" }}
            className="truncate font-body text-xs font-semibold text-white/95 sm:text-base"
          >
            {greeting.text} {greeting.emoji}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}

export function Home() {
  const navigate = useNavigate();
  const activeChildId = useAuthStore((s) => s.activeChildId)!;
  const child = useAuthStore((s) => s.children.find((c) => c.id === activeChildId));
  const stars = useAppStore((s) => s.starsByChild[activeChildId] ?? 0);
  const storyProgress = useAppStore((s) => s.storyProgressByChild[activeChildId] ?? EMPTY_PROGRESS);
  const favoriteIds = useFavoritesStore((s) => s.favoritesByChild[activeChildId] ?? EMPTY_FAVORITES);
  const loadFavorites = useFavoritesStore((s) => s.loadFavorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [category, setCategory] = useState<StoryCategory | null>(null);

  useEffect(() => {
    loadFavorites(activeChildId).catch(() => {});
  }, [activeChildId, loadFavorites]);

  const visibleStories = category ? stories.filter((s) => s.category === category) : stories;

  const handleSelect = (story: Story) => navigate(`/story/${story.id}`);
  const isFavorite = (story: Story) => favoriteIds.includes(story.id);
  const handleToggleFavorite = (story: Story) => void toggleFavorite(activeChildId, story.id);

  const continueStories = useMemo(() => {
    return stories
      .map((story) => ({ story, entry: storyProgress[story.id] }))
      .filter(
        (x): x is { story: Story; entry: NonNullable<(typeof storyProgress)[string]> } =>
          !!x.entry && x.entry.ratio > 0.02 && x.entry.ratio < 0.97
      )
      .sort((a, b) => b.entry.updatedAt - a.entry.updatedAt)
      .slice(0, 12);
  }, [storyProgress]);

  const recentlyWatchedStories = useMemo(() => {
    return stories
      .map((story) => ({ story, entry: storyProgress[story.id] }))
      .filter(
        (x): x is { story: Story; entry: NonNullable<(typeof storyProgress)[string]> } => !!x.entry && x.entry.ratio > 0
      )
      .sort((a, b) => b.entry.updatedAt - a.entry.updatedAt)
      .slice(0, 12)
      .map((x) => x.story);
  }, [storyProgress]);

  const favoriteStories = useMemo(
    () => stories.filter((s) => favoriteIds.includes(s.id)),
    [favoriteIds]
  );

  const recommendedStories = useMemo(
    () => (child ? recommendStories(stories, child, storyProgress) : []),
    [child, storyProgress]
  );

  const newStories = useMemo(() => stories.filter((s) => s.tags?.includes("new")), []);

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

  // Same edge-fade idea for the category tray: only fade a side that still has
  // more chips to scroll to, so a short, fully-visible list stays fully opaque.
  const catRailRef = useRef<HTMLDivElement>(null);
  const [catEdge, setCatEdge] = useState({ atStart: true, atEnd: true });

  const updateCatEdge = () => {
    const el = catRailRef.current;
    if (!el) return;
    setCatEdge({
      atStart: el.scrollLeft <= 4,
      atEnd: el.scrollLeft >= el.scrollWidth - el.clientWidth - 4,
    });
  };

  useEffect(() => {
    updateCatEdge();
    window.addEventListener("resize", updateCatEdge);
    return () => window.removeEventListener("resize", updateCatEdge);
  }, []);

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
  // click never grabs pointer capture or nudges scrollLeft - that's what was swallowing taps.
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
    <div className="relative h-full w-full overflow-hidden">
      <SkyBackground />

      <div className="no-scrollbar relative z-10 h-full overflow-y-auto overscroll-contain">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="safe-px safe-pt flex items-start justify-between gap-4"
        >
          <Logo />
          <div className="flex items-start gap-3 sm:gap-4">
            <HeaderMenuButton
              icon={<IconSettings className="h-6 w-6" />}
              label="Cài đặt"
              color="#B79CFF"
              bobDelay={0}
              onClick={() => setSettingsOpen(true)}
            />
            <HeaderMenuButton
              icon={<IconFace className="h-6 w-6" />}
              label="Hồ sơ"
              color="#FF92C2"
              bobDelay={0.4}
              onClick={() => navigate("/profile")}
            />
            <HeaderMenuButton
              icon={<IconFamily className="h-6 w-6" />}
              label="Phụ huynh"
              color="#5CC8FF"
              bobDelay={0.8}
              onClick={() => navigate("/dashboard")}
            />
          </div>
        </motion.header>

        {child && <HomeGreeting name={child.name} gender={child.gender} />}

        <StoryRail
          title="Đang học dở"
          emoji="⭐"
          accent="#FFD54A"
          items={continueStories.map((x) => x.story)}
          onSelect={handleSelect}
          getProgress={(story) => storyProgress[story.id]?.ratio}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
        />

        <StoryRail
          title="Được đề xuất cho bạn"
          emoji="✨"
          accent="#B79CFF"
          items={recommendedStories}
          onSelect={handleSelect}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
        />

        <StoryRail
          title="Yêu thích"
          emoji="❤️"
          accent="#FF7A7A"
          items={favoriteStories}
          onSelect={handleSelect}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
        />

        <section className="pt-8 pb-6 landscape-compact:pt-4">
          <div className="safe-px mb-3 flex items-center justify-between">
            <SectionTitle
              emoji="📚"
              title={`Kho truyện${category ? ` · ${storyCategories.find((c) => c.id === category)?.label}` : ""}`}
              accent="#5CC8FF"
            />
          </div>

          <div className="relative mb-2">
            <div
              ref={catRailRef}
              onScroll={updateCatEdge}
              className="no-scrollbar safe-px flex gap-3 overflow-x-auto pt-2 pb-1"
              style={edgeFadeStyle(catEdge.atStart, catEdge.atEnd, 20)}
            >
              <button
                type="button"
                onClick={() => setCategory(null)}
                className="flex w-[72px] shrink-0 flex-col items-center gap-1.5 sm:w-20"
              >
                <motion.span
                  whileTap={{ scale: 0.92 }}
                  className={`flex h-14 w-14 items-center justify-center rounded-full bg-[#B79CFF] text-white shadow-md ring-4 transition-all sm:h-16 sm:w-16 ${
                    category === null ? "scale-105 ring-white" : "ring-white/40"
                  }`}
                >
                  <IconStar className="h-7 w-7 sm:h-8 sm:w-8" />
                </motion.span>
                <span
                  className={`text-center font-heading text-xs leading-tight font-bold drop-shadow-sm ${
                    category === null ? "text-[#FFD54A]" : "text-white"
                  }`}
                >
                  Tất cả
                </span>
              </button>
              {storyCategories.map((c) => {
                const visual = categoryVisuals[c.id];
                const Icon = visual.icon;
                const active = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className="flex w-[72px] shrink-0 flex-col items-center gap-1.5 sm:w-20"
                  >
                    <motion.span
                      whileTap={{ scale: 0.92 }}
                      className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-md ring-4 transition-all sm:h-16 sm:w-16 ${visual.bg} ${
                        active ? "scale-105 ring-white" : "ring-white/40"
                      }`}
                    >
                      <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
                    </motion.span>
                    <span
                      className={`text-center font-heading text-xs leading-tight font-bold drop-shadow-sm ${
                        active ? "text-[#FFD54A]" : "text-white"
                      }`}
                    >
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {!catEdge.atEnd && <ScrollHint side="right" />}
          </div>

          <div className="safe-px relative flex items-center py-4 landscape-compact:py-2">
            <div className="pointer-events-none absolute inset-0 z-10 hidden can-hover:block">
              <CircleButton
                icon={<IconChevronLeft className="h-7 w-7" />}
                color="white"
                size={56}
                ariaLabel="Truyện trước"
                onClick={() => goTo(-1)}
                disabled={edge.atStart}
                className="pointer-events-auto absolute top-1/2 left-1 -translate-y-1/2"
              />
              <CircleButton
                icon={<IconChevronRight className="h-7 w-7" />}
                color="white"
                size={56}
                ariaLabel="Truyện tiếp theo"
                onClick={() => goTo(1)}
                disabled={edge.atEnd}
                className="pointer-events-auto absolute top-1/2 right-1 -translate-y-1/2"
              />
            </div>

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
              className={`no-select no-scrollbar flex w-full shrink-0 snap-x snap-proximity gap-5 overflow-x-auto pt-3 pb-4 sm:gap-7 landscape-compact:gap-3 landscape-compact:pt-2 ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
              style={{ scrollPadding: "0 8px", ...edgeFadeStyle(edge.atStart, edge.atEnd, 32) }}
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
                  <StoryCard
                    story={story}
                    onSelect={handleSelect}
                    isActive={story.id === activeId}
                    favorite={isFavorite(story)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <StoryRail
          title="Xem gần đây"
          emoji="🕒"
          accent="#6FE0C8"
          items={recentlyWatchedStories}
          onSelect={handleSelect}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
        />

        <StoryRail
          title="Truyện mới"
          emoji="🌸"
          accent="#FF92C2"
          items={newStories}
          onSelect={handleSelect}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
        />

        <motion.footer
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="safe-pb text-center landscape-compact:pb-4"
        >
          <p className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/85 px-6 py-2 font-heading text-sm font-semibold text-slate-600 shadow-md">
            <IconStar className="h-4 w-4 text-[#FFD54A]" />
            Học mà chơi - Chơi mà học - Bé vui mỗi ngày!
            <IconHeart className="h-4 w-4 text-[#FF92C2]" />
          </p>
        </motion.footer>
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
