import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";

export function PageHeader({ title, backTo, actions }: { title: string; backTo?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {backTo && (
          <Link to={backTo} className="text-slate-400 hover:text-sky-600">
            <ArrowLeft size={20} />
          </Link>
        )}
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
