import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdBanner } from "@/components/AdBanner/AdBanner";
import { IconChevronRight, IconFamily, IconFace, IconHeart, IconSettings, IconStar } from "@/components/Icon/Icon";
import {
  ItemsRail,
  SectionCard,
  SectionConnector,
  sectionTitleStyle,
  useEdgeScrollState,
} from "@/components/ItemsRail/ItemsRail";
import { Logo } from "@/components/Logo/Logo";
import { SkyBackground } from "@/components/SkyBackground/SkyBackground";
import { StoryCard } from "@/components/StoryCard/StoryCard";
import { StoryCardListRow } from "@/components/StoryCard/StoryCardListRow";
import { StoryCardWide } from "@/components/StoryCard/StoryCardWide";
import { getProgramIcon } from "@/data/programVisuals";
import { useEnsureCatalogLoaded } from "@/hooks/useEnsureCatalogLoaded";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/translate";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useCatalogStore } from "@/store/useCatalogStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import type { Program, Story } from "@/types";
import { recommendStories } from "@/utils/recommend";
import { playTick } from "@/utils/sound";

/** A colorful sticker-badge + bold label used to head every rail/section, so each one reads
 * as its own distinct "shelf" instead of a plain white heading blending into the next. Sits on
 * its own pastel card now, so the label reads in a dark ink color like ProgramHeading rather
 * than the drop-shadowed white this used before every rail got a card of its own. */
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
      <span
        className="font-heading text-lg font-extrabold tracking-tight sm:text-xl"
        style={sectionTitleStyle(`color-mix(in srgb, ${accent} 65%, #2b2540)`)}
      >
        {title}
      </span>
    </h2>
  );
}

/** Same sticker-badge language as SectionTitle, but for a program's own icon component
 * instead of an emoji - each program row is headed by its own icon and color. Sits on the
 * program's own pastel card now (not the open sky background), so the label reads in a dark
 * ink color instead of the drop-shadowed white used everywhere else on this page. */
function ProgramHeading({ program }: { program: Program }) {
  const Icon = getProgramIcon(program.icon);
  return (
    <h2 className="flex items-center gap-2.5">
      <motion.span
        aria-hidden
        initial={{ scale: 0, rotate: -25 }}
        whileInView={{ scale: 1, rotate: -8 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 280, damping: 14 }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ring-2 ring-white/70 sm:h-10 sm:w-10"
        style={{ backgroundColor: program.color }}
      >
        <Icon className="h-5 w-5" />
      </motion.span>
      <span
        className="font-heading text-lg font-extrabold tracking-tight sm:text-xl"
        style={sectionTitleStyle(`color-mix(in srgb, ${program.color} 65%, #2b2540)`)}
      >
        {program.label}
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

/** A horizontally-scrolling row of story cards with a title above it, inside the same pastel
 * card shell every other shelf on the page uses. `renderItem` swaps in a different item shape
 * (progress ring, wide editorial card, list row, ...) so this rail reads as a distinct "kind"
 * of shelf instead of just another color of the same portrait-card rail. */
function StoryRail({
  index,
  title,
  emoji,
  accent,
  items,
  onSelect,
  getProgress,
  isFavorite,
  onToggleFavorite,
  renderItem,
}: {
  index: number;
  title: string;
  emoji: string;
  accent: string;
  items: Story[];
  onSelect: (story: Story) => void;
  getProgress?: (story: Story) => number | undefined;
  isFavorite?: (story: Story) => boolean;
  onToggleFavorite?: (story: Story) => void;
  renderItem?: (story: Story, isActive: boolean) => React.ReactNode;
}) {
  const { railRef, edge, updateEdge } = useEdgeScrollState(items);

  if (items.length === 0) return null;

  return (
    <SectionCard index={index} color={accent}>
      <div className="mb-1">
        <SectionTitle emoji={emoji} title={title} accent={accent} />
      </div>
      <ItemsRail
        railRef={railRef}
        edge={edge}
        onScroll={updateEdge}
        items={items}
        onSelect={onSelect}
        getProgress={getProgress}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
        edgePad="card"
        renderItem={renderItem}
      />
    </SectionCard>
  );
}

/** The pill that replaces inline category filtering on a program's card - tapping it is
 * the only way into that program's categories now, via a dedicated full-screen browser
 * (see ProgramExplore), so every program card stays a clean title + two-card teaser instead
 * of a cluttered row of filter chips. */
function ExploreButton({ color, onClick }: { color: string; onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full border-2 border-dashed bg-white/85 py-1.5 pr-2.5 pl-1.5 shadow-sm"
      style={{ borderColor: `${color}90` }}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: color }}
      >
        <IconStar className="h-3.5 w-3.5" />
      </span>
      <span className="font-heading text-xs font-bold whitespace-nowrap" style={{ color }}>
        {t("home.exploreLabel")}
      </span>
      <IconChevronRight className="h-3.5 w-3.5" style={{ color }} />
    </motion.button>
  );
}

/** One program's own module: an icon + name on the left, its category filter pills on the
 * right (same row), and its story rail below - all inside a single rounded pastel card so
 * each program reads as its own self-contained shelf. Renders nothing when the program has
 * no stories at all, so an empty program never shows up as a dead card. */
function ProgramRow({
  program,
  index,
  stories,
  onSelect,
  getProgress,
  isFavorite,
  onToggleFavorite,
}: {
  program: Program;
  index: number;
  stories: Story[];
  onSelect: (story: Story) => void;
  getProgress?: (story: Story) => number | undefined;
  isFavorite?: (story: Story) => boolean;
  onToggleFavorite?: (story: Story) => void;
}) {
  const navigate = useNavigate();
  const { railRef, edge, updateEdge } = useEdgeScrollState(stories);

  if (stories.length === 0) return null;

  return (
    <SectionCard index={index} color={program.color}>
      <div className="mb-1 flex items-center gap-3">
        <div className="min-w-0 shrink-0">
          <ProgramHeading program={program} />
        </div>
        <ExploreButton color={program.color} onClick={() => navigate(`/program/${program.id}`)} />
      </div>

      <ItemsRail
        railRef={railRef}
        edge={edge}
        onScroll={updateEdge}
        items={stories}
        onSelect={onSelect}
        getProgress={getProgress}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
        size="compact"
        interactive
        edgePad="card"
      />
    </SectionCard>
  );
}

// Stable empty fallbacks - a fresh `{}`/`[]` literal inside the selector would give
// useSyncExternalStore a new reference on every call and loop the render forever.
const EMPTY_PROGRESS: Record<string, { ratio: number; updatedAt: number }> = {};
const EMPTY_FAVORITES: string[] = [];

function timeOfDayGreetingKey(): TranslationKey {
  const hour = new Date().getHours();
  if (hour < 11) return "home.timeMorning";
  if (hour < 14) return "home.timeNoon";
  if (hour < 18) return "home.timeAfternoon";
  return "home.timeEvening";
}

const GREETINGS: { key: TranslationKey; emoji: string; accent: string }[] = [
  { key: "home.greeting1", emoji: "🚀", accent: "#5CC8FF" },
  { key: "home.greeting2", emoji: "🦊", accent: "#FFB25C" },
  { key: "home.greeting3", emoji: "🌈", accent: "#B79CFF" },
  { key: "home.greeting4", emoji: "🎈", accent: "#FF92C2" },
  { key: "home.greeting5", emoji: "✨", accent: "#FFD54A" },
  { key: "home.greeting6", emoji: "🍿", accent: "#8EE28E" },
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
  const { t } = useTranslation();
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
        className="relative flex items-center gap-3 overflow-hidden rounded-[28px] border-2 border-dashed border-white py-3 pr-5 pl-3 shadow-lg"
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
          aria-label={t("home.greetingAriaLabel", { name })}
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
            {t(timeOfDayGreetingKey())}, {name}! 👋
          </motion.p>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.38, ease: "easeOut" }}
            className="truncate font-body text-xs font-semibold text-white/95 sm:text-base"
          >
            {t(greeting.key)} {greeting.emoji}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}

export function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  useEnsureCatalogLoaded();
  const stories = useCatalogStore((s) => s.stories);
  const programs = useCatalogStore((s) => s.programs);
  const activeChildId = useAuthStore((s) => s.activeChildId)!;
  const child = useAuthStore((s) => s.children.find((c) => c.id === activeChildId));
  const storyProgress = useAppStore((s) => s.storyProgressByChild[activeChildId] ?? EMPTY_PROGRESS);
  const favoriteIds = useFavoritesStore((s) => s.favoritesByChild[activeChildId] ?? EMPTY_FAVORITES);
  const loadFavorites = useFavoritesStore((s) => s.loadFavorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  useEffect(() => {
    loadFavorites(activeChildId).catch(() => {});
  }, [activeChildId, loadFavorites]);

  // Only programs whose discrete age list includes this child's age are ever shown.
  const eligiblePrograms = useMemo(
    () => (child ? programs.filter((p) => p.ages.includes(child.age)) : []),
    [programs, child]
  );

  // Each program gets its own story list up front, so a program with zero stories can be
  // skipped entirely instead of rendering as an empty shelf.
  const programSections = useMemo(
    () => eligiblePrograms.map((p) => ({ program: p, stories: stories.filter((s) => s.programs.includes(p.id)) })),
    [eligiblePrograms, stories]
  );

  const handleSelect = (story: Story) => navigate(`/story/${story.id}`);
  const isFavorite = (story: Story) => favoriteIds.includes(story.id);
  const handleToggleFavorite = (story: Story) => void toggleFavorite(activeChildId, story.id);

  const recentlyWatchedStories = useMemo(() => {
    return stories
      .map((story) => ({ story, entry: storyProgress[story.id] }))
      .filter(
        (x): x is { story: Story; entry: NonNullable<(typeof storyProgress)[string]> } => !!x.entry && x.entry.ratio > 0
      )
      .sort((a, b) => b.entry.updatedAt - a.entry.updatedAt)
      .slice(0, 12)
      .map((x) => x.story);
  }, [stories, storyProgress]);

  const favoriteStories = useMemo(
    () => stories.filter((s) => favoriteIds.includes(s.id)),
    [stories, favoriteIds]
  );

  const recommendedStories = useMemo(
    () => (child ? recommendStories(stories, child, storyProgress) : []),
    [stories, child, storyProgress]
  );

  const newStories = useMemo(() => stories.filter((s) => s.tags?.includes("new")), [stories]);

  // Each of these secondary shelves gets its own item shape (progress ring, wide editorial
  // card, list row, ...) instead of every rail using the same portrait StoryCard, so the page
  // reads as several different *kinds* of shelf, not just the same rail repeated in new colors.
  // Filtered to non-empty up front (rather than inside StoryRail) so the `index` handed to each
  // one - and therefore which ones get a connector drawn above them - stays contiguous.
  const utilityRails = [
    {
      key: "recommended",
      title: t("home.railRecommended"),
      emoji: "✨",
      accent: "#B79CFF",
      items: recommendedStories,
      renderItem: (story: Story) => (
        <StoryCardWide story={story} onSelect={handleSelect} favorite={isFavorite(story)} onToggleFavorite={handleToggleFavorite} />
      ),
    },
    {
      key: "favorites",
      title: t("home.railFavorites"),
      emoji: "❤️",
      accent: "#FF7A7A",
      items: favoriteStories,
      renderItem: (story: Story) => (
        <StoryCard
          story={story}
          shape="square"
          onSelect={handleSelect}
          favorite={isFavorite(story)}
          onToggleFavorite={handleToggleFavorite}
        />
      ),
    },
    {
      key: "recent",
      title: t("home.railRecent"),
      emoji: "🕒",
      accent: "#6FE0C8",
      items: recentlyWatchedStories,
      renderItem: (story: Story) => (
        <StoryCardListRow
          story={story}
          onSelect={handleSelect}
          progress={storyProgress[story.id]?.ratio}
          favorite={isFavorite(story)}
          onToggleFavorite={handleToggleFavorite}
        />
      ),
    },
    {
      key: "new",
      title: t("home.railNew"),
      emoji: "🌸",
      accent: "#FF92C2",
      items: newStories,
      renderItem: undefined,
    },
  ].filter((rail) => rail.items.length > 0);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <SkyBackground />

      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="safe-px safe-pt shrink-0 flex items-start justify-between gap-4"
        >
          <Logo />
          <div className="flex items-start gap-3 sm:gap-4">
            <HeaderMenuButton
              icon={<IconSettings className="h-6 w-6" />}
              label={t("home.settingsLabel")}
              color="#B79CFF"
              bobDelay={0}
              onClick={() => navigate("/settings")}
            />
            <HeaderMenuButton
              icon={<IconFace className="h-6 w-6" />}
              label={t("home.profileLabel")}
              color="#FF92C2"
              bobDelay={0.4}
              onClick={() => navigate("/profile")}
            />
            <HeaderMenuButton
              icon={<IconFamily className="h-6 w-6" />}
              label={t("home.parentLabel")}
              color="#5CC8FF"
              bobDelay={0.8}
              onClick={() => navigate("/dashboard")}
            />
          </div>
        </motion.header>

        {/* Only the header above stays put - the greeting scrolls away with everything
            else, and the grass/decoration painted into the sky background never moves
            either way since it lives outside this scroller entirely. */}
        <div className="no-scrollbar relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {child && <HomeGreeting name={child.name} gender={child.gender} />}

          {programSections.length > 0 && (
            <SectionConnector index={0} color={programSections[0].program.color} sticker="✈️" />
          )}

          {programSections.map(({ program, stories: rowStories }, i) => (
            <ProgramRow
              key={program.id}
              program={program}
              index={i}
              stories={rowStories}
              onSelect={handleSelect}
              getProgress={(story) => storyProgress[story.id]?.ratio}
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}

          <AdBanner age={child?.age} />

          {utilityRails.map((rail, i) => (
            <StoryRail
              key={rail.key}
              index={i}
              title={rail.title}
              emoji={rail.emoji}
              accent={rail.accent}
              items={rail.items}
              onSelect={handleSelect}
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
              renderItem={rail.renderItem}
            />
          ))}

          <motion.footer
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="safe-pb pt-8 text-center landscape-compact:pb-4"
          >
            <p className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/85 px-6 py-2 font-heading text-sm font-semibold text-slate-600 shadow-md">
              <IconStar className="h-4 w-4 text-[#FFD54A]" />
              {t("home.footerTagline")}
              <IconHeart className="h-4 w-4 text-[#FF92C2]" />
            </p>
          </motion.footer>
        </div>
      </div>
    </div>
  );
}
