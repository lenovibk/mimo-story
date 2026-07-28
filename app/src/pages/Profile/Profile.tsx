import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleButton, SolidPillButton } from "@/components/Button/Button";
import { IconBack, IconFamily, IconStar } from "@/components/Icon/Icon";
import { SkyBackground } from "@/components/SkyBackground/SkyBackground";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";
import type { DashboardStats } from "@/types";

/** Playful level names derived from total stars - purely cosmetic, no real curriculum behind it yet. */
function learningLevel(stars: number): string {
  if (stars < 50) return "Chồi non";
  if (stars < 150) return "Mầm xanh";
  if (stars < 400) return "Lá biếc";
  return "Ngôi sao nhỏ";
}

export function Profile() {
  const navigate = useNavigate();
  const children = useAuthStore((s) => s.children);
  const activeChildId = useAuthStore((s) => s.activeChildId);
  const setActiveChild = useAuthStore((s) => s.setActiveChild);
  const child = children.find((c) => c.id === activeChildId);

  const [stats, setStats] = useState<DashboardStats | null>(null);

  const handleSwitchChild = () => {
    setActiveChild(null);
    navigate("/select-child");
  };

  useEffect(() => {
    if (!activeChildId) return;
    api.getDashboard(activeChildId).then(setStats).catch(() => setStats(null));
  }, [activeChildId]);

  if (!child) return null;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <SkyBackground />

      <div className="no-scrollbar relative z-10 h-full overflow-y-auto overscroll-contain">
        <header className="safe-px safe-pt flex items-center gap-4">
          <CircleButton
            icon={<IconBack className="h-6 w-6" />}
            color="white"
            size={44}
            ariaLabel="Về trang chủ"
            onClick={() => navigate("/home")}
          />
          <h1 className="font-heading text-xl font-bold text-white drop-shadow-sm">Hồ sơ của bé</h1>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="safe-px mt-6 flex flex-col items-center gap-2"
        >
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-6xl shadow-lg">
            {child.gender === "boy" ? "👦" : "👧"}
          </span>
          <p className="font-heading text-2xl font-bold text-white drop-shadow-sm">{child.name}</p>
          <p className="font-body text-white/85">{child.age === 7 ? "7+ tuổi" : `${child.age} tuổi`}</p>
        </motion.div>

        <div className="safe-px mt-8 grid grid-cols-2 gap-3">
          <StatCard label="Cấp độ học" value={learningLevel(stats?.stars ?? child.stars)} />
          <StatCard
            label="Sao đã thu thập"
            value={String(stats?.stars ?? child.stars)}
            icon={<IconStar className="h-5 w-5 text-[#FFD54A]" />}
          />
          <StatCard label="Chuỗi ngày học" value={`${stats?.streakDays ?? 0} ngày`} />
          <StatCard label="Từ vựng đã học" value="Đang cập nhật" />
          <StatCard label="Truyện đã hoàn thành" value={String(stats?.storiesCompleted ?? 0)} />
          <StatCard label="Truyện yêu thích" value={String(stats?.favoritesCount ?? 0)} />
        </div>

        <div className="safe-px mt-6 pb-10">
          <SolidPillButton
            icon={<IconFamily className="h-5 w-5" />}
            label="Đổi bé / Thoát hồ sơ"
            color="white"
            ariaLabel="Đổi sang bé khác"
            onClick={handleSwitchChild}
            className="mx-auto justify-center px-6 py-3 text-slate-500"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-3xl bg-white/90 p-4 text-center shadow-md">
      <p className="font-body text-xs font-semibold text-slate-400">{label}</p>
      <p className="flex items-center justify-center gap-1.5 font-heading text-lg font-bold text-slate-700">
        {icon}
        {value}
      </p>
    </div>
  );
}
