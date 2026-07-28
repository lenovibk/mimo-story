import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import type { UserListItem } from "@/types";

const PAGE_SIZE = 20;
const PLANS = ["free", "premium", "family"];

export function UsersList() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .getUsers({ search: search || undefined, skip: page * PAGE_SIZE, take: PAGE_SIZE })
      .then((res) => {
        setUsers(res.users);
        setTotal(res.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [search, page]);

  const handlePlanChange = async (id: string, plan: string) => {
    await api.updateUserPlan(id, plan);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, plan } : u)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xoá người dùng này? Toàn bộ hồ sơ bé, yêu thích, tiến độ sẽ mất theo.")) return;
    await api.deleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setTotal((t) => t - 1);
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Người dùng</h1>

      <input
        value={search}
        onChange={(e) => {
          setPage(0);
          setSearch(e.target.value);
        }}
        placeholder="Tìm theo email..."
        className="mb-4 w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-400"
      />

      {loading ? (
        <p className="text-slate-500">Đang tải...</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Loại</th>
                  <th className="px-4 py-3">Gói</th>
                  <th className="px-4 py-3">Số bé</th>
                  <th className="px-4 py-3">Ngày tạo</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      <Link to={`/users/${u.id}`} className="font-medium text-sky-600 hover:underline">
                        {u.email ?? "(khách)"}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate-500">{u.isGuest ? "Khách" : "Thành viên"}</td>
                    <td className="px-4 py-2">
                      <select value={u.plan} onChange={(e) => handlePlanChange(u.id, e.target.value)} className="rounded border border-slate-300 px-2 py-1 text-sm">
                        {PLANS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-slate-500">{u.childrenCount}</td>
                    <td className="px-4 py-2 text-slate-500">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td className="px-4 py-2 text-right">
                      <button type="button" onClick={() => handleDelete(u.id)} className="font-medium text-red-500 hover:underline">
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>
              {total === 0 ? 0 : page * PAGE_SIZE + 1}–{Math.min(total, (page + 1) * PAGE_SIZE)} / {total}
            </span>
            <div className="flex gap-2">
              <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40">
                Trước
              </button>
              <button
                type="button"
                disabled={(page + 1) * PAGE_SIZE >= total}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
