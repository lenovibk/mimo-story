import type { Icon } from "@phosphor-icons/react";

export function StatCard({ label, value, icon: Icon, tone = "sky" }: { label: string; value: number | string | undefined; icon: Icon; tone?: "sky" | "pink" | "green" | "amber" }) {
  const toneClass = {
    sky: "bg-sky-50 text-sky-600",
    pink: "bg-pink-50 text-pink-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
  }[tone];

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
        <Icon size={22} weight="bold" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-slate-800">{value ?? "…"}</p>
      </div>
    </div>
  );
}
