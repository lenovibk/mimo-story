import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { CircleButton } from "@/components/Button/Button";
import { IconChevronLeft } from "@/components/Icon/Icon";
import { ItemsRail, SectionCard, sectionTitleStyle, useEdgeScrollState } from "@/components/ItemsRail/ItemsRail";
import { SkyBackground } from "@/components/SkyBackground/SkyBackground";
import { getCategoryIcon } from "@/data/categoryVisuals";
import { getProgramIcon } from "@/data/programVisuals";
import { useEnsureCatalogLoaded } from "@/hooks/useEnsureCatalogLoaded";
import { useTranslation } from "@/i18n/useTranslation";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useCatalogStore } from "@/store/useCatalogStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import type { Category, Story } from "@/types";

const EMPTY_PROGRESS: Record<string, { ratio: number; updatedAt: number }> = {};
const EMPTY_FAVORITES: string[] = [];

/** One category's own module inside the explorer: icon + label on the left, its complete
 * (unfiltered, unpaged) list of lessons below - same pastel-card language as a program's
 * shelf on the home page, just keyed to the category's own color instead of the program's. */
function CategorySection({
  category,
  index,
  stories,
  onSelect,
  getProgress,
  isFavorite,
  onToggleFavorite,
}: {
  category: Category;
  index: number;
  stories: Story[];
  onSelect: (story: Story) => void;
  getProgress?: (story: Story) => number | undefined;
  isFavorite?: (story: Story) => boolean;
  onToggleFavorite?: (story: Story) => void;
}) {
  const Icon = getCategoryIcon(category.icon);
  const { railRef, edge, updateEdge } = useEdgeScrollState(stories);

  if (stories.length === 0) return null;

  return (
    <SectionCard index={index} color={category.color}>
      <h2 className="mb-1 flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ring-2 ring-white/70 sm:h-10 sm:w-10"
          style={{ backgroundColor: category.color }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span
          className="font-heading text-lg font-extrabold tracking-tight sm:text-xl"
          style={sectionTitleStyle(`color-mix(in srgb, ${category.color} 65%, #2b2540)`)}
        >
          {category.label}
        </span>
      </h2>

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

/** The "Khám phá" destination for one program: every one of its categories, each showing
 * its complete lesson list - reuses Home's visual language (pastel cards, dotted flight-path
 * connectors, sky background) but drops the greeting entirely to keep the focus on lessons. */
export function ProgramExplore() {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  useEnsureCatalogLoaded();

  const programs = useCatalogStore((s) => s.programs);
  const stories = useCatalogStore((s) => s.stories);
  const categories = useCatalogStore((s) => s.categories);
  const activeChildId = useAuthStore((s) => s.activeChildId)!;
  const storyProgress = useAppStore((s) => s.storyProgressByChild[activeChildId] ?? EMPTY_PROGRESS);
  const favoriteIds = useFavoritesStore((s) => s.favoritesByChild[activeChildId] ?? EMPTY_FAVORITES);
  const loadFavorites = useFavoritesStore((s) => s.loadFavorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  useEffect(() => {
    loadFavorites(activeChildId).catch(() => {});
  }, [activeChildId, loadFavorites]);

  const program = programs.find((p) => p.id === programId);

  const programStories = useMemo(
    () => (program ? stories.filter((s) => s.programs.includes(program.id)) : []),
    [stories, program]
  );
  const programCategories = useMemo(
    () => categories.filter((c) => programStories.some((s) => s.category === c.id)),
    [categories, programStories]
  );

  if (programs.length > 0 && !program) return <Navigate to="/home" replace />;

  const handleSelect = (story: Story) => navigate(`/story/${story.id}`);
  const isFavorite = (story: Story) => favoriteIds.includes(story.id);
  const handleToggleFavorite = (story: Story) => void toggleFavorite(activeChildId, story.id);
  const ProgramIcon = program ? getProgramIcon(program.icon) : null;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <SkyBackground />

      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="safe-px safe-pt flex shrink-0 items-center gap-4"
        >
          <CircleButton
            icon={<IconChevronLeft className="h-6 w-6" />}
            color="white"
            size={48}
            ariaLabel={t("programExplore.backAriaLabel")}
            onClick={() => navigate(-1)}
          />
          {program && ProgramIcon && (
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ring-2 ring-white/70"
                style={{ backgroundColor: program.color }}
              >
                <ProgramIcon className="h-5 w-5" />
              </span>
              <span className="truncate font-heading text-lg font-extrabold tracking-tight text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.25)] sm:text-xl">
                {program.label}
              </span>
            </div>
          )}
        </motion.header>

        <div className="no-scrollbar relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="h-4" />
          {programCategories.map((category, i) => (
            <CategorySection
              key={category.id}
              category={category}
              index={i}
              stories={programStories.filter((s) => s.category === category.id)}
              onSelect={handleSelect}
              getProgress={(story) => storyProgress[story.id]?.ratio}
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
          <div className="safe-pb h-8" />
        </div>
      </div>
    </div>
  );
}
