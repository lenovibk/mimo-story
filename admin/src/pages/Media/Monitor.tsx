import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowSquareOut, FileVideo, Image as ImageIcon, UploadSimple } from "@phosphor-icons/react";
import { api } from "@/services/api";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { ConversionJob } from "@/types";

const POLL_MS = 3000;

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function StatusCell({ job }: { job: ConversionJob }) {
  if (job.status === "DONE") return <Badge tone="success">Xong</Badge>;
  if (job.status === "FAILED")
    return (
      <span className="group relative">
        <Badge tone="danger">Lỗi</Badge>
        {job.error && (
          <span className="pointer-events-none absolute left-0 top-full z-10 mt-1 hidden w-56 rounded-lg bg-slate-800 p-2 text-xs text-white group-hover:block">
            {job.error}
          </span>
        )}
      </span>
    );
  if (job.status === "PROCESSING")
    return (
      <div className="w-32">
        <ProgressBar ratio={job.progress} />
        <p className="mt-1 text-xs text-slate-400">{Math.round(job.progress * 100)}%</p>
      </div>
    );
  return <Badge tone="info">Đang chờ</Badge>;
}

export function MediaMonitor() {
  const toast = useToast();
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    api
      .getMediaJobs({ take: 100 })
      .then((res) => {
        setJobs(res.jobs);
        setTotal(res.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // Polls at a fixed interval rather than only while a job is active - simplest
    // reliable option for an internal monitor page, and negligible load at 3s/GET.
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.convertMedia((() => {
        const fd = new FormData();
        fd.set("file", file);
        return fd;
      })());
      toast.success("Đã thêm vào hàng đợi chuyển đổi.");
      load();
    } catch {
      toast.error("Tải file lên thất bại.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleBackfill = async () => {
    setBackfilling(true);
    try {
      const res = await api.backfillMediaJobs();
      toast.success(res.enqueued > 0 ? `Đã thêm ${res.enqueued} file vào hàng đợi.` : "Không có file nào cần nén lại.");
      load();
    } catch {
      toast.error("Không thể quét media cũ.");
    } finally {
      setBackfilling(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Media Converter"
        actions={
          <Button variant="secondary" onClick={handleBackfill} disabled={backfilling}>
            {backfilling ? "Đang quét..." : "Convert lại media cũ"}
          </Button>
        }
      />

      <div className="mb-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
        <UploadSimple size={28} className="mx-auto mb-2 text-slate-400" />
        <p className="mb-3 text-sm text-slate-600">Chọn 1 file ảnh hoặc video để nén thử sang webp/webm</p>
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? "Đang tải lên..." : "Chọn file"}
        </Button>
      </div>

      {loading ? null : jobs.length === 0 ? (
        <EmptyState icon={ImageIcon} title="Chưa có job chuyển đổi nào" description="Upload ảnh/video ở trên hoặc tạo/sửa một bài học để thấy job xuất hiện tại đây." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">File gốc</th>
                <th className="px-4 py-3">Dung lượng</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Liên quan</th>
                <th className="px-4 py-3">Kết quả</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const reduction =
                  job.status === "DONE" && job.outputBytes && job.sourceBytes
                    ? Math.round((1 - job.outputBytes / job.sourceBytes) * 100)
                    : null;
                return (
                  <tr key={job.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-slate-400">
                      {job.kind === "IMAGE" ? <ImageIcon size={18} /> : <FileVideo size={18} />}
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-700">{job.sourceName}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {formatBytes(job.sourceBytes)}
                      {reduction != null && (
                        <>
                          {" → "}
                          {formatBytes(job.outputBytes)}{" "}
                          <span className="font-medium text-green-600">(-{reduction}%)</span>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <StatusCell job={job} />
                    </td>
                    <td className="px-4 py-2 text-slate-500">
                      {job.story ? (
                        <Link to={`/stories/${job.story.id}`} className="text-sky-600 hover:underline">
                          {job.story.title}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {job.outputUrl ? (
                        <a href={job.outputUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sky-600 hover:underline">
                          Xem <ArrowSquareOut size={14} />
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {total > jobs.length && <p className="mt-3 text-xs text-slate-400">Hiển thị {jobs.length}/{total} job gần nhất.</p>}
    </div>
  );
}
