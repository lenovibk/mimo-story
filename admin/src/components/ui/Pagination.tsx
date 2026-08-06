import { Button } from "@/components/ui/Button";

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
      <span>
        {total === 0 ? 0 : page * pageSize + 1}–{Math.min(total, (page + 1) * pageSize)} / {total}
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
          Trước
        </Button>
        <Button variant="secondary" size="sm" disabled={(page + 1) * pageSize >= total} onClick={() => onPageChange(page + 1)}>
          Sau
        </Button>
      </div>
    </div>
  );
}
