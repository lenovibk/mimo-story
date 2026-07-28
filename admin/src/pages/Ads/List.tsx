import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import type { Ad } from "@/types";

export function AdsList() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .getAds()
      .then(setAds)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleToggleActive = async (ad: Ad) => {
    const formData = new FormData();
    formData.set("active", String(!ad.active));
    await api.updateAd(ad.id, formData);
    setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, active: !a.active } : a)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xoá quảng cáo này?")) return;
    await api.deleteAd(id);
    setAds((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Quảng cáo</h1>
        <Link to="/ads/new" className="rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700">
          + Thêm quảng cáo
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-500">Đang tải...</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
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
                    <img src={ad.imageUrl} alt="" className="h-10 w-20 rounded object-cover" />
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-700">{ad.title}</td>
                  <td className="px-4 py-2 text-slate-500">{ad.placement}</td>
                  <td className="px-4 py-2 text-slate-500">{ad.minAge != null || ad.maxAge != null ? `${ad.minAge ?? "0"}–${ad.maxAge ?? "∞"}` : "Tất cả"}</td>
                  <td className="px-4 py-2 text-slate-500">{ad.priority}</td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(ad)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ad.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {ad.active ? "Đang chạy" : "Tắt"}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <Link to={`/ads/${ad.id}`} className="mr-3 font-medium text-sky-600 hover:underline">
                      Sửa
                    </Link>
                    <button type="button" onClick={() => handleDelete(ad.id)} className="font-medium text-red-500 hover:underline">
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
