import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";

interface ConfirmState {
  message: string;
  confirmLabel?: string;
  resolve: (value: boolean) => void;
}

/**
 * Promise-based replacement for window.confirm() so destructive actions get a
 * styled dialog instead of the browser's native prompt. Usage:
 *   const { confirm, dialog } = useConfirmDialog();
 *   if (!(await confirm("Xoá bài học này?"))) return;
 *   ...
 *   return <>{dialog}...</>
 */
export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((message: string, confirmLabel?: string) => {
    return new Promise<boolean>((resolve) => setState({ message, confirmLabel, resolve }));
  }, []);

  const dialog = state ? (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-6"
      onClick={() => {
        state.resolve(false);
        setState(null);
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm text-slate-700">{state.message}</p>
        <div className="mt-5 flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              state.resolve(false);
              setState(null);
            }}
          >
            Huỷ
          </Button>
          <Button
            variant="danger-solid"
            onClick={() => {
              state.resolve(true);
              setState(null);
            }}
          >
            {state.confirmLabel ?? "Xoá"}
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, dialog };
}
