import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowsClockwise, BookOpen, Plus } from "@phosphor-icons/react";
import { api, ApiError } from "@/services/api";
import type { Category, Program, Story } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useSelection } from "@/hooks/useSelection";
import { BulkActionsBar, BulkActionButton, HeaderCheckbox, RowCheckbox } from "@/components/ui/BulkActionsBar";

const PAGE_SIZE = 20;

export function StoriesList() {
  const toast = useToast();
  const { confirm, dialog } = useConfirmDialog();
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
      .catch(() => toast.error("Không tải được danh sách bài học."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter, programFilter, page]);

  const handleDelete = async (id: string) => {
    if (!(await confirm("Xoá bài học này? Không thể hoàn tác."))) return;
    try {
      await api.deleteStory(id);
      setStories((prev) => prev.filter((s) => s.id !== id));
      setTotal((t) => t - 1);
      toast.success("Đã xoá bài học.");
    } catch {
      toast.error("Xoá bài học thất bại.");
    }
  };

  const selection = useSelection(stories.map((s) => s.id));
  const [bulkBusy, setBulkBusy] = useState(false);

  const handleBulkDelete = async () => {
    const ids = Array.from(selection.selected);
    if (!(await confirm(`Xoá ${ids.length} bài học đã chọn? Không thể hoàn tác.`))) return;
    setBulkBusy(true);
    const results = await Promise.allSettled(ids.map((id) => api.deleteStory(id)));
    const failed = results.filter((r) => r.status === "rejected").length;
    setStories((prev) => prev.filter((s) => !ids.includes(s.id)));
    setTotal((t) => t - (ids.length - failed));
    selection.clear();
    setBulkBusy(false);
    if (failed > 0) toast.error(`Xoá thất bại ${failed}/${ids.length} bài học.`);
    else toast.success(`Đã xoá ${ids.length} bài học.`);
  };

  const handleBulkPublish = async (published: boolean) => {
    const ids = Array.from(selection.selected);
    setBulkBusy(true);
    const results = await Promise.allSettled(
      ids.map((id) => {
        const formData = new FormData();
        formData.set("published", String(published));
        return api.updateStory(id, formData);
      })
    );
    const succeededIds = ids.filter((_, i) => results[i].status === "fulfilled");
    const missingFilesCount = results.filter(
      (r) => r.status === "rejected" && r.reason instanceof ApiError && r.reason.code === "missing_files"
    ).length;
    const otherFailedCount = ids.length - succeededIds.length - missingFilesCount;
    setStories((prev) => prev.map((s) => (succeededIds.includes(s.id) ? { ...s, published } : s)));
    setBulkBusy(false);
    if (missingFilesCount > 0) {
      toast.error(
        `${missingFilesCount} bài chưa có video/phụ đề nên không thể hiển thị - vào "Sửa" từng bài để thêm trước.`
      );
    }
    if (otherFailedCount > 0) toast.error(`Cập nhật thất bại ${otherFailedCount}/${ids.length} bài học.`);
    if (succeededIds.length > 0) toast.success(`Đã ${published ? "hiện" : "ẩn"} ${succeededIds.length} bài học.`);
  };

  const [convertingId, setConvertingId] = useState<string | null>(null);
  const handleConvert = async (id: string) => {
    setConvertingId(id);
    try {
      await api.convertStoryMedia(id);
      setStories((prev) => prev.map((s) => (s.id === id ? { ...s, videoConverting: true } : s)));
      toast.success("Đã thêm ảnh bìa/video vào hàng đợi nén lại.");
    } catch {
      toast.error("Không thể thêm vào hàng đợi convert.");
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Bài học"
        actions={
          <ButtonLink to="/stories/new" icon={<Plus size={16} weight="bold" />}>
            Thêm bài học
          </ButtonLink>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={(e) => {
            setPage(0);
            setSearch(e.target.value);
          }}
          placeholder="Tìm theo tên bài học..."
          className="w-64"
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
        <Spinner />
      ) : stories.length === 0 ? (
        <EmptyState icon={BookOpen} title="Chưa có bài học nào" description="Bấm “Thêm bài học” để tạo bài học đầu tiên." />
      ) : (
        <>
          <BulkActionsBar count={selection.selected.size} onClear={selection.clear}>
            <BulkActionButton onClick={() => handleBulkPublish(true)} disabled={bulkBusy}>
              Hiện
            </BulkActionButton>
            <BulkActionButton onClick={() => handleBulkPublish(false)} disabled={bulkBusy}>
              Ẩn
            </BulkActionButton>
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
                  <th className="px-4 py-3">Ảnh bìa</th>
                  <th className="px-4 py-3">Tên bài học</th>
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
                      <RowCheckbox checked={selection.selected.has(s.id)} onChange={() => selection.toggle(s.id)} />
                    </td>
                    <td className="px-4 py-2">
                      <img src={s.coverUrl} alt="" className="h-12 w-9 rounded object-cover" />
                    </td>
                    <td className="px-4 py-2">
                      <Link to={`/stories/${s.id}`} className="font-medium text-slate-700 hover:text-sky-600 hover:underline">
                        {s.title}
                      </Link>
                      {s.episodeLabel && <p className="text-xs text-slate-400">{s.episodeLabel}</p>}
                    </td>
                    <td className="px-4 py-2 text-slate-500">{s.categoryLabel}</td>
                    <td className="px-4 py-2 text-slate-500">{s.programLabels.join(", ")}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {s.minAge != null || s.maxAge != null ? `${s.minAge ?? "0"}–${s.maxAge ?? "∞"}` : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone={s.published ? "success" : "neutral"}>{s.published ? "Hiển thị" : "Ẩn"}</Badge>
                        {s.videoSourceType === "YOUTUBE" && <Badge tone="info">YouTube</Badge>}
                        {s.videoConverting && <Badge tone="info">Đang nén video...</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <Link to={`/stories/${s.id}`} className="mr-3 font-medium text-sky-600 hover:underline">
                        Sửa
                      </Link>
                      {s.videoSourceType !== "YOUTUBE" && (
                        <button
                          type="button"
                          onClick={() => handleConvert(s.id)}
                          disabled={convertingId === s.id || s.videoConverting}
                          title="Nén lại ảnh bìa/video sang webp/webm"
                          className="mr-3 inline-flex items-center gap-1 font-medium text-sky-600 hover:underline disabled:opacity-40"
                        >
                          <ArrowsClockwise size={14} />
                          Convert
                        </button>
                      )}
                      <button type="button" onClick={() => handleDelete(s.id)} className="font-medium text-red-500 hover:underline">
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}
      {dialog}
    </div>
  );
}
