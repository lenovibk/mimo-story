import { CircleNotch } from "@phosphor-icons/react";

export function Spinner({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
      <CircleNotch size={18} className="animate-spin" />
      {label}
    </div>
  );
}
