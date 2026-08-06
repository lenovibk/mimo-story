import { useEffect, useState } from "react";
import { BookOpen, Megaphone, Tag, Users } from "@phosphor-icons/react";
import { api } from "@/services/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";

interface Stats {
  storyCount: number;
  categoryCount: number;
  userCount: number;
  activeAdCount: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.getDashboard().then(setStats).catch(() => {});
  }, []);

  return (
    <div>
      <PageHeader title="Tổng quan" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Bài học" value={stats?.storyCount} icon={BookOpen} tone="sky" />
        <StatCard label="Chủ đề" value={stats?.categoryCount} icon={Tag} tone="pink" />
        <StatCard label="Người dùng" value={stats?.userCount} icon={Users} tone="green" />
        <StatCard label="Quảng cáo đang chạy" value={stats?.activeAdCount} icon={Megaphone} tone="amber" />
      </div>
    </div>
  );
}
