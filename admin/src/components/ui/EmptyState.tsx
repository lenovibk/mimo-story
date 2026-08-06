import type { Icon } from "@phosphor-icons/react";

export function EmptyState({ icon: Icon, title, description }: { icon: Icon; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
      <Icon size={32} className="text-slate-300" />
      <p className="font-medium text-slate-600">{title}</p>
      {description && <p className="text-sm text-slate-400">{description}</p>}
    </div>
  );
}
