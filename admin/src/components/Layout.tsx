import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useAdminAuthStore } from "@/store/useAdminAuthStore";

const NAV = [
  { to: "/", label: "Tổng quan", end: true },
  { to: "/stories", label: "Truyện" },
  { to: "/categories", label: "Chủ đề" },
  { to: "/programs", label: "Chương trình" },
  { to: "/users", label: "Người dùng" },
  { to: "/ads", label: "Quảng cáo" },
];

export function Layout() {
  const token = useAdminAuthStore((s) => s.token);
  const admin = useAdminAuthStore((s) => s.admin);
  const logout = useAdminAuthStore((s) => s.logout);

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-lg font-bold">MimoKids Admin</p>
          {admin && <p className="truncate text-xs text-slate-400">{admin.email}</p>}
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-sky-100 text-sky-700" : "text-slate-600 hover:bg-slate-100"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
