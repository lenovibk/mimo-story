/**
 * One-time seed: copies the 10 categories and 70 stories that used to live as
 * hardcoded arrays in app/src/data/{stories.ts,categoryVisuals.tsx} into the
 * DB, so admin CRUD has real data on day one. Story ids and cover/video/
 * subtitle paths are kept exactly as before (relative /stories/storyNNN/...)
 * since those files still ship inside app/public and aren't moving.
 *
 * Idempotent: safe to re-run (upserts by slug/id).
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { slug: "animals", label: "Động vật", icon: "paw", color: "#FF92C2", order: 0 },
  { slug: "emotions", label: "Cảm xúc & Kỹ năng sống", icon: "face", color: "#FFD54A", order: 1 },
  { slug: "body", label: "Cơ thể & Sức khỏe", icon: "pulse", color: "#FF7A7A", order: 2 },
  { slug: "family", label: "Gia đình & Bạn bè", icon: "family", color: "#5CC8FF", order: 3 },
  { slug: "weather", label: "Thời tiết & Mùa", icon: "cloud-rain", color: "#8FDBFF", order: 4 },
  { slug: "holidays", label: "Lễ hội & Tiệc vui", icon: "tree", color: "#8EE28E", order: 5 },
  { slug: "school", label: "Trường học & Học tập", icon: "book", color: "#B79CFF", order: 6 },
  { slug: "activities", label: "Trò chơi & Hoạt động", icon: "ball", color: "#FFB25C", order: 7 },
  { slug: "food", label: "Ăn uống", icon: "burger", color: "#FFC7A0", order: 8 },
  { slug: "world", label: "Thế giới xung quanh", icon: "globe", color: "#6FE0C8", order: 9 },
];

type SeedStory = {
  id: string;
  title: string;
  episodeLabel: string;
  duration: number;
  category: string;
  tags?: string[];
  accent: string;
};

const stories: SeedStory[] = [
  { id: "story001", title: "Bat and Friends", episodeLabel: "Tập 01", duration: 130, category: "animals", accent: "primary" },
  { id: "story002", title: "This Is My Body", episodeLabel: "Tập 02", duration: 132, category: "body", tags: ["featured"], accent: "yellow" },
  { id: "story003", title: "Float or Sink", episodeLabel: "Tập 03", duration: 80, category: "activities", accent: "pink" },
  { id: "story004", title: "I Like Ice Cream", episodeLabel: "Tập 04", duration: 78, category: "food", tags: ["featured"], accent: "green" },
  { id: "story005", title: "Merry Christmas!", episodeLabel: "Tập 05", duration: 83, category: "holidays", accent: "primary" },
  { id: "story006", title: "I See", episodeLabel: "Tập 06", duration: 72, category: "body", accent: "yellow" },
  { id: "story007", title: "Our Faces", episodeLabel: "Tập 07", duration: 95, category: "body", accent: "pink" },
  { id: "story008", title: "Sad, Sadder, Saddest", episodeLabel: "Tập 08", duration: 92, category: "emotions", accent: "green" },
  { id: "story009", title: "Snowball", episodeLabel: "Tập 09", duration: 55, category: "weather", accent: "primary" },
  { id: "story010", title: "Don't Be Sad! Be Happy!", episodeLabel: "Tập 10", duration: 77, category: "emotions", accent: "yellow" },
  { id: "story011", title: "Splat!", episodeLabel: "Tập 11", duration: 81, category: "activities", accent: "pink" },
  { id: "story012", title: "Freddy, Fanny, and Felix", episodeLabel: "Tập 12", duration: 75, category: "family", accent: "green" },
  { id: "story013", title: "Red Light, Green Light", episodeLabel: "Tập 13", duration: 55, category: "activities", accent: "primary" },
  { id: "story014", title: "My Team", episodeLabel: "Tập 14", duration: 110, category: "activities", accent: "yellow" },
  { id: "story015", title: "Look Left, Look Right", episodeLabel: "Tập 15", duration: 69, category: "emotions", accent: "pink" },
  { id: "story016", title: "It's Snowy", episodeLabel: "Tập 16", duration: 89, category: "weather", accent: "green" },
  { id: "story017", title: "Who Is It", episodeLabel: "Tập 17", duration: 72, category: "activities", accent: "primary" },
  { id: "story018", title: "The Best", episodeLabel: "Tập 18", duration: 59, category: "emotions", tags: ["featured"], accent: "yellow" },
  { id: "story019", title: "Dinosaurs", episodeLabel: "Tập 19", duration: 70, category: "animals", tags: ["featured"], accent: "pink" },
  { id: "story020", title: "Baseball!", episodeLabel: "Tập 20", duration: 61, category: "activities", accent: "green" },
  { id: "story021", title: "Morning, Afternoon, Evening, Night", episodeLabel: "Tập 21", duration: 132, category: "world", accent: "primary" },
  { id: "story022", title: "At the Zoo", episodeLabel: "Tập 22", duration: 78, category: "animals", tags: ["featured"], accent: "yellow" },
  { id: "story023", title: "One Cloud, Many Clouds", episodeLabel: "Tập 23", duration: 94, category: "weather", accent: "pink" },
  { id: "story024", title: "My Piggy Bank", episodeLabel: "Tập 24", duration: 114, category: "world", accent: "green" },
  { id: "story025", title: "On the Hill", episodeLabel: "Tập 25", duration: 124, category: "world", accent: "primary" },
  { id: "story026", title: "Cute!", episodeLabel: "Tập 26", duration: 120, category: "emotions", accent: "yellow" },
  { id: "story027", title: "Musical Chairs", episodeLabel: "Tập 27", duration: 169, category: "activities", tags: ["featured"], accent: "pink" },
  { id: "story028", title: "The Ant", episodeLabel: "Tập 28", duration: 48, category: "animals", accent: "green" },
  { id: "story029", title: "Lift and Look with Maxie", episodeLabel: "Tập 29", duration: 72, category: "animals", accent: "primary" },
  { id: "story030", title: "Sledding", episodeLabel: "Tập 30", duration: 50, category: "activities", accent: "yellow" },
  { id: "story031", title: "Me Too!", episodeLabel: "Tập 31", duration: 83, category: "family", accent: "pink" },
  { id: "story032", title: "Pick Up a Leaf", episodeLabel: "Tập 32", duration: 47, category: "weather", accent: "green" },
  { id: "story033", title: "At the Beach", episodeLabel: "Tập 33", duration: 55, category: "activities", accent: "primary" },
  { id: "story034", title: "On a Rainy Day", episodeLabel: "Tập 34", duration: 77, category: "weather", accent: "yellow" },
  { id: "story035", title: "Costume Party", episodeLabel: "Tập 35", duration: 78, category: "holidays", accent: "pink" },
  { id: "story036", title: "Dark Cloud", episodeLabel: "Tập 36", duration: 70, category: "weather", accent: "green" },
  { id: "story037", title: "Ouch!", episodeLabel: "Tập 37", duration: 84, category: "body", accent: "primary" },
  { id: "story038", title: "Surprise, Teacher!", episodeLabel: "Tập 38", duration: 91, category: "school", accent: "yellow" },
  { id: "story039", title: "New Home", episodeLabel: "Tập 39", duration: 79, category: "family", tags: ["featured"], accent: "pink" },
  { id: "story040", title: "What Do You See", episodeLabel: "Tập 40", duration: 99, category: "body", accent: "green" },
  { id: "story041", title: "Pop the Popcorn!", episodeLabel: "Tập 41", duration: 74, category: "food", accent: "primary" },
  { id: "story042", title: "On the Stage", episodeLabel: "Tập 42", duration: 108, category: "school", accent: "yellow" },
  { id: "story043", title: "Where Is Fluffy", episodeLabel: "Tập 43", duration: 73, category: "animals", accent: "pink" },
  { id: "story044", title: "Sharing", episodeLabel: "Tập 44", duration: 57, category: "emotions", tags: ["featured"], accent: "green" },
  { id: "story045", title: "We Smile", episodeLabel: "Tập 45", duration: 57, category: "emotions", accent: "primary" },
  { id: "story046", title: "I Can Walk", episodeLabel: "Tập 46", duration: 67, category: "body", accent: "yellow" },
  { id: "story047", title: "Dressing Up", episodeLabel: "Tập 47", duration: 108, category: "world", accent: "pink" },
  { id: "story048", title: "At School", episodeLabel: "Tập 48", duration: 59, category: "school", accent: "green" },
  { id: "story049", title: "Seasons Are Fun", episodeLabel: "Tập 49", duration: 72, category: "weather", accent: "primary" },
  { id: "story050", title: "Dig a Little Hole", episodeLabel: "Tập 50", duration: 67, category: "activities", accent: "yellow" },
  { id: "story051", title: "What Is Missing", episodeLabel: "Tập 51", duration: 83, category: "activities", accent: "pink" },
  { id: "story052", title: "Go, Go, Go!", episodeLabel: "Tập 52", duration: 151, category: "activities", accent: "green" },
  { id: "story053", title: "Grandpa's Farm", episodeLabel: "Tập 53", duration: 85, category: "animals", accent: "primary" },
  { id: "story054", title: "I See a Pattern", episodeLabel: "Tập 54", duration: 58, category: "school", accent: "yellow" },
  { id: "story055", title: "Mr. Shapey", episodeLabel: "Tập 55", duration: 75, category: "school", tags: ["featured"], accent: "pink" },
  { id: "story056", title: "Spring Is Here", episodeLabel: "Tập 56", duration: 55, category: "weather", accent: "green" },
  { id: "story057", title: "Pass the Pie Please", episodeLabel: "Tập 57", duration: 83, category: "food", accent: "primary" },
  { id: "story058", title: "Big and Small", episodeLabel: "Tập 58", duration: 61, category: "school", accent: "yellow" },
  { id: "story059", title: "Who Is Working", episodeLabel: "Tập 59", duration: 71, category: "world", accent: "pink" },
  { id: "story060", title: "Dreams", episodeLabel: "Tập 60", duration: 59, category: "emotions", accent: "green" },
  { id: "story061", title: "Teddy's Day", episodeLabel: "Tập 61", duration: 58, category: "world", tags: ["featured"], accent: "primary" },
  { id: "story062", title: "Winter", episodeLabel: "Tập 62", duration: 52, category: "weather", accent: "yellow" },
  { id: "story063", title: "Snowman", episodeLabel: "Tập 63", duration: 60, category: "weather", tags: ["featured"], accent: "pink" },
  { id: "story064", title: "Rainbow Car", episodeLabel: "Tập 64", duration: 49, category: "school", accent: "green" },
  { id: "story065", title: "Christmas Is Coming", episodeLabel: "Tập 65", duration: 75, category: "holidays", tags: ["new", "featured"], accent: "primary" },
  { id: "story066", title: "Into the Pot", episodeLabel: "Tập 66", duration: 61, category: "food", tags: ["new"], accent: "yellow" },
  { id: "story067", title: "Balloons", episodeLabel: "Tập 67", duration: 70, category: "holidays", tags: ["new"], accent: "pink" },
  { id: "story068", title: "Greedy Monkey", episodeLabel: "Tập 68", duration: 56, category: "animals", tags: ["new"], accent: "green" },
  { id: "story069", title: "Happy Birthday", episodeLabel: "Tập 69", duration: 92, category: "holidays", tags: ["new", "featured"], accent: "primary" },
  { id: "story070", title: "Fables on Helping & Being Helped", episodeLabel: "Tập 70", duration: 452, category: "emotions", tags: ["new"], accent: "yellow" },
];

async function main() {
  const categoryIdBySlug = new Map<string, string>();

  for (const c of categories) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { label: c.label, icon: c.icon, color: c.color, order: c.order },
      create: c,
    });
    categoryIdBySlug.set(c.slug, row.id);
  }

  for (const s of stories) {
    const categoryId = categoryIdBySlug.get(s.category);
    if (!categoryId) throw new Error(`Unknown category slug "${s.category}" for story ${s.id}`);

    const base = `/stories/${s.id}`;
    const data = {
      title: s.title,
      episodeLabel: s.episodeLabel,
      coverUrl: `${base}/cover.webp`,
      videoUrl: `${base}/video.webm`,
      subtitleEnUrl: `${base}/subtitle_en.srt`,
      subtitleViUrl: `${base}/subtitle_vi.srt`,
      duration: s.duration,
      accent: s.accent,
      categoryId,
    };

    await prisma.story.upsert({
      where: { id: s.id },
      update: {
        ...data,
        tags: { deleteMany: {}, create: (s.tags ?? []).map((tag) => ({ tag })) },
      },
      create: {
        id: s.id,
        ...data,
        tags: { create: (s.tags ?? []).map((tag) => ({ tag })) },
      },
    });
  }

  console.log(`Seeded ${categories.length} categories and ${stories.length} stories.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
