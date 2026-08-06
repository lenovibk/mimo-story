import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/services/api";
import type { UserDetail } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .getUser(id)
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!user) return <p className="text-slate-500">Không tìm thấy người dùng.</p>;

  return (
    <div className="w-full">
      <PageHeader title={user.email ?? "Người dùng khách"} backTo="/users" />

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Loại</p>
          <p className="font-medium text-slate-800">{user.isGuest ? "Khách" : "Thành viên"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Gói</p>
          <p className="font-medium text-slate-800">{user.plan}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Ngày tạo</p>
          <p className="font-medium text-slate-800">{new Date(user.createdAt).toLocaleDateString("vi-VN")}</p>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-bold text-slate-800">Hồ sơ bé ({user.children.length})</h2>
      <div className="flex flex-col gap-3">
        {user.children.map((c) => (
          <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="font-medium text-slate-800">
              {c.name} · {c.age} tuổi · {c.gender === "boy" ? "Bé trai" : "Bé gái"}
            </p>
            <p className="text-sm text-slate-500">⭐ {c.stars} sao</p>
            {c.interests.length > 0 && <p className="mt-1 text-xs text-slate-400">Sở thích: {c.interests.join(", ")}</p>}
          </div>
        ))}
        {user.children.length === 0 && <p className="text-sm text-slate-400">Chưa có hồ sơ bé nào.</p>}
      </div>
    </div>
  );
}
