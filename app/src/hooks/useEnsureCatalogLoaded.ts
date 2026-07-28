import { useEffect } from "react";
import { useCatalogStore } from "@/store/useCatalogStore";

/** Kicks off the one-time stories/categories fetch; safe to call from multiple pages. */
export function useEnsureCatalogLoaded() {
  const load = useCatalogStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);
}
