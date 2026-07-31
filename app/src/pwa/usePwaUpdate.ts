import { useSyncExternalStore } from "react";
import { getUpdateAvailable, subscribe } from "@/pwa/updateStore";

export function usePwaUpdateAvailable() {
  return useSyncExternalStore(subscribe, getUpdateAvailable);
}
