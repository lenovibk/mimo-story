import { useMemo, useState } from "react";

/** Checkbox-selection state for a paginated list, keyed by row id. Selection is cleared
 * whenever the visible id set changes (new page/filter) so stale ids from a previous
 * page can't be silently included in a bulk action. */
export function useSelection(visibleIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const visibleKey = visibleIds.join(",");
  useMemo(() => {
    setSelected((prev) => {
      const visible = new Set(visibleIds);
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (visible.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleKey]);

  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(visibleIds));
  };

  const clear = () => setSelected(new Set());

  return { selected, allSelected, someSelected, toggle, toggleAll, clear };
}
