import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, Plus } from "@phosphor-icons/react";
import { api } from "@/services/api";
import type { VocabItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import type { SubtitleCue } from "@/utils/srtParser";
import { formatCueTime } from "@/utils/srtParser";
import { CuePicker, WordPicker } from "@/pages/Vocabulary/CuePicker";

const PARTS_OF_SPEECH = [
  { value: "", label: "(không chọn)" },
  { value: "noun", label: "Danh từ" },
  { value: "verb", label: "Động từ" },
  { value: "adjective", label: "Tính từ" },
  { value: "adverb", label: "Trạng từ" },
  { value: "phrase", label: "Cụm từ" },
];

const EMPTY_FORM = {
  cue: null as SubtitleCue | null,
  word: "",
  phonetic: "",
  partOfSpeech: "",
  meaningVi: "",
  exampleEn: "",
  exampleVi: "",
  imageUrl: "",
};

export function VocabTab({ storyId, cues }: { storyId: string; cues: SubtitleCue[] }) {
  const toast = useToast();
  const { confirm, dialog } = useConfirmDialog();
  const [items, setItems] = useState<VocabItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = () => {
    setLoading(true);
    api
      .getVocabulary(storyId)
      .then(setItems)
      .catch(() => toast.error("Không tải được danh sách từ vựng."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [storyId]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (item: VocabItem) => {
    setEditingId(item.id);
    setForm({
      cue: item.cueStart != null ? { start: item.cueStart, end: item.cueStart, text: item.cueText ?? "" } : null,
      word: item.word,
      phonetic: item.phonetic ?? "",
      partOfSpeech: item.partOfSpeech ?? "",
      meaningVi: item.meaningVi,
      exampleEn: item.exampleEn,
      exampleVi: item.exampleVi,
      imageUrl: item.imageUrl ?? "",
    });
  };

  const handleSubmit = async () => {
    if (!form.word.trim() || !form.meaningVi.trim() || !form.exampleEn.trim() || !form.exampleVi.trim()) {
      toast.error("Cần nhập đủ từ, nghĩa và ví dụ (Anh + Việt).");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        storyId,
        cueStart: form.cue?.start ?? null,
        cueText: form.cue?.text ?? null,
        word: form.word.trim(),
        phonetic: form.phonetic.trim() || null,
        partOfSpeech: form.partOfSpeech || null,
        meaningVi: form.meaningVi.trim(),
        exampleEn: form.exampleEn.trim(),
        exampleVi: form.exampleVi.trim(),
        imageUrl: form.imageUrl.trim() || null,
      };
      if (editingId) {
        const updated = await api.updateVocabItem(editingId, payload);
        setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)));
        toast.success("Đã cập nhật từ vựng.");
      } else {
        const created = await api.createVocabItem(payload);
        setItems((prev) => [...prev, created]);
        toast.success("Đã thêm từ vựng.");
      }
      resetForm();
    } catch {
      toast.error("Lưu từ vựng thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm("Xoá từ vựng này? Không thể hoàn tác."))) return;
    try {
      await api.deleteVocabItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Đã xoá từ vựng.");
      if (editingId === id) resetForm();
    } catch {
      toast.error("Xoá từ vựng thất bại.");
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    try {
      await api.reorderVocabulary(storyId, next.map((i) => i.id));
    } catch {
      toast.error("Sắp xếp lại thất bại.");
      load();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-slate-700">{editingId ? "Sửa từ vựng" : "Thêm từ vựng mới"}</h2>

        <div className="mb-3">
          <span className="mb-1 block text-sm font-medium text-slate-600">Gắn với câu thoại</span>
          <CuePicker cues={cues} value={form.cue?.start ?? ""} onChange={(cue) => setForm((f) => ({ ...f, cue }))} />
          {form.cue && (
            <div className="mt-2">
              <p className="mb-1 text-xs text-slate-400">Bấm vào một từ để điền nhanh:</p>
              <WordPicker text={form.cue.text} onPick={(word) => setForm((f) => ({ ...f, word }))} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Từ (EN) *</span>
            <input
              value={form.word}
              onChange={(e) => setForm((f) => ({ ...f, word: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Phiên âm</span>
            <input
              value={form.phonetic}
              onChange={(e) => setForm((f) => ({ ...f, phonetic: e.target.value }))}
              placeholder="/ˈbʌtərflaɪ/"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Từ loại</span>
            <select
              value={form.partOfSpeech}
              onChange={(e) => setForm((f) => ({ ...f, partOfSpeech: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {PARTS_OF_SPEECH.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Nghĩa (VI) *</span>
            <input
              value={form.meaningVi}
              onChange={(e) => setForm((f) => ({ ...f, meaningVi: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>

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

        <label className="mt-3 block text-sm">
          <span className="mb-1 block font-medium text-slate-600">Ảnh minh hoạ (URL, tuỳ chọn)</span>
          <input
            value={form.imageUrl}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            placeholder="https://..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <div className="mt-4 flex gap-3">
          <Button onClick={handleSubmit} disabled={saving} icon={editingId ? undefined : <Plus size={16} weight="bold" />}>
            {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Thêm từ vựng"}
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
        <EmptyState icon={BookOpen} title="Chưa có từ vựng nào" description="Thêm từ vựng đầu tiên cho bài học này ở trên." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="w-16 px-4 py-3"></th>
                <th className="px-4 py-3">Từ</th>
                <th className="px-4 py-3">Nghĩa</th>
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
                  <td className="px-4 py-2">
                    <p className="font-medium text-slate-700">{item.word}</p>
                    {item.phonetic && <p className="text-xs text-slate-400">{item.phonetic}</p>}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{item.meaningVi}</td>
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
