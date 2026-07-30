import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import type { Category, Program, Story } from "@/types";

const PAGE_SIZE = 20;

export function StoriesList() {
  const [stories, setStories] = useState<Story[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getPrograms().then(setPrograms).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .getStories({
        search: search || undefined,
        category: categoryFilter || undefined,
        program: programFilter || undefined,
        skip: page * PAGE_SIZE,
        take: PAGE_SIZE,
      })
      .then((res) => {
        setStories(res.stories);
        setTotal(res.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, categoryFilter, programFilter, page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Xoá truyện này? Không thể hoàn tác.")) return;
    await api.deleteStory(id);
    setStories((prev) => prev.filter((s) => s.id !== id));
    setTotal((t) => t - 1);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Truyện</h1>
        <Link to="/stories/new" className="rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700">
          + Thêm truyện
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => {
            setPage(0);
            setSearch(e.target.value);
          }}
          placeholder="Tìm theo tên truyện..."
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-400"
        />
        <select
          value={categoryFilter}
          onChange={(e) => {
            setPage(0);
            setCategoryFilter(e.target.value);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Tất cả chủ đề</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={programFilter}
          onChange={(e) => {
            setPage(0);
            setProgramFilter(e.target.value);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Tất cả chương trình</option>
          {programs.map((p) => (
            <option key={p.id} value={p.slug}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-slate-500">Đang tải...</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">Ảnh bìa</th>
                  <th className="px-4 py-3">Tên truyện</th>
                  <th className="px-4 py-3">Chủ đề</th>
                  <th className="px-4 py-3">Chương trình</th>
                  <th className="px-4 py-3">Tuổi đề xuất</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {stories.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      <img src={s.coverUrl} alt="" className="h-12 w-9 rounded object-cover" />
                    </td>
                    <td className="px-4 py-2">
                      <p className="font-medium text-slate-700">{s.title}</p>
                      {s.episodeLabel && <p className="text-xs text-slate-400">{s.episodeLabel}</p>}
                    </td>
                    <td className="px-4 py-2 text-slate-500">{s.categoryLabel}</td>
                    <td className="px-4 py-2 text-slate-500">{s.programLabel}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {s.minAge != null || s.maxAge != null ? `${s.minAge ?? "0"}–${s.maxAge ?? "∞"}` : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.published ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {s.published ? "Hiển thị" : "Ẩn"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <Link to={`/stories/${s.id}`} className="mr-3 font-medium text-sky-600 hover:underline">
                        Sửa
                      </Link>
                      <button type="button" onClick={() => handleDelete(s.id)} className="font-medium text-red-500 hover:underline">
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>
              {total === 0 ? 0 : page * PAGE_SIZE + 1}–{Math.min(total, (page + 1) * PAGE_SIZE)} / {total}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={(page + 1) * PAGE_SIZE >= total}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
