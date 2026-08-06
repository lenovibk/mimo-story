import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Books, Plus } from "@phosphor-icons/react";
import { api } from "@/services/api";
import type { GrammarPoint } from "@/types";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import type { SubtitleCue } from "@/utils/srtParser";
import { formatCueTime } from "@/utils/srtParser";
import { CuePicker } from "@/pages/Vocabulary/CuePicker";

const EMPTY_FORM = {
  cue: null as SubtitleCue | null,
  title: "",
  structure: "",
  explanationVi: "",
  exampleEn: "",
  exampleVi: "",
};

export function GrammarTab({ storyId, cues }: { storyId: string; cues: SubtitleCue[] }) {
  const toast = useToast();
  const { confirm, dialog } = useConfirmDialog();
  const [items, setItems] = useState<GrammarPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = () => {
    setLoading(true);
    api
      .getGrammar(storyId)
      .then(setItems)
      .catch(() => toast.error("Không tải được danh sách ngữ pháp."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [storyId]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (item: GrammarPoint) => {
    setEditingId(item.id);
    setForm({
      cue: item.cueStart != null ? { start: item.cueStart, end: item.cueStart, text: item.cueText ?? "" } : null,
      title: item.title,
      structure: item.structure ?? "",
      explanationVi: item.explanationVi,
      exampleEn: item.exampleEn,
      exampleVi: item.exampleVi,
    });
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.explanationVi.trim() || !form.exampleEn.trim() || !form.exampleVi.trim()) {
      toast.error("Cần nhập đủ tiêu đề, giải thích và ví dụ (Anh + Việt).");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        storyId,
        cueStart: form.cue?.start ?? null,
        cueText: form.cue?.text ?? null,
        title: form.title.trim(),
        structure: form.structure.trim() || null,
        explanationVi: form.explanationVi.trim(),
        exampleEn: form.exampleEn.trim(),
        exampleVi: form.exampleVi.trim(),
      };
      if (editingId) {
        const updated = await api.updateGrammarPoint(editingId, payload);
        setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)));
        toast.success("Đã cập nhật ngữ pháp.");
      } else {
        const created = await api.createGrammarPoint(payload);
        setItems((prev) => [...prev, created]);
        toast.success("Đã thêm ngữ pháp.");
      }
      resetForm();
    } catch {
      toast.error("Lưu ngữ pháp thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm("Xoá điểm ngữ pháp này? Không thể hoàn tác."))) return;
    try {
      await api.deleteGrammarPoint(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Đã xoá ngữ pháp.");
      if (editingId === id) resetForm();
    } catch {
      toast.error("Xoá ngữ pháp thất bại.");
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    try {
      await api.reorderGrammar(storyId, next.map((i) => i.id));
    } catch {
      toast.error("Sắp xếp lại thất bại.");
      load();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-slate-700">{editingId ? "Sửa điểm ngữ pháp" : "Thêm điểm ngữ pháp mới"}</h2>

        <div className="mb-3">
          <span className="mb-1 block text-sm font-medium text-slate-600">Gắn với câu thoại (tuỳ chọn)</span>
          <CuePicker cues={cues} value={form.cue?.start ?? ""} onChange={(cue) => setForm((f) => ({ ...f, cue }))} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Tiêu đề *</span>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Thì hiện tại tiếp diễn"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Cấu trúc</span>
            <input
              value={form.structure}
              onChange={(e) => setForm((f) => ({ ...f, structure: e.target.value }))}
              placeholder="S + am/is/are + V-ing"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
            />
          </label>
        </div>

        <label className="mt-3 block text-sm">
          <span className="mb-1 block font-medium text-slate-600">Giải thích (VI) *</span>
          <textarea
            value={form.explanationVi}
            onChange={(e) => setForm((f) => ({ ...f, explanationVi: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Câu ví dụ (EN) *</span>
            <input
              value={form.exampleEn}
              onChange={(e) => setForm((f) => ({ ...f, exampleEn: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Câu ví dụ (VI) *</span>
            <input
              value={form.exampleVi}
              onChange={(e) => setForm((f) => ({ ...f, exampleVi: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-4 flex gap-3">
          <Button onClick={handleSubmit} disabled={saving} icon={editingId ? undefined : <Plus size={16} weight="bold" />}>
            {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Thêm ngữ pháp"}
          </Button>
          {editingId && (
            <Button variant="secondary" onClick={resetForm}>
              Huỷ sửa
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState icon={Books} title="Chưa có điểm ngữ pháp nào" description="Thêm điểm ngữ pháp đầu tiên cho bài học này ở trên." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="w-16 px-4 py-3"></th>
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3">Cấu trúc</th>
                <th className="px-4 py-3">Ví dụ (EN)</th>
                <th className="px-4 py-3">Câu thoại</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="text-slate-400 hover:text-sky-600 disabled:opacity-30">
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={index === items.length - 1}
                        className="text-slate-400 hover:text-sky-600 disabled:opacity-30"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-700">{item.title}</td>
                  <td className="px-4 py-2 font-mono text-xs text-slate-500">{item.structure ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-500 italic">{item.exampleEn}</td>
                  <td className="px-4 py-2 text-slate-400">{item.cueStart != null ? formatCueTime(item.cueStart) : "—"}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button type="button" onClick={() => startEdit(item)} className="mr-3 font-medium text-sky-600 hover:underline">
                      Sửa
                    </button>
                    <button type="button" onClick={() => handleDelete(item.id)} className="font-medium text-red-500 hover:underline">
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {dialog}
    </div>
  );
}
