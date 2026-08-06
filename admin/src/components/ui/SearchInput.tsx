import { MagnifyingGlass } from "@phosphor-icons/react";
import type { InputHTMLAttributes } from "react";

export function SearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        {...props}
        className={`rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-400 ${props.className ?? ""}`}
      />
    </div>
  );
}
