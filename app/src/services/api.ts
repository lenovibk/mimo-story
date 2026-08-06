import { useAuthStore } from "@/store/useAuthStore";
import type { Ad, Category, Child, DashboardStats, GrammarPoint, Parent, Program, Story, VocabItem } from "@/types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3002/api";

class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "unknown_error" }));
    throw new ApiError(res.status, body.error || "unknown_error");
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  guestLogin: () =>
    request<{ token: string; parent: Parent; children: Child[] }>("/auth/guest", { method: "POST" }),

  requestCode: (email: string) => request<{ ok: true }>("/auth/request-code", { method: "POST", body: JSON.stringify({ email }) }),

  verifyCode: (email: string, code: string) =>
    request<{ token: string; parent: Parent; children: Child[] }>("/auth/verify-code", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }),

  /** Upgrades the current guest parent (from the Bearer token) to a real member with an email. */
  upgrade: (email: string, code: string) =>
    request<{ token: string; parent: Parent; children: Child[] }>("/auth/upgrade", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }),

  getChildren: () => request<Child[]>("/children"),

  createChild: (input: { name: string; gender: "boy" | "girl"; age: number; interests: string[]; avatarKey?: string }) =>
    request<Child>("/children", { method: "POST", body: JSON.stringify(input) }),

  updateChild: (childId: string, input: Partial<{ name: string; age: number; interests: string[]; avatarKey: string }>) =>
    request<Child>(`/children/${childId}`, { method: "PATCH", body: JSON.stringify(input) }),

  getFavorites: (childId: string) => request<string[]>(`/children/${childId}/favorites`),

  addFavorite: (childId: string, storyId: string) =>
    request<{ ok: true }>(`/children/${childId}/favorites`, { method: "POST", body: JSON.stringify({ storyId }) }),

  removeFavorite: (childId: string, storyId: string) =>
    request<{ ok: true }>(`/children/${childId}/favorites/${storyId}`, { method: "DELETE" }),

  getProgress: (childId: string) => request<{ storyId: string; ratio: number; updatedAt: string }[]>(`/children/${childId}/progress`),

  putProgress: (childId: string, storyId: string, ratio: number, deltaSeconds = 0) =>
    request<{ ok: true }>(`/children/${childId}/progress/${storyId}`, {
      method: "PUT",
      body: JSON.stringify({ ratio, deltaSeconds }),
    }),

  getDashboard: (childId: string) => request<DashboardStats>(`/children/${childId}/dashboard`),

  getSubscription: () => request<{ plan: string }>("/parent/subscription"),

  setSubscription: (plan: string) => request<{ plan: string }>("/parent/subscription", { method: "POST", body: JSON.stringify({ plan }) }),

  // Catalog - browsing never requires login, so these never send a token.
  getStories: () => request<Story[]>("/stories"),

  getCategories: () => request<Category[]>("/categories"),

  getPrograms: () => request<Program[]>("/programs"),

  getActiveAds: (placement = "home_banner", age?: number) =>
    request<Ad[]>(`/ads/active?placement=${encodeURIComponent(placement)}${age != null ? `&age=${age}` : ""}`),

  getStoryVocabulary: (storyId: string) => request<VocabItem[]>(`/stories/${storyId}/vocabulary`),
  getStoryGrammar: (storyId: string) => request<GrammarPoint[]>(`/stories/${storyId}/grammar`),

  getVocabProgress: (childId: string) => request<{ vocabId: string; status: string }[]>(`/children/${childId}/vocab-progress`),
  setVocabProgress: (childId: string, vocabId: string, status: "known" | "new") =>
    request<{ ok: true }>(`/children/${childId}/vocab-progress/${vocabId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
};

export { ApiError };
