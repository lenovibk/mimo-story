import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/services/api";
import type { Ad } from "@/types";

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id) && id !== "new";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<Ad | null>(null);

  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [placement, setPlacement] = useState("home_banner");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [active, setActive] = useState(true);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [priority, setPriority] = useState("0");

  const imageRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imagePreviewRef = useRef<string | null>(null);

  const handleImageFileChange = () => {
    const file = imageRef.current?.files?.[0];
    if (imagePreviewRef.current) URL.revokeObjectURL(imagePreviewRef.current);
    const url = file ? URL.createObjectURL(file) : null;
    imagePreviewRef.current = url;
    setImagePreview(url);
  };

  useEffect(
    () => () => {
      if (imagePreviewRef.current) URL.revokeObjectURL(imagePreviewRef.current);
    },
    []
  );

  useEffect(() => {
    if (!isEdit || !id) return;
    api.getAd(id).then((ad) => {
      if (!ad) return;
      setExisting(ad);
      setTitle(ad.title);
      setLinkUrl(ad.linkUrl ?? "");
      setPlacement(ad.placement);
      setMinAge(ad.minAge != null ? String(ad.minAge) : "");
      setMaxAge(ad.maxAge != null ? String(ad.maxAge) : "");
      setActive(ad.active);
      setStartAt(toDatetimeLocal(ad.startAt));
      setEndAt(toDatetimeLocal(ad.endAt));
      setPriority(String(ad.priority));
      setLoading(false);
    });
  }, [isEdit, id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isEdit && !imageRef.current?.files?.[0]) {
      setError("Cần chọn ảnh quảng cáo.");
      return;
    }

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("linkUrl", linkUrl.trim());
    formData.set("placement", placement.trim());
    formData.set("minAge", minAge);
    formData.set("maxAge", maxAge);
    formData.set("active", String(active));
    formData.set("startAt", startAt);
    formData.set("endAt", endAt);
    formData.set("priority", priority);
    if (imageRef.current?.files?.[0]) formData.set("image", imageRef.current.files[0]);

    setSaving(true);
    try {
      if (isEdit && id) await api.updateAd(id, formData);
      else await api.createAd(formData);
      navigate("/ads");
    } catch {
      setError("Lưu quảng cáo thất bại.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-500">Đang tải...</p>;

  return (
    <div className="w-full">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">{isEdit ? "Sửa quảng cáo" : "Thêm quảng cáo"}</h1>

      <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-600">Tiêu đề</span>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-600">Link khi bấm vào (tuỳ chọn)</span>
          <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Vị trí</span>
            <input value={placement} onChange={(e) => setPlacement(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Ưu tiên (số lớn hơn hiện trước)</span>
            <input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Tuổi mục tiêu - từ</span>
            <input type="number" min={0} value={minAge} onChange={(e) => setMinAge(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">đến</span>
            <input type="number" min={0} value={maxAge} onChange={(e) => setMaxAge(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Bắt đầu chạy (tuỳ chọn)</span>
            <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Kết thúc (tuỳ chọn)</span>
            <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Đang chạy
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-600">Ảnh quảng cáo{isEdit ? " - để trống nếu giữ nguyên" : ""}</span>
          <input ref={imageRef} type="file" accept="image/*" className="w-full text-sm" onChange={handleImageFileChange} />
          {(imagePreview || existing) && (
            <div className="mt-2">
              <img src={imagePreview ?? existing!.imageUrl} alt="" className="h-16 w-32 rounded object-cover" />
              {imagePreview && <p className="mt-1 text-xs font-medium text-sky-600">Ảnh mới - chưa lưu</p>}
            </div>
          )}
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="rounded-lg bg-sky-600 px-5 py-2.5 font-semibold text-white hover:bg-sky-700 disabled:opacity-50">
            {saving ? "Đang lưu..." : "Lưu quảng cáo"}
          </button>
          <button type="button" onClick={() => navigate("/ads")} className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-600">
            Huỷ
          </button>
        </div>
      </form>
    </div>
  );
}
