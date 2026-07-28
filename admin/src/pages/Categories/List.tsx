import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "@/services/api";
import type { Category } from "@/types";

const ICON_KEYS = ["paw", "face", "pulse", "family", "cloud-rain", "tree", "book", "ball", "burger", "globe"];

interface DraftFields {
  label: string;
  icon: string;
  color: string;
  order: number;
}

function draftFrom(c: Category): DraftFields {
  return { label: c.label, icon: c.icon, color: c.color, order: c.order };
}

export function CategoriesList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftFields>>({});
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState(ICON_KEYS[0]);
  const [newColor, setNewColor] = useState("#5CC8FF");

  const load = () => {
    setLoading(true);
    api
      .getCategories()
      .then((cats) => {
        setCategories(cats);
        setDrafts(Object.fromEntries(cats.map((c) => [c.id, draftFrom(c)])));
      })
      .catch(() => setError("Không tải được danh sách chủ đề."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.createCategory({ label: newLabel.trim(), icon: newIcon, color: newColor });
      setNewLabel("");
      load();
    } catch (err) {
      setError(err instanceof ApiError && err.code === "slug_taken" ? "Tên chủ đề đã tồn tại." : "Tạo chủ đề thất bại.");
    }
  };

  const handleSave = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;
    setError(null);
    try {
      await api.updateCategory(id, draft);
      setEditingId(null);
      load();
    } catch {
      setError("Cập nhật thất bại.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xoá chủ đề này?")) return;
    setError(null);
    try {
      await api.deleteCategory(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError && err.code === "category_in_use" ? "Chủ đề đang có truyện, không thể xoá." : "Xoá thất bại.");
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Chủ đề</h1>

      <form onSubmit={handleCreate} className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-600">Tên chủ đề</span>
          <input
            required
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-400"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-600">Icon</span>
          <select value={newIcon} onChange={(e) => setNewIcon(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
            {ICON_KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-600">Màu</span>
          <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-10 w-14 rounded-lg border border-slate-300" />
        </label>
        <button type="submit" className="rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700">
          Thêm chủ đề
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Đang tải...</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Icon</th>
                <th className="px-4 py-3">Màu</th>
                <th className="px-4 py-3">Thứ tự</th>
                <th className="px-4 py-3">Số truyện</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => {
                const editing = editingId === c.id;
                const draft = drafts[c.id] ?? draftFrom(c);
                return (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      {editing ? (
                        <input
                          value={draft.label}
                          onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: { ...draft, label: e.target.value } }))}
                          className="w-full rounded border border-slate-300 px-2 py-1"
                        />
                      ) : (
                        c.label
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-400">{c.slug}</td>
                    <td className="px-4 py-2">
                      {editing ? (
                        <select
                          value={draft.icon}
                          onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: { ...draft, icon: e.target.value } }))}
                          className="rounded border border-slate-300 px-2 py-1"
                        >
                          {ICON_KEYS.map((k) => (
                            <option key={k} value={k}>
                              {k}
                            </option>
                          ))}
                        </select>
                      ) : (
                        c.icon
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editing ? (
                        <input
                          type="color"
                          value={draft.color}
                          onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: { ...draft, color: e.target.value } }))}
                          className="h-8 w-12 rounded border border-slate-300"
                        />
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.color}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editing ? (
                        <input
                          type="number"
                          value={draft.order}
                          onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: { ...draft, order: Number(e.target.value) } }))}
                          className="w-16 rounded border border-slate-300 px-2 py-1"
                        />
                      ) : (
                        c.order
                      )}
                    </td>
                    <td className="px-4 py-2">{c.storyCount}</td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      {editing ? (
                        <>
                          <button type="button" onClick={() => handleSave(c.id)} className="mr-2 font-medium text-sky-600 hover:underline">
                            Lưu
                          </button>
                          <button type="button" onClick={() => setEditingId(null)} className="text-slate-400 hover:underline">
                            Huỷ
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => setEditingId(c.id)} className="mr-3 font-medium text-sky-600 hover:underline">
                            Sửa
                          </button>
                          <button type="button" onClick={() => handleDelete(c.id)} className="font-medium text-red-500 hover:underline">
                            Xoá
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
