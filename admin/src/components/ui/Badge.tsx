import type { ReactNode } from "react";

type BadgeTone = "success" | "neutral" | "danger" | "info";

const TONE_CLASS: Record<BadgeTone, string> = {
  success: "bg-green-100 text-green-700",
  neutral: "bg-slate-100 text-slate-500",
  danger: "bg-red-100 text-red-600",
  info: "bg-sky-100 text-sky-700",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASS[tone]}`}>{children}</span>;
}
