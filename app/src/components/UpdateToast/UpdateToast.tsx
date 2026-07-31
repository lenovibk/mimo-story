import { AnimatePresence, motion } from "framer-motion";
import { applyUpdate } from "@/pwa/updateStore";
import { usePwaUpdateAvailable } from "@/pwa/usePwaUpdate";

export function UpdateToast() {
  const updateAvailable = usePwaUpdateAvailable();

  return (
    <AnimatePresence>
      {updateAvailable && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]"
        >
          <div className="flex items-center gap-3 rounded-full bg-[#5CC8FF] py-2.5 pr-2.5 pl-5 shadow-lg shadow-black/20">
            <p className="font-heading text-sm font-semibold text-white">Có phiên bản mới!</p>
            <button
              type="button"
              onClick={applyUpdate}
              className="no-select rounded-full bg-white px-4 py-2 font-heading text-sm font-bold text-[#5CC8FF] shadow-sm"
            >
              Cập nhật ngay
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
