import type { ReactNode } from "react";
import { Button } from "./Button";

interface BulkActionsBarProps {
  count: number;
  onClear: () => void;
  children: ReactNode;
}

/** Sticky-feeling toolbar shown above a list's table once at least one row is checked. */
export function BulkActionsBar({ count, onClear, children }: BulkActionsBarProps) {
  if (count === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5">
      <span className="text-sm font-semibold text-sky-800">Đã chọn {count}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
      <button type="button" onClick={onClear} className="ml-auto text-sm font-medium text-slate-500 hover:underline">
        Bỏ chọn
      </button>
    </div>
  );
}

interface HeaderCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export function RowCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
    />
  );
}

export function HeaderCheckbox({ checked, onChange, disabled }: HeaderCheckboxProps) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400 disabled:opacity-40"
    />
  );
}

export function BulkActionButton({ onClick, variant = "secondary", children, disabled }: { onClick: () => void; variant?: "secondary" | "danger"; children: ReactNode; disabled?: boolean }) {
  return (
    <Button type="button" size="sm" variant={variant} onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  );
}
