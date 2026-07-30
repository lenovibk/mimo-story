import { Fragment, useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "@/services/api";
import type { Category, Program } from "@/types";

const ICON_KEYS = ["book", "music", "chat", "headphones", "fox"];
const AGES = [3, 4, 5, 6, 7] as const;

interface DraftFields {
  label: string;
  icon: string;
  color: string;
  order: number;
  published: boolean;
}

function draftFrom(p: Program): DraftFields {
  return { label: p.label, icon: p.icon, color: p.color, order: p.order, published: p.published };
}

export function ProgramsList() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [configuringId, setConfiguringId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftFields>>({});
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState(ICON_KEYS[0]);
  const [newColor, setNewColor] = useState("#5CC8FF");

  const load = () => {
    setLoading(true);
    Promise.all([api.getPrograms(), api.getCategories()])
      .then(([progs, cats]) => {
        setPrograms(progs);
        setCategories(cats);
        setDrafts(Object.fromEntries(progs.map((p) => [p.id, draftFrom(p)])));
      })
      .catch(() => setError("Không tải được danh sách chương trình."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.createProgram({ label: newLabel.trim(), icon: newIcon, color: newColor, published: false });
      setNewLabel("");
      load();
    } catch (err) {
      setError(err instanceof ApiError && err.code === "slug_taken" ? "Tên chương trình đã tồn tại." : "Tạo chương trình thất bại.");
    }
  };

  const handleSave = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;
    setError(null);
    try {
      await api.updateProgram(id, draft);
      setEditingId(null);
      load();
    } catch {
      setError("Cập nhật thất bại.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xoá chương trình này?")) return;
    setError(null);
    try {
      await api.deleteProgram(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError && err.code === "program_in_use" ? "Chương trình đang có bài học, không thể xoá." : "Xoá thất bại.");
    }
  };

  const toggleAge = async (program: Program, age: number) => {
    const nextAges = program.ages.includes(age) ? program.ages.filter((a) => a !== age) : [...program.ages, age];
    await api.setProgramAges(program.id, nextAges);
    load();
  };

  const toggleCategory = async (program: Program, categoryId: string) => {
    const nextIds = program.categoryIds.includes(categoryId)
      ? program.categoryIds.filter((c) => c !== categoryId)
      : [...program.categoryIds, categoryId];
    await api.setProgramCategories(program.id, nextIds);
    load();
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Chương trình học</h1>

      <form onSubmit={handleCreate} className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-600">Tên chương trình</span>
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
          Thêm chương trình
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
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Số bài học</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {programs.map((p) => {
                const editing = editingId === p.id;
                const configuring = configuringId === p.id;
                const draft = drafts[p.id] ?? draftFrom(p);
                return (
                  <Fragment key={p.id}>
                    <tr className="border-t border-slate-100">
                      <td className="px-4 py-2">
                        {editing ? (
                          <input
                            value={draft.label}
                            onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...draft, label: e.target.value } }))}
                            className="w-full rounded border border-slate-300 px-2 py-1"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingId(p.id)}
                            className="font-medium text-slate-700 hover:text-sky-600 hover:underline"
                          >
                            {p.label}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-400">{p.slug}</td>
                      <td className="px-4 py-2">
                        {editing ? (
                          <select
                            value={draft.icon}
                            onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...draft, icon: e.target.value } }))}
                            className="rounded border border-slate-300 px-2 py-1"
                          >
                            {ICON_KEYS.map((k) => (
                              <option key={k} value={k}>
                                {k}
                              </option>
                            ))}
                          </select>
                        ) : (
                          p.icon
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {editing ? (
                          <input
                            type="color"
                            value={draft.color}
                            onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...draft, color: e.target.value } }))}
                            className="h-8 w-12 rounded border border-slate-300"
                          />
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: p.color }} />
                            {p.color}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {editing ? (
                          <input
                            type="number"
                            value={draft.order}
                            onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...draft, order: Number(e.target.value) } }))}
                            className="w-16 rounded border border-slate-300 px-2 py-1"
                          />
                        ) : (
                          p.order
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {editing ? (
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={draft.published}
                              onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...draft, published: e.target.checked } }))}
                            />
                            Hiển thị
                          </label>
                        ) : (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.published ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                            {p.published ? "Hiển thị" : "Ẩn"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">{p.storyCount}</td>
                      <td className="px-4 py-2 text-right whitespace-nowrap">
                        {editing ? (
                          <>
                            <button type="button" onClick={() => handleSave(p.id)} className="mr-2 font-medium text-sky-600 hover:underline">
                              Lưu
                            </button>
                            <button type="button" onClick={() => setEditingId(null)} className="text-slate-400 hover:underline">
                              Huỷ
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => setEditingId(p.id)} className="mr-3 font-medium text-sky-600 hover:underline">
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfiguringId(configuring ? null : p.id)}
                              className="mr-3 font-medium text-sky-600 hover:underline"
                            >
                              {configuring ? "Đóng cấu hình" : "Cấu hình"}
                            </button>
                            <button type="button" onClick={() => handleDelete(p.id)} className="font-medium text-red-500 hover:underline">
                              Xoá
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                    {configuring && (
                      <tr className="border-t border-slate-100 bg-slate-50">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <p className="mb-2 text-xs font-semibold text-slate-500">Độ tuổi áp dụng</p>
                              <div className="flex flex-wrap gap-3">
                                {AGES.map((age) => (
                                  <label key={age} className="flex items-center gap-1.5 text-sm">
                                    <input type="checkbox" checked={p.ages.includes(age)} onChange={() => toggleAge(p, age)} />
                                    {age === 7 ? "7+" : age}
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="mb-2 text-xs font-semibold text-slate-500">Danh mục thuộc chương trình</p>
                              <div className="flex flex-wrap gap-3">
                                {categories.map((c) => (
                                  <label key={c.id} className="flex items-center gap-1.5 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={p.categoryIds.includes(c.id)}
                                      onChange={() => toggleCategory(p, c.id)}
                                    />
                                    {c.label}
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
