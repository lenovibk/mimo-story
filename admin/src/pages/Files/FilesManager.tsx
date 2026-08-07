import { useCallback, useEffect, useRef, useState, type DragEvent, type MouseEvent, type ReactNode } from "react";
import {
  ArrowsOutCardinal,
  CaretRight,
  DotsThreeVertical,
  DownloadSimple,
  File as FileIcon,
  FileAudio,
  FileText,
  FileVideo,
  FileZip,
  FolderPlus,
  FolderSimple,
  GridFour,
  HouseSimple,
  Image as ImageIcon,
  LinkSimple,
  PencilSimple,
  Rows,
  TrashSimple,
  UploadSimple,
} from "@phosphor-icons/react";
import { api, ApiError } from "@/services/api";
import type { FileEntry } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { useToast } from "@/components/ui/Toast";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BulkActionButton, BulkActionsBar, HeaderCheckbox } from "@/components/ui/BulkActionsBar";

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "webp", "gif", "svg", "avif"]);
const VIDEO_EXT = new Set(["mp4", "webm", "mov", "mkv", "avi"]);
const AUDIO_EXT = new Set(["mp3", "wav", "ogg", "m4a", "aac"]);
const TEXT_EXT = new Set(["vtt", "srt", "txt", "json", "csv"]);

function extOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function isZip(name: string): boolean {
  return extOf(name) === "zip";
}

function iconForFile(name: string) {
  const ext = extOf(name);
  if (IMAGE_EXT.has(ext)) return ImageIcon;
  if (VIDEO_EXT.has(ext)) return FileVideo;
  if (AUDIO_EXT.has(ext)) return FileAudio;
  if (TEXT_EXT.has(ext)) return FileText;
  if (ext === "zip") return FileZip;
  return FileIcon;
}

function parentOf(p: string): string {
  const idx = p.lastIndexOf("/");
  return idx === -1 ? "" : p.slice(0, idx);
}

function crumbsFor(p: string): { label: string; path: string }[] {
  if (!p) return [];
  return p.split("/").map((label, i, arr) => ({ label, path: arr.slice(0, i + 1).join("/") }));
}

/** Google-Drive-style browser over the server's `uploads/` tree: navigate, create/rename/move/delete folders and files, drag-drop to move or upload. */
export function FilesManager() {
  const toast = useToast();
  const { confirm, dialog } = useConfirmDialog();

  const [currentPath, setCurrentPath] = useState("");
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => (localStorage.getItem("mimokids-files-view") === "list" ? "list" : "grid"));

  const [draggingPath, setDraggingPath] = useState<string | null>(null);
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);
  const [dragOverExternal, setDragOverExternal] = useState(false);

  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameTarget, setRenameTarget] = useState<FileEntry | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [moveTarget, setMoveTarget] = useState<FileEntry | FileEntry[] | null>(null);
  const [movePath, setMovePath] = useState("");
  const [moveFolders, setMoveFolders] = useState<FileEntry[]>([]);
  const [moveLoading, setMoveLoading] = useState(false);
  const [extractTarget, setExtractTarget] = useState<FileEntry | null>(null);
  const [extractDeleteSource, setExtractDeleteSource] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback((path: string) => {
    setLoading(true);
    api
      .getFiles(path)
      .then((res) => setEntries(res.entries))
      .catch(() => toast.error("Không tải được danh sách file."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSelected(new Set());
    load(currentPath);
  }, [currentPath, load]);

  useEffect(() => {
    localStorage.setItem("mimokids-files-view", viewMode);
  }, [viewMode]);

  const visibleEntries = search.trim() ? entries.filter((e) => e.name.toLowerCase().includes(search.trim().toLowerCase())) : entries;
  const allVisibleSelected = visibleEntries.length > 0 && visibleEntries.every((e) => selected.has(e.path));

  const navigate = (path: string) => {
    setSearch("");
    setMenuFor(null);
    setCurrentPath(path);
  };

  const toggleSelect = (path: string, exclusive: boolean) => {
    setSelected((prev) => {
      if (exclusive) return prev.has(path) && prev.size === 1 ? new Set() : new Set([path]);
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected(allVisibleSelected ? new Set() : new Set(visibleEntries.map((e) => e.path)));
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      await api.createFolder(currentPath, name);
      toast.success("Đã tạo thư mục.");
      setNewFolderOpen(false);
      setNewFolderName("");
      load(currentPath);
    } catch (err) {
      toast.error(err instanceof ApiError && err.code === "already_exists" ? "Tên thư mục đã tồn tại." : "Tạo thư mục thất bại.");
    }
  };

  const handleUpload = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    try {
      await api.uploadFiles(currentPath, files);
      toast.success(`Đã tải lên ${files.length} file.`);
      load(currentPath);
    } catch {
      toast.error("Tải file lên thất bại.");
    } finally {
      setUploading(false);
    }
  };

  const handleRename = async () => {
    if (!renameTarget) return;
    const name = renameValue.trim();
    if (!name || name === renameTarget.name) {
      setRenameTarget(null);
      return;
    }
    try {
      await api.renameFile(renameTarget.path, name);
      toast.success("Đã đổi tên.");
      setRenameTarget(null);
      load(currentPath);
    } catch (err) {
      toast.error(err instanceof ApiError && err.code === "already_exists" ? "Tên đã tồn tại." : "Đổi tên thất bại.");
    }
  };

  const handleMoveTo = async (targetPath: string) => {
    const items = Array.isArray(moveTarget) ? moveTarget : moveTarget ? [moveTarget] : [];
    if (!items.length) return;
    try {
      await Promise.all(items.map((it) => api.moveFile(it.path, targetPath)));
      toast.success(items.length > 1 ? `Đã di chuyển ${items.length} mục.` : "Đã di chuyển.");
      setMoveTarget(null);
      setSelected(new Set());
      load(currentPath);
    } catch {
      toast.error("Di chuyển thất bại.");
    }
  };

  const handleDropMove = async (path: string, targetPath: string) => {
    if (path === targetPath || parentOf(path) === targetPath) return;
    try {
      await api.moveFile(path, targetPath);
      toast.success("Đã di chuyển.");
      load(currentPath);
    } catch {
      toast.error("Di chuyển thất bại.");
    }
  };

  const handleDelete = async (entriesToDelete: FileEntry[]) => {
    if (!entriesToDelete.length) return;
    const label =
      entriesToDelete.length === 1
        ? `${entriesToDelete[0].type === "folder" ? "thư mục" : "file"} "${entriesToDelete[0].name}"`
        : `${entriesToDelete.length} mục đã chọn`;
    if (!(await confirm(`Xoá ${label}? Không thể hoàn tác.`))) return;
    try {
      await api.deleteFiles(entriesToDelete.map((e) => e.path));
      toast.success("Đã xoá.");
      setSelected(new Set());
      load(currentPath);
    } catch {
      toast.error("Xoá thất bại.");
    }
  };

  const handleExtract = async () => {
    if (!extractTarget) return;
    setExtracting(true);
    try {
      const { folder, fileCount } = await api.extractZip(extractTarget.path, extractDeleteSource);
      toast.success(`Đã giải nén ${fileCount} file vào thư mục "${folder.name}".`);
      setExtractTarget(null);
      setExtractDeleteSource(false);
      load(currentPath);
    } catch (err) {
      toast.error(err instanceof ApiError && err.code === "invalid_zip" ? "File zip không hợp lệ hoặc quá lớn." : "Giải nén thất bại.");
    } finally {
      setExtracting(false);
    }
  };

  const openMoveDialog = (target: FileEntry | FileEntry[]) => {
    setMoveTarget(target);
    setMovePath(currentPath);
  };

  useEffect(() => {
    if (!moveTarget) return;
    setMoveLoading(true);
    api
      .getFiles(movePath)
      .then((res) => setMoveFolders(res.entries.filter((e) => e.type === "folder")))
      .catch(() => toast.error("Không tải được thư mục."))
      .finally(() => setMoveLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveTarget, movePath]);

  const selectedEntries = entries.filter((e) => selected.has(e.path));

  /** Drag/select/navigate behaviour shared by the grid card and the list row for a given entry. */
  function entryInteractionProps(entry: FileEntry) {
    const isFolder = entry.type === "folder";
    return {
      draggable: true,
      onDragStart: (e: DragEvent) => {
        e.stopPropagation();
        setDraggingPath(entry.path);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", entry.path);
      },
      onDragEnd: () => {
        setDraggingPath(null);
        setDragOverPath(null);
      },
      onDragOver: (e: DragEvent) => {
        if (isFolder && draggingPath && draggingPath !== entry.path) {
          e.preventDefault();
          e.stopPropagation();
          setDragOverPath(entry.path);
        }
      },
      onDragLeave: () => setDragOverPath((p) => (p === entry.path ? null : p)),
      onDrop: (e: DragEvent) => {
        if (isFolder && draggingPath) {
          e.preventDefault();
          e.stopPropagation();
          setDragOverPath(null);
          handleDropMove(draggingPath, entry.path);
        }
      },
      onClick: (e: MouseEvent) => {
        e.stopPropagation();
        setMenuFor(null);
        toggleSelect(entry.path, !e.ctrlKey && !e.metaKey);
      },
      onDoubleClick: () => {
        if (isFolder) navigate(entry.path);
        else if (entry.url) window.open(entry.url, "_blank", "noopener");
      },
      title: `${entry.name}${isFolder ? "" : ` · ${formatBytes(entry.size)}`} · ${formatDate(entry.mtime)}`,
    };
  }

  /** The "..." dropdown shown on both the grid card and the list row. */
  function renderEntryMenu(entry: FileEntry): ReactNode {
    if (menuFor !== entry.path) return null;
    const isFolder = entry.type === "folder";
    return (
      <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg">
        <button
          type="button"
          onClick={() => {
            setMenuFor(null);
            setRenameTarget(entry);
            setRenameValue(entry.name);
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-600 hover:bg-slate-50"
        >
          <PencilSimple size={15} /> Đổi tên
        </button>
        <button
          type="button"
          onClick={() => {
            setMenuFor(null);
            openMoveDialog(entry);
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-600 hover:bg-slate-50"
        >
          <ArrowsOutCardinal size={15} /> Di chuyển đến...
        </button>
        {!isFolder && isZip(entry.name) && (
          <button
            type="button"
            onClick={() => {
              setMenuFor(null);
              setExtractTarget(entry);
              setExtractDeleteSource(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-600 hover:bg-slate-50"
          >
            <FileZip size={15} /> Giải nén
          </button>
        )}
        {!isFolder && entry.url && (
          <>
            <button
              type="button"
              onClick={() => {
                setMenuFor(null);
                window.open(entry.url!, "_blank", "noopener");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-600 hover:bg-slate-50"
            >
              <DownloadSimple size={15} /> Mở / Tải xuống
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuFor(null);
                navigator.clipboard.writeText(entry.url!).then(
                  () => toast.success("Đã copy link."),
                  () => toast.error("Copy thất bại.")
                );
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-600 hover:bg-slate-50"
            >
              <LinkSimple size={15} /> Copy link
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => {
            setMenuFor(null);
            handleDelete([entry]);
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-500 hover:bg-red-50"
        >
          <TrashSimple size={15} /> Xoá
        </button>
      </div>
    );
  }

  return (
    <div onClick={() => setMenuFor(null)}>
      <PageHeader
        title="Quản lý file"
        actions={
          <>
            <Button variant="secondary" icon={<FolderPlus size={16} />} onClick={() => setNewFolderOpen(true)}>
              Thư mục mới
            </Button>
            <Button icon={<UploadSimple size={16} />} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? "Đang tải lên..." : "Tải file lên"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                handleUpload(files);
                e.target.value = "";
              }}
            />
          </>
        }
      />

      <p className="mb-4 -mt-4 text-xs text-slate-400">
        Đây là kho file gốc trên server. Đổi tên/di chuyển/xoá file đang được Bài học hoặc Quảng cáo sử dụng có thể làm hỏng liên kết của chúng.
      </p>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          <button
            type="button"
            onClick={() => navigate("")}
            onDragOver={(e) => {
              if (draggingPath) e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (draggingPath) handleDropMove(draggingPath, "");
            }}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 font-medium hover:bg-slate-100 ${currentPath === "" ? "text-slate-800" : "text-sky-600"}`}
          >
            <HouseSimple size={15} weight="bold" />
            Uploads
          </button>
          {crumbsFor(currentPath).map((c, i, arr) => (
            <span key={c.path} className="flex items-center gap-1">
              <CaretRight size={12} className="text-slate-300" />
              <button
                type="button"
                onClick={() => navigate(c.path)}
                onDragOver={(e) => {
                  if (draggingPath) e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggingPath) handleDropMove(draggingPath, c.path);
                }}
                className={`rounded-lg px-2 py-1 font-medium hover:bg-slate-100 ${i === arr.length - 1 ? "text-slate-800" : "text-sky-600"}`}
              >
                {c.label}
              </button>
            </span>
          ))}
        </nav>
        <SearchInput placeholder="Tìm trong thư mục..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-500">
          <HeaderCheckbox checked={allVisibleSelected} onChange={toggleSelectAll} disabled={visibleEntries.length === 0} />
          Chọn tất cả{visibleEntries.length > 0 ? ` (${visibleEntries.length})` : ""}
        </label>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            title="Dạng lưới"
            className={`rounded-md p-1.5 ${viewMode === "grid" ? "bg-sky-100 text-sky-700" : "text-slate-400 hover:bg-slate-50"}`}
          >
            <GridFour size={16} weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            title="Dạng danh sách"
            className={`rounded-md p-1.5 ${viewMode === "list" ? "bg-sky-100 text-sky-700" : "text-slate-400 hover:bg-slate-50"}`}
          >
            <Rows size={16} weight="bold" />
          </button>
        </div>
      </div>

      <BulkActionsBar count={selected.size} onClear={() => setSelected(new Set())}>
        <BulkActionButton onClick={() => openMoveDialog(selectedEntries)}>Di chuyển</BulkActionButton>
        <BulkActionButton variant="danger" onClick={() => handleDelete(selectedEntries)}>
          Xoá đã chọn
        </BulkActionButton>
      </BulkActionsBar>

      <div
        className={`rounded-2xl border-2 border-dashed p-3 transition-colors ${dragOverExternal ? "border-sky-400 bg-sky-50" : "border-transparent"}`}
        onDragOver={(e: DragEvent) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setDragOverExternal(true);
          }
        }}
        onDragLeave={() => setDragOverExternal(false)}
        onDrop={(e: DragEvent) => {
          e.preventDefault();
          setDragOverExternal(false);
          const files = Array.from(e.dataTransfer.files ?? []);
          if (files.length) handleUpload(files);
        }}
      >
        {loading ? (
          <Spinner />
        ) : visibleEntries.length === 0 ? (
          <EmptyState
            icon={FolderSimple}
            title={search ? "Không tìm thấy file phù hợp" : "Thư mục trống"}
            description={search ? undefined : "Kéo thả file vào đây hoặc bấm “Tải file lên”."}
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {visibleEntries.map((entry) => {
              const isFolder = entry.type === "folder";
              const Icon = isFolder ? FolderSimple : iconForFile(entry.name);
              const isSelected = selected.has(entry.path);
              const isDragOver = dragOverPath === entry.path;
              const isThumb = !isFolder && entry.url && IMAGE_EXT.has(extOf(entry.name));

              return (
                <div
                  key={entry.path}
                  {...entryInteractionProps(entry)}
                  className={`group relative flex cursor-pointer flex-col rounded-2xl border p-3 shadow-sm transition-colors ${
                    isDragOver
                      ? "border-sky-400 bg-sky-50"
                      : isSelected
                        ? "border-sky-300 bg-sky-50"
                        : "border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(entry.path, false)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuFor(menuFor === entry.path ? null : entry.path);
                      }}
                      className="rounded p-0.5 text-slate-400 opacity-0 hover:bg-slate-200 group-hover:opacity-100"
                    >
                      <DotsThreeVertical size={16} weight="bold" />
                    </button>
                  </div>

                  <div className="mb-2 flex h-16 items-center justify-center">
                    {isThumb ? (
                      <img src={entry.url!} alt="" className="max-h-16 max-w-full rounded object-contain" />
                    ) : (
                      <Icon size={36} weight="duotone" className={isFolder ? "text-sky-400" : "text-slate-400"} />
                    )}
                  </div>

                  <p className="truncate text-center text-xs font-medium text-slate-700" title={entry.name}>
                    {entry.name}
                  </p>
                  {!isFolder && <p className="text-center text-[11px] text-slate-400">{formatBytes(entry.size)}</p>}

                  {renderEntryMenu(entry)}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            {/* No overflow-y clipping here (unlike other admin tables) - the per-row "..." dropdown is absolutely
                positioned inside its cell and would get cut off by a bottom row's menu otherwise. */}
            <table className="w-full text-left text-sm">
              <thead className="rounded-t-xl bg-slate-50 text-xs text-slate-400">
                <tr>
                  <th className="w-10 px-3 py-2"></th>
                  <th className="px-3 py-2 font-medium">Tên</th>
                  <th className="w-28 px-3 py-2 font-medium">Kích thước</th>
                  <th className="w-44 px-3 py-2 font-medium">Sửa đổi</th>
                  <th className="w-10 px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {visibleEntries.map((entry) => {
                  const isFolder = entry.type === "folder";
                  const Icon = isFolder ? FolderSimple : iconForFile(entry.name);
                  const isSelected = selected.has(entry.path);
                  const isDragOver = dragOverPath === entry.path;
                  const isThumb = !isFolder && entry.url && IMAGE_EXT.has(extOf(entry.name));

                  return (
                    <tr
                      key={entry.path}
                      {...entryInteractionProps(entry)}
                      className={`group cursor-pointer border-t border-slate-100 transition-colors ${
                        isDragOver ? "bg-sky-50" : isSelected ? "bg-sky-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(entry.path, false)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {isThumb ? (
                            <img src={entry.url!} alt="" className="h-7 w-7 shrink-0 rounded object-cover" />
                          ) : (
                            <Icon size={20} weight="duotone" className={`shrink-0 ${isFolder ? "text-sky-400" : "text-slate-400"}`} />
                          )}
                          <span className="truncate font-medium text-slate-700">{entry.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-400">{isFolder ? "—" : formatBytes(entry.size)}</td>
                      <td className="px-3 py-2 text-slate-400">{formatDate(entry.mtime)}</td>
                      <td className="relative px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuFor(menuFor === entry.path ? null : entry.path);
                          }}
                          className="rounded p-0.5 text-slate-400 opacity-0 hover:bg-slate-200 group-hover:opacity-100"
                        >
                          <DotsThreeVertical size={16} weight="bold" />
                        </button>
                        {renderEntryMenu(entry)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {newFolderOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-6" onClick={() => setNewFolderOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-sm font-semibold text-slate-700">Thư mục mới</p>
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              placeholder="Tên thư mục"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-400"
            />
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setNewFolderOpen(false)}>
                Huỷ
              </Button>
              <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                Tạo
              </Button>
            </div>
          </div>
        </div>
      )}

      {renameTarget && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-6" onClick={() => setRenameTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-sm font-semibold text-slate-700">Đổi tên</p>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-400"
            />
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setRenameTarget(null)}>
                Huỷ
              </Button>
              <Button onClick={handleRename} disabled={!renameValue.trim()}>
                Lưu
              </Button>
            </div>
          </div>
        </div>
      )}

      {extractTarget && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-6" onClick={() => !extracting && setExtractTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="mb-1 text-sm font-semibold text-slate-700">Giải nén "{extractTarget.name}"</p>
            <p className="mb-3 text-xs text-slate-400">
              Nội dung sẽ được giải nén vào một thư mục mới cùng cấp, tên "{extractTarget.name.replace(/\.zip$/i, "")}".
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={extractDeleteSource}
                onChange={(e) => setExtractDeleteSource(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
              />
              Xoá file zip sau khi giải nén
            </label>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setExtractTarget(null)} disabled={extracting}>
                Huỷ
              </Button>
              <Button onClick={handleExtract} disabled={extracting}>
                {extracting ? "Đang giải nén..." : "Giải nén"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {moveTarget && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-6" onClick={() => setMoveTarget(null)}>
          <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-sm font-semibold text-slate-700">Di chuyển đến...</p>
            <nav className="mb-3 flex flex-wrap items-center gap-1 text-xs">
              <button type="button" onClick={() => setMovePath("")} className={`rounded px-1.5 py-0.5 hover:bg-slate-100 ${movePath === "" ? "font-semibold text-slate-800" : "text-sky-600"}`}>
                Uploads
              </button>
              {crumbsFor(movePath).map((c, i, arr) => (
                <span key={c.path} className="flex items-center gap-1">
                  <CaretRight size={10} className="text-slate-300" />
                  <button
                    type="button"
                    onClick={() => setMovePath(c.path)}
                    className={`rounded px-1.5 py-0.5 hover:bg-slate-100 ${i === arr.length - 1 ? "font-semibold text-slate-800" : "text-sky-600"}`}
                  >
                    {c.label}
                  </button>
                </span>
              ))}
            </nav>
            <div className="min-h-[10rem] flex-1 overflow-y-auto rounded-lg border border-slate-100">
              {moveLoading ? (
                <Spinner />
              ) : moveFolders.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-400">Không có thư mục con.</p>
              ) : (
                moveFolders.map((f) => (
                  <button
                    key={f.path}
                    type="button"
                    onClick={() => setMovePath(f.path)}
                    className="flex w-full items-center gap-2 border-b border-slate-50 px-3 py-2 text-left text-sm text-slate-600 last:border-0 hover:bg-slate-50"
                  >
                    <FolderSimple size={16} className="text-sky-400" weight="duotone" />
                    {f.name}
                  </button>
                ))
              )}
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setMoveTarget(null)}>
                Huỷ
              </Button>
              <Button onClick={() => handleMoveTo(movePath)}>Chuyển vào đây</Button>
            </div>
          </div>
        </div>
      )}

      {dialog}
    </div>
  );
}
