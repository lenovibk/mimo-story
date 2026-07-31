import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CircleButton } from "@/components/Button/Button";
import { IconChevronLeft, IconChevronRight } from "@/components/Icon/Icon";
import { StoryCard } from "@/components/StoryCard/StoryCard";
import type { Story } from "@/types";
import { playTick, playWhoosh } from "@/utils/sound";

/** Fades whichever edge still has more content to scroll to, so a rail never looks
 * like it just ends mid-list when there's more just out of view. */
function edgeFadeStyle(atStart: boolean, atEnd: boolean, fade = 28) {
  const gradient = `linear-gradient(to right, ${atStart ? "black" : "transparent"} 0px, black ${fade}px, black calc(100% - ${fade}px), ${atEnd ? "black" : "transparent"} 100%)`;
  return { maskImage: gradient, WebkitMaskImage: gradient };
}

/** Tracks scroll-edge state for a horizontally-scrolling rail, shared by every rail across
 * Home and ProgramExplore so each one fades/hints consistently without duplicating the wiring. */
export function useEdgeScrollState(items: unknown[]) {
  const railRef = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ atStart: true, atEnd: true });

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

  return { railRef, edge, updateEdge };
}

/** The scrollable strip of story cards itself, without a header - reused by Home's plain
 * StoryRail (which adds a title above it), by each per-program row, and by ProgramExplore's
 * per-category rows.
 *
 * `interactive` turns on the original "hero carousel" feel: click-and-drag panning on
 * desktop, mouse-wheel support, a centered card that highlights and ticks as it changes,
 * and hover-only prev/next arrows that whoosh. Off by default (compact secondary rails
 * like Continue Watching never had this); ProgramRow's main lesson rail turns it on. */
export function ItemsRail({
  railRef,
  edge,
  onScroll,
  items,
  onSelect,
  getProgress,
  isFavorite,
  onToggleFavorite,
  size = "compact",
  interactive = false,
  edgePad = "page",
  renderItem,
}: {
  railRef: React.RefObject<HTMLDivElement | null>;
  edge: { atStart: boolean; atEnd: boolean };
  onScroll: () => void;
  items: Story[];
  onSelect: (story: Story) => void;
  getProgress?: (story: Story) => number | undefined;
  isFavorite?: (story: Story) => boolean;
  onToggleFavorite?: (story: Story) => void;
  size?: "default" | "compact";
  interactive?: boolean;
  /** "page" bleeds to the screen edge (used for full-width rails); "card" uses a
   * small fixed inset instead, for rails nested inside a program's own card panel
   * where the card's padding already provides the edge margin. */
  edgePad?: "page" | "card";
  /** Swaps the default portrait StoryCard for a different item shape (circle progress ring,
   * wide editorial card, list row, ...) - lets sections that share this same rail mechanic
   * still read as visually distinct "kinds" of shelf instead of every rail looking identical. */
  renderItem?: (story: Story, isActive: boolean) => React.ReactNode;
}) {
  const cardRefs = useRef(new Map<string, HTMLDivElement>());
  const [activeId, setActiveId] = useState(items[0]?.id);
  const [isDragging, setIsDragging] = useState(false);
  // `down`: a mouse button is held. `dragging`: movement crossed the drag threshold, so we're
  // actively panning the rail and should swallow the click that follows.
  const dragState = useRef({ down: false, dragging: false, startX: 0, startScrollLeft: 0 });
  const suppressNextClick = useRef(false);
  const rafRef = useRef<number>(0);
  const DRAG_THRESHOLD = 10;

  // Recompute which card is centered from actual DOM positions (robust to responsive
  // card widths/gaps instead of hardcoding sizes).
  const updateActive = () => {
    const rail = railRef.current;
    if (!rail) return;
    const center = rail.getBoundingClientRect().left + rail.clientWidth / 2;
    let closestId: string | undefined;
    let closestDist = Infinity;
    for (const story of items) {
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
    if (!interactive) return;
    if (railRef.current) railRef.current.scrollLeft = 0;
    setActiveId(items[0]?.id);
    updateActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, interactive]);

  const handleScroll = () => {
    onScroll();
    if (!interactive) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateActive);
  };

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    const rail = railRef.current;
    if (!rail) return;
    // Let a normal (vertical) mouse wheel drive the horizontal rail too.
    rail.scrollLeft += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  };

  // Click-and-drag scrolling for desktop mice (touch/pen keep native momentum scrolling).
  // Dragging only actually engages once the pointer moves past DRAG_THRESHOLD, so a plain
  // click never grabs pointer capture or nudges scrollLeft.
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
    const index = items.findIndex((s) => s.id === activeId);
    const target = items[Math.min(Math.max(index + direction, 0), items.length - 1)];
    const el = target && cardRefs.current.get(target.id);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    playWhoosh(direction);
  };

  return (
    <div className="relative">
      {interactive && (
        <div className="pointer-events-none absolute inset-0 z-10 hidden can-hover:block">
          <CircleButton
            icon={<IconChevronLeft className="h-7 w-7" />}
            color="white"
            size={56}
            ariaLabel="Trước"
            onClick={() => goTo(-1)}
            disabled={edge.atStart}
            className="pointer-events-auto absolute top-1/2 left-1 -translate-y-1/2"
          />
          <CircleButton
            icon={<IconChevronRight className="h-7 w-7" />}
            color="white"
            size={56}
            ariaLabel="Tiếp theo"
            onClick={() => goTo(1)}
            disabled={edge.atEnd}
            className="pointer-events-auto absolute top-1/2 right-1 -translate-y-1/2"
          />
        </div>
      )}

      <div
        ref={railRef}
        onScroll={handleScroll}
        onWheel={interactive ? handleWheel : undefined}
        onPointerDown={interactive ? handlePointerDown : undefined}
        onPointerMove={interactive ? handlePointerMove : undefined}
        onPointerUp={interactive ? endDrag : undefined}
        onPointerLeave={interactive ? endDrag : undefined}
        onPointerCancel={interactive ? endDrag : undefined}
        onClickCapture={interactive ? handleClickCapture : undefined}
        className={
          interactive
            ? `no-select no-scrollbar ${edgePad === "page" ? "safe-px" : "px-1"} flex snap-x snap-proximity gap-4 overflow-x-auto pt-3 pb-4 sm:gap-5 landscape-compact:gap-3 landscape-compact:pt-2 ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`
            : "no-scrollbar safe-px flex gap-4 overflow-x-auto pt-3 pb-2"
        }
        style={{
          ...(interactive ? { scrollPadding: "0 8px" } : { scrollSnapType: "x proximity" as const }),
          ...edgeFadeStyle(edge.atStart, edge.atEnd, interactive ? 32 : 28),
        }}
      >
        {items.map((story) => (
          <div
            key={story.id}
            ref={(el) => {
              if (!interactive) return;
              if (el) cardRefs.current.set(story.id, el);
              else cardRefs.current.delete(story.id);
            }}
            style={{ scrollSnapAlign: "start" }}
          >
            {renderItem ? (
              renderItem(story, interactive ? story.id === activeId : true)
            ) : (
              <StoryCard
                story={story}
                onSelect={onSelect}
                size={size}
                isActive={interactive ? story.id === activeId : true}
                progress={getProgress?.(story)}
                favorite={isFavorite?.(story)}
                onToggleFavorite={onToggleFavorite}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const CONNECTOR_STICKERS = ["✈️", "🌟", "🎈", "⭐"];

/** The soft dotted "flight path" that links one section to the next (greeting → first
 * program, then card → card, or category → category on ProgramExplore), so scrolling down
 * still feels like the same exploring-adventure motif as the greeting card's dashed outline:
 * a little star setting off, a gentle curved dotted trail, and a drifting plane/star/balloon
 * sticker landing at the other end. Purely decorative - aria-hidden, no layout weight. */
export function SectionConnector({ index, color, sticker }: { index: number; color: string; sticker?: string }) {
  const endSticker = sticker ?? CONNECTOR_STICKERS[index % CONNECTOR_STICKERS.length];
  const flip = index % 2 === 1;

  return (
    <div aria-hidden className="safe-px relative flex h-10 items-center justify-center landscape-compact:h-6">
      <motion.span
        className="absolute left-[10%] text-sm drop-shadow-sm"
        animate={{ scale: [0.8, 1.15, 0.8], rotate: [0, 12, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        ⭐
      </motion.span>
      <svg
        viewBox="0 0 200 24"
        preserveAspectRatio="none"
        className={`h-6 w-2/3 max-w-[220px] ${flip ? "-scale-x-100" : ""}`}
      >
        <path
          d="M2 20 Q 60 2 100 12 T 198 4"
          fill="none"
          stroke={color}
          strokeOpacity={0.4}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray="0.5 8"
        />
      </svg>
      <motion.span
        className="absolute right-[10%] text-lg drop-shadow-sm"
        animate={{ y: [0, -5, 0], rotate: flip ? [0, 8, 0] : [0, -8, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      >
        {endSticker}
      </motion.span>
    </div>
  );
}

/** The pastel, rounded, softly-shadowed card panel every shelf on this page and on
 * ProgramExplore sits inside - a program row, a plain rail (Continue Watching, Favorites, ...),
 * or a category row all use this same shell so the "each section is its own separated module"
 * look stays consistent everywhere, tinted by whatever color that particular shelf owns. Draws
 * its own connector above itself when `index > 0`, so callers never have to remember to. */
export function SectionCard({
  index,
  color,
  children,
}: {
  index: number;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative">
      {index > 0 && <SectionConnector index={index} color={color} />}

      <div className="safe-px">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[32px] p-3 shadow-[0_6px_18px_rgba(0,0,0,0.07)] ring-1 ring-white/60 sm:p-4"
          style={{
            background: `linear-gradient(160deg, color-mix(in srgb, ${color} 26%, white) 0%, color-mix(in srgb, ${color} 11%, white) 100%)`,
          }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}

/** A bold white "sticker" outline behind a section title's own tint color - built from layered
 * text-shadows (rather than -webkit-text-stroke, which Firefox doesn't support) so the title
 * pops off its pastel card the same playful way every other label on this page does. */
const OUTLINE_OFFSETS = [
  [-1.5, -1.5],
  [0, -1.5],
  [1.5, -1.5],
  [-1.5, 0],
  [1.5, 0],
  [-1.5, 1.5],
  [0, 1.5],
  [1.5, 1.5],
] as const;

export function sectionTitleStyle(color: string): React.CSSProperties {
  return {
    color,
    textShadow: OUTLINE_OFFSETS.map(([x, y]) => `${x}px ${y}px 0 #fff`).join(", "),
  };
}
