import { useEffect, useState } from "react";
import { api } from "@/services/api";

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

  const cards: { label: string; value: number | undefined }[] = [
    { label: "Truyện", value: stats?.storyCount },
    { label: "Chủ đề", value: stats?.categoryCount },
    { label: "Người dùng", value: stats?.userCount },
    { label: "Quảng cáo đang chạy", value: stats?.activeAdCount },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Tổng quan</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-800">{c.value ?? "…"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
