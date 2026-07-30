import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/services/api";
import type { Category, Program, Story } from "@/types";

const ACCENTS = ["primary", "yellow", "pink", "green", "night"];
const MEDIA_TYPES = ["VIDEO", "AUDIO"] as const;

const SUBTITLE_LABEL = { en: "Anh", vi: "Việt" } as const;

/** Fetches a story's .srt content and lets it be edited/saved in place, no re-upload needed. */
function SubtitleQuickEditModal({
  storyId,
  lang,
  onClose,
  onSaved,
}: {
  storyId: string;
  lang: "en" | "vi";
  onClose: () => void;
  onSaved: (story: Story) => void;
}) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSubtitle(storyId, lang)
      .then((res) => setContent(res.content))
      .catch(() => setError("Không tải được nội dung phụ đề."))
      .finally(() => setLoading(false));
  }, [storyId, lang]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const story = await api.saveSubtitle(storyId, lang, content);
      onSaved(story);
      onClose();
    } catch {
      setError("Lưu phụ đề thất bại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-lg font-bold text-slate-800">Sửa nhanh phụ đề {SUBTITLE_LABEL[lang]}</h2>
        {loading ? (
          <p className="text-slate-500">Đang tải...</p>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            className="min-h-[50vh] flex-1 rounded-lg border border-slate-300 p-3 font-mono text-xs whitespace-pre outline-none focus:border-sky-400"
          />
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-600">
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving}
            className="rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Lưu phụ đề"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function StoryForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id) && id !== "new";
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [episodeLabel, setEpisodeLabel] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [programId, setProgramId] = useState("");
  const [mediaType, setMediaType] = useState<(typeof MEDIA_TYPES)[number]>("VIDEO");
  const [duration, setDuration] = useState("");
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [published, setPublished] = useState(true);
  const [tags, setTags] = useState("");
  const [existing, setExisting] = useState<Story | null>(null);
  const [subtitleEditorLang, setSubtitleEditorLang] = useState<"en" | "vi" | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const coverRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const subEnRef = useRef<HTMLInputElement>(null);
  const subViRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const coverPreviewRef = useRef<string | null>(null);
  const videoPreviewRef = useRef<string | null>(null);

  // Newly picked cover/video files preview locally (object URL) instead of
  // still showing the old file until the form is actually saved.
  const handleCoverFileChange = () => {
    const file = coverRef.current?.files?.[0];
    if (coverPreviewRef.current) URL.revokeObjectURL(coverPreviewRef.current);
    const url = file ? URL.createObjectURL(file) : null;
    coverPreviewRef.current = url;
    setCoverPreview(url);
  };

  const handleVideoFileChange = () => {
    const file = videoRef.current?.files?.[0];
    if (videoPreviewRef.current) URL.revokeObjectURL(videoPreviewRef.current);
    const url = file ? URL.createObjectURL(file) : null;
    videoPreviewRef.current = url;
    setVideoPreview(url);
  };

  useEffect(
    () => () => {
      if (coverPreviewRef.current) URL.revokeObjectURL(coverPreviewRef.current);
      if (videoPreviewRef.current) URL.revokeObjectURL(videoPreviewRef.current);
    },
    []
  );

  useEffect(() => {
    api.getCategories().then((cats) => {
      setCategories(cats);
      setCategoryId((prev) => prev || cats[0]?.id || "");
    });
    api.getPrograms().then((progs) => {
      setPrograms(progs);
      setProgramId((prev) => prev || progs[0]?.id || "");
    });
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    api.getStory(id).then((s) => {
      if (!s) return;
      setExisting(s);
      setTitle(s.title);
      setEpisodeLabel(s.episodeLabel ?? "");
      setCategoryId(s.categoryId);
      setProgramId(s.programId);
      setMediaType(s.mediaType === "AUDIO" ? "AUDIO" : "VIDEO");
      setDuration(s.duration != null ? String(s.duration) : "");
      setAccent(s.accent ?? ACCENTS[0]);
      setMinAge(s.minAge != null ? String(s.minAge) : "");
      setMaxAge(s.maxAge != null ? String(s.maxAge) : "");
      setPublished(s.published);
      setTags(s.tags.join(", "));
      setLoading(false);
    });
  }, [isEdit, id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isEdit && !coverRef.current?.files?.[0]) {
      setError("Cần chọn ảnh bìa.");
      return;
    }
    if (!isEdit && mediaType === "VIDEO" && (!videoRef.current?.files?.[0] || !subEnRef.current?.files?.[0] || !subViRef.current?.files?.[0])) {
      setError("Cần đủ video, phụ đề Anh, phụ đề Việt.");
      return;
    }
    if (!isEdit && mediaType === "AUDIO" && !audioRef.current?.files?.[0]) {
      setError("Cần chọn file audio.");
      return;
    }

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("episodeLabel", episodeLabel.trim());
    formData.set("categoryId", categoryId);
    formData.set("programId", programId);
    formData.set("mediaType", mediaType);
    formData.set("duration", duration);
    formData.set("accent", accent);
    formData.set("minAge", minAge);
    formData.set("maxAge", maxAge);
    formData.set("published", String(published));
    formData.set("tags", tags);
    if (coverRef.current?.files?.[0]) formData.set("cover", coverRef.current.files[0]);
    if (mediaType === "VIDEO") {
      if (videoRef.current?.files?.[0]) formData.set("video", videoRef.current.files[0]);
      if (subEnRef.current?.files?.[0]) formData.set("subtitleEn", subEnRef.current.files[0]);
      if (subViRef.current?.files?.[0]) formData.set("subtitleVi", subViRef.current.files[0]);
    } else if (audioRef.current?.files?.[0]) {
      formData.set("audio", audioRef.current.files[0]);
    }

    setSaving(true);
    try {
      if (isEdit && id) await api.updateStory(id, formData);
      else await api.createStory(formData);
      navigate("/stories");
    } catch {
      setError("Lưu truyện thất bại.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-500">Đang tải...</p>;

  return (
    <div className="w-full">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">{isEdit ? "Sửa truyện" : "Thêm truyện"}</h1>

      <form onSubmit={handleSubmit} className="flex max-w-4xl flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-600">Tên truyện</span>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Nhãn tập (vd: Tập 01)</span>
            <input value={episodeLabel} onChange={(e) => setEpisodeLabel(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Chủ đề</span>
            <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Chương trình</span>
            <select required value={programId} onChange={(e) => setProgramId(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2">
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Loại nội dung</span>
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as (typeof MEDIA_TYPES)[number])}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {MEDIA_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "VIDEO" ? "Video" : "Audio"}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Thời lượng (giây)</span>
            <input type="number" min={0} value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Tuổi đề xuất - từ</span>
            <input type="number" min={0} value={minAge} onChange={(e) => setMinAge(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">đến</span>
            <input type="number" min={0} value={maxAge} onChange={(e) => setMaxAge(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Màu accent</span>
            <select value={accent} onChange={(e) => setAccent(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2">
              {ACCENTS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Tags (cách nhau bởi dấu phẩy: new, featured)</span>
            <input value={tags} onChange={(e) => setTags(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Hiển thị trong app
        </label>

        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Ảnh bìa (.webp/.jpg/.png){isEdit ? " - để trống nếu giữ nguyên" : ""}</span>
            <input ref={coverRef} type="file" accept="image/*" className="w-full text-sm" onChange={handleCoverFileChange} />
            {(coverPreview || existing) && (
              <div className="mt-2">
                <img src={coverPreview ?? existing!.coverUrl} alt="" className="h-20 w-16 rounded object-cover" />
                {coverPreview && <p className="mt-1 text-xs font-medium text-sky-600">Ảnh mới - chưa lưu</p>}
              </div>
            )}
          </label>
          {mediaType === "VIDEO" ? (
            <>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-600">Video (.webm/.mp4){isEdit ? " - để trống nếu giữ nguyên" : ""}</span>
                <input ref={videoRef} type="file" accept="video/*" className="w-full text-sm" onChange={handleVideoFileChange} />
                {(videoPreview || existing?.videoUrl) && (
                  <div className="mt-2">
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video src={videoPreview ?? existing!.videoUrl!} controls className="h-24 w-40 rounded bg-black object-contain" />
                    {videoPreview && <p className="mt-1 text-xs font-medium text-sky-600">Video mới - chưa lưu</p>}
                  </div>
                )}
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-600">Phụ đề Anh (.srt){isEdit ? " - để trống nếu giữ nguyên" : ""}</span>
                <input ref={subEnRef} type="file" accept=".srt" className="w-full text-sm" />
                {existing?.subtitleEnUrl && (
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <a href={existing.subtitleEnUrl} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline">
                      Xem hiện tại ↗
                    </a>
                    <button type="button" onClick={() => setSubtitleEditorLang("en")} className="font-semibold text-sky-600 hover:underline">
                      Sửa nhanh
                    </button>
                  </div>
                )}
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-600">Phụ đề Việt (.srt){isEdit ? " - để trống nếu giữ nguyên" : ""}</span>
                <input ref={subViRef} type="file" accept=".srt" className="w-full text-sm" />
                {existing?.subtitleViUrl && (
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <a href={existing.subtitleViUrl} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline">
                      Xem hiện tại ↗
                    </a>
                    <button type="button" onClick={() => setSubtitleEditorLang("vi")} className="font-semibold text-sky-600 hover:underline">
                      Sửa nhanh
                    </button>
                  </div>
                )}
              </label>
            </>
          ) : (
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-600">Audio (.mp3){isEdit ? " - để trống nếu giữ nguyên" : ""}</span>
              <input ref={audioRef} type="file" accept="audio/*" className="w-full text-sm" />
              {existing?.audioUrl && (
                <audio src={existing.audioUrl} controls className="mt-2 h-10 w-full" />
              )}
            </label>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="rounded-lg bg-sky-600 px-5 py-2.5 font-semibold text-white hover:bg-sky-700 disabled:opacity-50">
            {saving ? "Đang lưu..." : "Lưu truyện"}
          </button>
          <button type="button" onClick={() => navigate("/stories")} className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-600">
            Huỷ
          </button>
        </div>
      </form>

      {subtitleEditorLang && existing && (
        <SubtitleQuickEditModal
          storyId={existing.id}
          lang={subtitleEditorLang}
          onClose={() => setSubtitleEditorLang(null)}
          onSaved={setExisting}
        />
      )}
    </div>
  );
}
