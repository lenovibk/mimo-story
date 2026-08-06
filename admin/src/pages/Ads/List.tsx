import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowsClockwise, Megaphone, Plus } from "@phosphor-icons/react";
import { api } from "@/services/api";
import type { Ad } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useSelection } from "@/hooks/useSelection";
import { BulkActionsBar, BulkActionButton, HeaderCheckbox, RowCheckbox } from "@/components/ui/BulkActionsBar";

export function AdsList() {
  const toast = useToast();
  const { confirm, dialog } = useConfirmDialog();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .getAds()
      .then(setAds)
      .catch(() => toast.error("Không tải được danh sách quảng cáo."))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  const handleToggleActive = async (ad: Ad) => {
    try {
      const formData = new FormData();
      formData.set("active", String(!ad.active));
      await api.updateAd(ad.id, formData);
      setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, active: !a.active } : a)));
    } catch {
      toast.error("Cập nhật trạng thái thất bại.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm("Xoá quảng cáo này?"))) return;
    try {
      await api.deleteAd(id);
      setAds((prev) => prev.filter((a) => a.id !== id));
      toast.success("Đã xoá quảng cáo.");
    } catch {
      toast.error("Xoá quảng cáo thất bại.");
    }
  };

  const selection = useSelection(ads.map((a) => a.id));
  const [bulkBusy, setBulkBusy] = useState(false);

  const handleBulkDelete = async () => {
    const ids = Array.from(selection.selected);
    if (!(await confirm(`Xoá ${ids.length} quảng cáo đã chọn?`))) return;
    setBulkBusy(true);
    const results = await Promise.allSettled(ids.map((id) => api.deleteAd(id)));
    const failed = results.filter((r) => r.status === "rejected").length;
    setAds((prev) => prev.filter((a) => !ids.includes(a.id)));
    selection.clear();
    setBulkBusy(false);
    if (failed > 0) toast.error(`Xoá thất bại ${failed}/${ids.length} quảng cáo.`);
    else toast.success(`Đã xoá ${ids.length} quảng cáo.`);
  };

  const handleBulkActive = async (active: boolean) => {
    const ids = Array.from(selection.selected);
    setBulkBusy(true);
    const results = await Promise.allSettled(
      ids.map((id) => {
        const formData = new FormData();
        formData.set("active", String(active));
        return api.updateAd(id, formData);
      })
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    setAds((prev) => prev.map((a) => (ids.includes(a.id) ? { ...a, active } : a)));
    setBulkBusy(false);
    if (failed > 0) toast.error(`Cập nhật thất bại ${failed}/${ids.length} quảng cáo.`);
    else toast.success(`Đã ${active ? "bật" : "tắt"} ${ids.length} quảng cáo.`);
  };

  const [convertingId, setConvertingId] = useState<string | null>(null);
  const handleConvert = async (id: string) => {
    setConvertingId(id);
    try {
      await api.convertAdMedia(id);
      toast.success("Đã thêm ảnh vào hàng đợi nén lại.");
    } catch {
      toast.error("Không thể thêm vào hàng đợi convert.");
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Quảng cáo"
        actions={
          <ButtonLink to="/ads/new" icon={<Plus size={16} weight="bold" />}>
            Thêm quảng cáo
          </ButtonLink>
        }
      />

      {loading ? (
        <Spinner />
      ) : ads.length === 0 ? (
        <EmptyState icon={Megaphone} title="Chưa có quảng cáo nào" description="Bấm “Thêm quảng cáo” để tạo quảng cáo đầu tiên." />
      ) : (
        <>
          <BulkActionsBar count={selection.selected.size} onClear={selection.clear}>
            <BulkActionButton onClick={() => handleBulkActive(true)} disabled={bulkBusy}>
              Bật
            </BulkActionButton>
            <BulkActionButton onClick={() => handleBulkActive(false)} disabled={bulkBusy}>
              Tắt
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
                <th className="px-4 py-3">Ảnh</th>
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3">Vị trí</th>
                <th className="px-4 py-3">Tuổi mục tiêu</th>
                <th className="px-4 py-3">Ưu tiên</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {ads.map((ad) => (
                <tr key={ad.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    <RowCheckbox checked={selection.selected.has(ad.id)} onChange={() => selection.toggle(ad.id)} />
                  </td>
                  <td className="px-4 py-2">
                    <img src={ad.imageUrl} alt="" className="h-10 w-20 rounded object-cover" />
                  </td>
                  <td className="px-4 py-2">
                    <Link to={`/ads/${ad.id}`} className="font-medium text-slate-700 hover:text-sky-600 hover:underline">
                      {ad.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-500">{ad.placement}</td>
                  <td className="px-4 py-2 text-slate-500">{ad.minAge != null || ad.maxAge != null ? `${ad.minAge ?? "0"}–${ad.maxAge ?? "∞"}` : "Tất cả"}</td>
                  <td className="px-4 py-2 text-slate-500">{ad.priority}</td>
                  <td className="px-4 py-2">
                    <button type="button" onClick={() => handleToggleActive(ad)}>
                      <Badge tone={ad.active ? "success" : "neutral"}>{ad.active ? "Đang chạy" : "Tắt"}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <Link to={`/ads/${ad.id}`} className="mr-3 font-medium text-sky-600 hover:underline">
                      Sửa
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleConvert(ad.id)}
                      disabled={convertingId === ad.id}
                      title="Nén lại ảnh sang webp"
                      className="mr-3 inline-flex items-center gap-1 font-medium text-sky-600 hover:underline disabled:opacity-40"
                    >
                      <ArrowsClockwise size={14} />
                      Convert
                    </button>
                    <button type="button" onClick={() => handleDelete(ad.id)} className="font-medium text-red-500 hover:underline">
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
      {dialog}
    </div>
  );
}
