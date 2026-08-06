import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users as UsersIcon } from "@phosphor-icons/react";
import { api } from "@/services/api";
import type { UserListItem } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useSelection } from "@/hooks/useSelection";
import { BulkActionsBar, BulkActionButton, HeaderCheckbox, RowCheckbox } from "@/components/ui/BulkActionsBar";

const PAGE_SIZE = 20;
const PLANS = ["free", "premium", "family"];

export function UsersList() {
  const toast = useToast();
  const { confirm, dialog } = useConfirmDialog();
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
      .catch(() => toast.error("Không tải được danh sách người dùng."))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [search, page]);

  const handlePlanChange = async (id: string, plan: string) => {
    try {
      await api.updateUserPlan(id, plan);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, plan } : u)));
      toast.success("Đã cập nhật gói.");
    } catch {
      toast.error("Cập nhật gói thất bại.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm("Xoá người dùng này? Toàn bộ hồ sơ bé, yêu thích, tiến độ sẽ mất theo."))) return;
    try {
      await api.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setTotal((t) => t - 1);
      toast.success("Đã xoá người dùng.");
    } catch {
      toast.error("Xoá người dùng thất bại.");
    }
  };

  const selection = useSelection(users.map((u) => u.id));
  const [bulkBusy, setBulkBusy] = useState(false);

  const handleBulkDelete = async () => {
    const ids = Array.from(selection.selected);
    if (!(await confirm(`Xoá ${ids.length} người dùng đã chọn? Toàn bộ hồ sơ bé, yêu thích, tiến độ sẽ mất theo.`))) return;
    setBulkBusy(true);
    const results = await Promise.allSettled(ids.map((id) => api.deleteUser(id)));
    const failed = results.filter((r) => r.status === "rejected").length;
    setUsers((prev) => prev.filter((u) => !ids.includes(u.id)));
    setTotal((t) => t - (ids.length - failed));
    selection.clear();
    setBulkBusy(false);
    if (failed > 0) toast.error(`Xoá thất bại ${failed}/${ids.length} người dùng.`);
    else toast.success(`Đã xoá ${ids.length} người dùng.`);
  };

  return (
    <div>
      <PageHeader title="Người dùng" />

      <SearchInput
        value={search}
        onChange={(e) => {
          setPage(0);
          setSearch(e.target.value);
        }}
        placeholder="Tìm theo email..."
        className="mb-4 w-64"
      />

      {loading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="Chưa có người dùng nào" />
      ) : (
        <>
          <BulkActionsBar count={selection.selected.size} onClear={selection.clear}>
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
                      <RowCheckbox checked={selection.selected.has(u.id)} onChange={() => selection.toggle(u.id)} />
                    </td>
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

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}
      {dialog}
    </div>
  );
}
