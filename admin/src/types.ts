export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export interface Category {
  id: string;
  slug: string;
  label: string;
  icon: string;
  color: string;
  order: number;
  storyCount: number;
}

export interface Program {
  id: string;
  slug: string;
  label: string;
  icon: string;
  color: string;
  order: number;
  published: boolean;
  storyCount: number;
  ages: number[];
  categoryIds: string[];
}

export interface Story {
  id: string;
  title: string;
  episodeLabel: string | null;
  coverUrl: string;
  videoUrl: string | null;
  videoSourceType: "UPLOAD" | "YOUTUBE";
  youtubeId: string | null;
  subtitleEnUrl: string | null;
  subtitleViUrl: string | null;
  audioUrl: string | null;
  mediaType: string;
  duration: number | null;
  accent: string | null;
  minAge: number | null;
  maxAge: number | null;
  published: boolean;
  categoryId: string;
  categorySlug: string;
  categoryLabel: string;
  programIds: string[];
  programLabels: string[];
  createdAt: string;
  updatedAt: string;
  tags: string[];
  videoConverting: boolean;
  pendingVideoJobId?: string;
}

export interface UserListItem {
  id: string;
  email: string | null;
  isGuest: boolean;
  plan: string;
  createdAt: string;
  childrenCount: number;
}

export interface ChildSummary {
  id: string;
  name: string;
  gender: string;
  age: number;
  avatarKey: string;
  stars: number;
  interests: string[];
}

export interface UserDetail {
  id: string;
  email: string | null;
  isGuest: boolean;
  plan: string;
  createdAt: string;
  children: ChildSummary[];
}

export interface ConversionJob {
  id: string;
  kind: "IMAGE" | "VIDEO";
  status: "QUEUED" | "PROCESSING" | "DONE" | "FAILED";
  sourceName: string;
  sourceBytes: number;
  outputBytes: number | null;
  outputUrl: string | null;
  progress: number;
  error: string | null;
  storyId: string | null;
  story: { id: string; title: string } | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface Ad {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  placement: string;
  minAge: number | null;
  maxAge: number | null;
  active: boolean;
  startAt: string | null;
  endAt: string | null;
  priority: number;
  createdAt: string;
}
