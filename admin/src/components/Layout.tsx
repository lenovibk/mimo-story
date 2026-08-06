import { useState } from "react";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import {
  BookOpen,
  FilmStrip,
  List,
  Megaphone,
  SignOut,
  SquaresFour,
  Stack,
  Tag,
  Users,
  X,
} from "@phosphor-icons/react";
import { useAdminAuthStore } from "@/store/useAdminAuthStore";

const NAV = [
  { to: "/", label: "Tổng quan", end: true, icon: SquaresFour },
  { to: "/stories", label: "Bài học", icon: BookOpen },
  { to: "/categories", label: "Chủ đề", icon: Tag },
  { to: "/programs", label: "Chương trình", icon: Stack },
  { to: "/users", label: "Người dùng", icon: Users },
  { to: "/ads", label: "Quảng cáo", icon: Megaphone },
  { to: "/media", label: "Media", icon: FilmStrip },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const admin = useAdminAuthStore((s) => s.admin);
  const logout = useAdminAuthStore((s) => s.logout);

  return (
    <>
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-lg font-bold text-slate-800">MimoKids Admin</p>
        {admin && <p className="truncate text-xs text-slate-400">{admin.email}</p>}
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? "bg-sky-100 text-sky-700" : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              <Icon size={18} weight="bold" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-100"
        >
          <SignOut size={18} />
          Đăng xuất
        </button>
      </div>
    </>
  );
}

export function Layout() {
  const token = useAdminAuthStore((s) => s.token);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 flex w-64 flex-col bg-white shadow-xl">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <button type="button" onClick={() => setMobileOpen(true)} className="text-slate-500">
            {mobileOpen ? <X size={22} /> : <List size={22} />}
          </button>
          <p className="font-bold text-slate-800">MimoKids Admin</p>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
