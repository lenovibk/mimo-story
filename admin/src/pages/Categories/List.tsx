import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "@/services/api";
import type { Category } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useSelection } from "@/hooks/useSelection";
import { BulkActionsBar, BulkActionButton, HeaderCheckbox, RowCheckbox } from "@/components/ui/BulkActionsBar";

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
  const toast = useToast();
  const { confirm, dialog } = useConfirmDialog();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
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
      .catch(() => toast.error("Không tải được danh sách chủ đề."))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.createCategory({ label: newLabel.trim(), icon: newIcon, color: newColor });
      setNewLabel("");
      toast.success("Đã tạo chủ đề.");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError && err.code === "slug_taken" ? "Tên chủ đề đã tồn tại." : "Tạo chủ đề thất bại.");
    }
  };

  const handleSave = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;
    try {
      await api.updateCategory(id, draft);
      setEditingId(null);
      toast.success("Đã lưu chủ đề.");
      load();
    } catch {
      toast.error("Cập nhật thất bại.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm("Xoá chủ đề này?"))) return;
    try {
      await api.deleteCategory(id);
      toast.success("Đã xoá chủ đề.");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError && err.code === "category_in_use" ? "Chủ đề đang có bài học, không thể xoá." : "Xoá thất bại.");
    }
  };

  const selection = useSelection(categories.map((c) => c.id));
  const [bulkBusy, setBulkBusy] = useState(false);

  const handleBulkDelete = async () => {
    const ids = Array.from(selection.selected);
    if (!(await confirm(`Xoá ${ids.length} chủ đề đã chọn?`))) return;
    setBulkBusy(true);
    const results = await Promise.allSettled(ids.map((id) => api.deleteCategory(id)));
    const failed = results.filter((r) => r.status === "rejected").length;
    selection.clear();
    setBulkBusy(false);
    load();
    if (failed > 0) toast.error(`Xoá thất bại ${failed}/${ids.length} chủ đề (có thể đang có bài học).`);
    else toast.success(`Đã xoá ${ids.length} chủ đề.`);
  };

  return (
    <div>
      <PageHeader title="Chủ đề" />

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
        <Button type="submit">Thêm chủ đề</Button>
      </form>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <BulkActionsBar count={selection.selected.size} onClear={selection.clear}>
            <BulkActionButton variant="danger" onClick={handleBulkDelete} disabled={bulkBusy}>
              Xoá đã chọn
            </BulkActionButton>
          </BulkActionsBar>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="w-10 px-4 py-3">
                  <HeaderCheckbox checked={selection.allSelected} onChange={selection.toggleAll} />
                </th>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Icon</th>
                <th className="px-4 py-3">Màu</th>
                <th className="px-4 py-3">Thứ tự</th>
                <th className="px-4 py-3">Số bài học</th>
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
                      <RowCheckbox checked={selection.selected.has(c.id)} onChange={() => selection.toggle(c.id)} />
                    </td>
                    <td className="px-4 py-2">
                      {editing ? (
                        <input
                          value={draft.label}
                          onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: { ...draft, label: e.target.value } }))}
                          className="w-full rounded border border-slate-300 px-2 py-1"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingId(c.id)}
                          className="font-medium text-slate-700 hover:text-sky-600 hover:underline"
                        >
                          {c.label}
                        </button>
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
        </>
      )}
      {dialog}
    </div>
  );
}
