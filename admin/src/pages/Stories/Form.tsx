import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { api } from "@/services/api";
import type { Category, Program, Story } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useToast } from "@/components/ui/Toast";

const ACCENTS = ["primary", "yellow", "pink", "green", "night"];
const MEDIA_TYPES = ["VIDEO", "AUDIO"] as const;
const VIDEO_SOURCE_TYPES = ["UPLOAD", "YOUTUBE"] as const;

const SUBTITLE_LABEL = { en: "Anh", vi: "Việt" } as const;

const YOUTUBE_ID_RE = /^[\w-]{11}$/;

/** Client-side preview/validation only - the server re-parses and is the source of truth. */
function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  if (YOUTUBE_ID_RE.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  let id: string | null = null;
  const host = url.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtu.be") {
    id = url.pathname.slice(1).split("/")[0] || null;
  } else if (host === "youtube.com") {
    if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else {
      const match = url.pathname.match(/^\/(embed|shorts)\/([^/]+)/);
      if (match) id = match[2];
    }
  }

  return id && YOUTUBE_ID_RE.test(id) ? id : null;
}

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
  const toast = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingJob, setPendingJob] = useState<{ id: string; progress: number } | null>(null);

  const [title, setTitle] = useState("");
  const [episodeLabel, setEpisodeLabel] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [programIds, setProgramIds] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<(typeof MEDIA_TYPES)[number]>("VIDEO");
  const [videoSourceType, setVideoSourceType] = useState<(typeof VIDEO_SOURCE_TYPES)[number]>("UPLOAD");
  const [youtubeUrl, setYoutubeUrl] = useState("");
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
      setProgramIds((prev) => (prev.length > 0 ? prev : progs[0] ? [progs[0].id] : []));
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
      setProgramIds(s.programIds);
      setMediaType(s.mediaType === "AUDIO" ? "AUDIO" : "VIDEO");
      setVideoSourceType(s.videoSourceType === "YOUTUBE" ? "YOUTUBE" : "UPLOAD");
      setYoutubeUrl(s.youtubeId ?? "");
      setDuration(s.duration != null ? String(s.duration) : "");
      setAccent(s.accent ?? ACCENTS[0]);
      setMinAge(s.minAge != null ? String(s.minAge) : "");
      setMaxAge(s.maxAge != null ? String(s.maxAge) : "");
      setPublished(s.published);
      setTags(s.tags.join(", "));
      setLoading(false);
    });
  }, [isEdit, id]);

  const toggleProgram = (id: string) => {
    setProgramIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const [convertingExisting, setConvertingExisting] = useState(false);
  const handleConvertExisting = async () => {
    if (!existing) return;
    setConvertingExisting(true);
    try {
      const res = await api.convertStoryMedia(existing.id);
      toast.success("Đã thêm vào hàng đợi nén lại.");
      if (res.videoJobId) setPendingJob({ id: res.videoJobId, progress: 0 });
    } catch {
      toast.error("Không thể thêm vào hàng đợi convert.");
    } finally {
      setConvertingExisting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (programIds.length === 0) {
      setError("Cần chọn ít nhất một chương trình.");
      return;
    }
    if (!isEdit && !coverRef.current?.files?.[0]) {
      setError("Cần chọn ảnh bìa.");
      return;
    }
    const youtubeId = videoSourceType === "YOUTUBE" ? extractYoutubeId(youtubeUrl) : null;
    if (mediaType === "VIDEO" && videoSourceType === "YOUTUBE" && !youtubeId) {
      setError("Link YouTube không hợp lệ.");
      return;
    }
    // A hidden draft can be saved metadata-first with no video/subtitles yet - only
    // require them once the story is set to actually show in the app.
    if (!isEdit && published) {
      if (mediaType === "VIDEO" && videoSourceType === "UPLOAD" && (!videoRef.current?.files?.[0] || !subEnRef.current?.files?.[0] || !subViRef.current?.files?.[0])) {
        setError("Cần đủ video, phụ đề Anh, phụ đề Việt (hoặc bỏ tick “Hiển thị trong app” để lưu nháp).");
        return;
      }
      if (mediaType === "VIDEO" && videoSourceType === "YOUTUBE" && (!subEnRef.current?.files?.[0] || !subViRef.current?.files?.[0])) {
        setError("Cần đủ phụ đề Anh, phụ đề Việt (hoặc bỏ tick “Hiển thị trong app” để lưu nháp).");
        return;
      }
      if (mediaType === "AUDIO" && !audioRef.current?.files?.[0]) {
        setError("Cần chọn file audio (hoặc bỏ tick “Hiển thị trong app” để lưu nháp).");
        return;
      }
    }

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("episodeLabel", episodeLabel.trim());
    formData.set("categoryId", categoryId);
    programIds.forEach((pid) => formData.append("programIds", pid));
    formData.set("mediaType", mediaType);
    formData.set("videoSourceType", videoSourceType);
    if (videoSourceType === "YOUTUBE") formData.set("youtubeUrl", youtubeUrl.trim());
    formData.set("duration", duration);
    formData.set("accent", accent);
    formData.set("minAge", minAge);
    formData.set("maxAge", maxAge);
    formData.set("published", String(published));
    formData.set("tags", tags);
    if (coverRef.current?.files?.[0]) formData.set("cover", coverRef.current.files[0]);
    if (mediaType === "VIDEO") {
      if (videoSourceType === "UPLOAD" && videoRef.current?.files?.[0]) formData.set("video", videoRef.current.files[0]);
      if (subEnRef.current?.files?.[0]) formData.set("subtitleEn", subEnRef.current.files[0]);
      if (subViRef.current?.files?.[0]) formData.set("subtitleVi", subViRef.current.files[0]);
    } else if (audioRef.current?.files?.[0]) {
      formData.set("audio", audioRef.current.files[0]);
    }

    setSaving(true);
    try {
      const saved = isEdit && id ? await api.updateStory(id, formData) : await api.createStory(formData);
      toast.success("Đã lưu bài học.");
      if (saved.pendingVideoJobId) {
        // A new video was uploaded - it's already playable (raw upload), but stay on
        // the form so the admin can watch it get compressed to webm instead of
        // silently navigating away mid-conversion.
        setExisting(saved);
        setPendingJob({ id: saved.pendingVideoJobId, progress: 0 });
      } else {
        navigate("/stories");
      }
    } catch {
      setError("Lưu bài học thất bại.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!pendingJob) return;
    const interval = setInterval(async () => {
      try {
        const job = await api.getMediaJob(pendingJob.id);
        if (job.status === "DONE") {
          setExisting((prev) => (prev && job.outputUrl ? { ...prev, videoUrl: job.outputUrl } : prev));
          setPendingJob(null);
          toast.success("Đã nén xong video.");
        } else if (job.status === "FAILED") {
          setPendingJob(null);
          toast.error("Nén video thất bại, video gốc vẫn được giữ nguyên.");
        } else {
          setPendingJob({ id: job.id, progress: job.progress });
        }
      } catch {
        // transient - keep polling
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [pendingJob?.id, toast]);

  if (loading) return <Spinner />;

  return (
    <div className="w-full">
      <PageHeader title={isEdit ? "Sửa bài học" : "Thêm bài học"} backTo="/stories" />

      <form onSubmit={handleSubmit} className="flex max-w-4xl flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-600">Tên bài học</span>
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
          <div className="text-sm">
            <span className="mb-1 block font-medium text-slate-600">Chương trình (có thể chọn nhiều)</span>
            <div className="flex flex-wrap gap-3 rounded-lg border border-slate-300 px-3 py-2">
              {programs.map((p) => (
                <label key={p.id} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={programIds.includes(p.id)} onChange={() => toggleProgram(p.id)} />
                  {p.label}
                </label>
              ))}
            </div>
          </div>
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

        <div className="flex flex-col gap-4 border-t border-slate-100 pt-4">
          {isEdit && existing && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<ArrowsClockwise size={14} />}
              disabled={convertingExisting || Boolean(pendingJob)}
              onClick={handleConvertExisting}
              className="self-start"
            >
              {convertingExisting ? "Đang thêm vào hàng đợi..." : "Nén lại ảnh bìa/video hiện tại"}
            </Button>
          )}
          <div className="grid grid-cols-2 gap-4">
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
          {/* Own vertical stack (not a shared grid track) so toggling media type/video source
              never reshuffles the cover field next to it into a different row/column. */}
          <div className="flex flex-col gap-4">
          {mediaType === "VIDEO" ? (
            <>
              <div className="text-sm">
                <span className="mb-1 block font-medium text-slate-600">Nguồn video</span>
                <div className="flex gap-2">
                  {VIDEO_SOURCE_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setVideoSourceType(t)}
                      className={`rounded-lg border px-3 py-1.5 font-medium ${
                        videoSourceType === t
                          ? "border-sky-500 bg-sky-50 text-sky-700"
                          : "border-slate-300 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {t === "UPLOAD" ? "Tải lên" : "YouTube"}
                    </button>
                  ))}
                </div>
              </div>
              {videoSourceType === "UPLOAD" ? (
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
                  {pendingJob && (
                    <div className="mt-2 w-40">
                      <p className="mb-1 text-xs font-medium text-sky-600">Đang nén sang webm... {Math.round(pendingJob.progress * 100)}%</p>
                      <ProgressBar ratio={pendingJob.progress} />
                    </div>
                  )}
                </label>
              ) : (
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-slate-600">Link YouTube (watch/youtu.be/embed)</span>
                  <input
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  {youtubeUrl.trim() && !extractYoutubeId(youtubeUrl) && (
                    <p className="mt-1 text-xs font-medium text-red-600">Link YouTube không hợp lệ.</p>
                  )}
                  {extractYoutubeId(youtubeUrl) && (
                    <img
                      src={`https://img.youtube.com/vi/${extractYoutubeId(youtubeUrl)}/hqdefault.jpg`}
                      alt=""
                      className="mt-2 h-24 w-40 rounded bg-black object-contain"
                    />
                  )}
                </label>
              )}
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
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" size="md" disabled={saving} className="px-5 py-2.5">
            {saving ? "Đang lưu..." : "Lưu bài học"}
          </Button>
          <Button type="button" variant="secondary" className="px-5 py-2.5" onClick={() => navigate("/stories")}>
            {pendingJob ? "Xong, quay lại danh sách" : "Huỷ"}
          </Button>
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
