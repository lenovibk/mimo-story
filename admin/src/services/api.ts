import { useAdminAuthStore } from "@/store/useAdminAuthStore";
import type { Ad, AdminUser, Category, ConversionJob, Program, Story, UserDetail, UserListItem } from "@/types";

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

function toQueryString(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "") as [string, string | number][];
  const qs = new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
  return qs ? `?${qs}` : "";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAdminAuthStore.getState().token;
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    useAdminAuthStore.getState().logout();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "unknown_error" }));
    throw new ApiError(res.status, body.error || "unknown_error");
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; admin: AdminUser }>("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getDashboard: () =>
    request<{ storyCount: number; categoryCount: number; userCount: number; activeAdCount: number }>("/admin/dashboard"),

  getStories: (params: { category?: string; program?: string; published?: string; search?: string; skip?: number; take?: number } = {}) =>
    request<{ stories: Story[]; total: number }>(`/admin/stories${toQueryString(params)}`),
  getStory: async (id: string) => {
    const { stories } = await request<{ stories: Story[]; total: number }>(`/admin/stories${toQueryString({ take: 200 })}`);
    return stories.find((s) => s.id === id);
  },
  createStory: (formData: FormData) => request<Story>("/admin/stories", { method: "POST", body: formData }),
  updateStory: (id: string, formData: FormData) => request<Story>(`/admin/stories/${id}`, { method: "PATCH", body: formData }),
  deleteStory: (id: string) => request<void>(`/admin/stories/${id}`, { method: "DELETE" }),
  convertStoryMedia: (id: string) =>
    request<{ coverJobId: string; videoJobId: string | null }>(`/admin/stories/${id}/convert`, { method: "POST" }),

  getSubtitle: (id: string, lang: "en" | "vi") => request<{ content: string }>(`/admin/stories/${id}/subtitle/${lang}`),
  saveSubtitle: (id: string, lang: "en" | "vi", content: string) =>
    request<Story>(`/admin/stories/${id}/subtitle/${lang}`, { method: "PUT", body: JSON.stringify({ content }) }),

  getCategories: () => request<Category[]>("/admin/categories"),
  createCategory: (input: { slug?: string; label: string; icon: string; color: string; order?: number }) =>
    request<Category>("/admin/categories", { method: "POST", body: JSON.stringify(input) }),
  updateCategory: (id: string, input: Partial<{ label: string; icon: string; color: string; order: number }>) =>
    request<Category>(`/admin/categories/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteCategory: (id: string) => request<void>(`/admin/categories/${id}`, { method: "DELETE" }),

  getPrograms: () => request<Program[]>("/admin/programs"),
  createProgram: (input: { slug?: string; label: string; icon: string; color: string; order?: number; published?: boolean }) =>
    request<Program>("/admin/programs", { method: "POST", body: JSON.stringify(input) }),
  updateProgram: (id: string, input: Partial<{ label: string; icon: string; color: string; order: number; published: boolean }>) =>
    request<Program>(`/admin/programs/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteProgram: (id: string) => request<void>(`/admin/programs/${id}`, { method: "DELETE" }),
  setProgramAges: (id: string, ages: number[]) =>
    request<{ ages: number[] }>(`/admin/programs/${id}/ages`, { method: "PUT", body: JSON.stringify({ ages }) }),
  setProgramCategories: (id: string, categoryIds: string[]) =>
    request<{ categoryIds: string[] }>(`/admin/programs/${id}/categories`, { method: "PUT", body: JSON.stringify({ categoryIds }) }),

  getUsers: (params: { search?: string; skip?: number; take?: number } = {}) =>
    request<{ users: UserListItem[]; total: number }>(`/admin/users${toQueryString(params)}`),
  getUser: (id: string) => request<UserDetail>(`/admin/users/${id}`),
  updateUserPlan: (id: string, plan: string) =>
    request<UserListItem>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ plan }) }),
  deleteUser: (id: string) => request<void>(`/admin/users/${id}`, { method: "DELETE" }),

  getAds: (params: { placement?: string; active?: string } = {}) => request<Ad[]>(`/admin/ads${toQueryString(params)}`),
  getAd: async (id: string) => {
    const ads = await request<Ad[]>("/admin/ads");
    return ads.find((a) => a.id === id);
  },
  createAd: (formData: FormData) => request<Ad>("/admin/ads", { method: "POST", body: formData }),
  updateAd: (id: string, formData: FormData) => request<Ad>(`/admin/ads/${id}`, { method: "PATCH", body: formData }),
  deleteAd: (id: string) => request<void>(`/admin/ads/${id}`, { method: "DELETE" }),
  convertAdMedia: (id: string) => request<{ jobId: string }>(`/admin/ads/${id}/convert`, { method: "POST" }),

  getMediaJobs: (params: { skip?: number; take?: number } = {}) =>
    request<{ jobs: ConversionJob[]; total: number }>(`/admin/media-jobs${toQueryString(params)}`),
  getMediaJob: (id: string) => request<ConversionJob>(`/admin/media-jobs/${id}`),
  convertMedia: (formData: FormData) => request<{ jobId: string }>("/admin/media-jobs/convert", { method: "POST", body: formData }),
  backfillMediaJobs: () => request<{ enqueued: number }>("/admin/media-jobs/backfill", { method: "POST" }),
};

export { ApiError };
