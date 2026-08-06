import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconCheck, IconX } from "@/components/Icon/Icon";
import { VocabFlashcard } from "@/components/Vocabulary/VocabFlashcard";
import type { GrammarPoint, VocabItem } from "@/types";

interface VocabDeckProps {
  vocab: VocabItem[];
  grammar: GrammarPoint[];
  isKnown: (vocabId: string) => boolean;
  onToggleKnown: (vocabId: string) => void;
  onClose: () => void;
}

/** Full lesson review panel for a story - every vocab word (tap to open its flashcard) plus
 * the grammar points, so a child can browse the whole lesson instead of only catching words
 * as they scroll by in the dialogue. Opened from the player's "Từ vựng" floating button. */
export function VocabDeck({ vocab, grammar, isKnown, onToggleKnown, onClose }: VocabDeckProps) {
  const [openVocabId, setOpenVocabId] = useState<string | null>(null);
  const openItem = vocab.find((v) => v.id === openVocabId) ?? null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex flex-col bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="mt-auto flex max-h-[80vh] flex-col rounded-t-[32px] bg-white px-6 pt-5 pb-[max(1.25rem,var(--safe-b))] shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="font-heading text-xl font-extrabold text-[#5CC8FF]">Từ vựng & Ngữ pháp</p>
          <button type="button" onClick={onClose} aria-label="Đóng" className="text-slate-300 hover:text-slate-500">
            <IconX className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {vocab.length === 0 && grammar.length === 0 ? (
            <p className="py-8 text-center font-heading text-sm text-slate-400">Bài học này chưa có từ vựng/ngữ pháp.</p>
          ) : (
            <>
              {vocab.length > 0 && (
                <div className="mb-5">
                  <p className="mb-2 font-heading text-sm font-bold text-slate-500">Từ vựng ({vocab.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {vocab.map((v) => {
                      const known = isKnown(v.id);
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setOpenVocabId(v.id)}
                          className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 font-heading text-sm font-bold ${
                            known ? "bg-[#8EE28E]/20 text-[#3F9142]" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {known && <IconCheck className="h-3.5 w-3.5" />}
                          {v.word}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {grammar.length > 0 && (
                <div>
                  <p className="mb-2 font-heading text-sm font-bold text-slate-500">Ngữ pháp ({grammar.length})</p>
                  <div className="flex flex-col gap-2.5">
                    {grammar.map((g) => (
                      <div key={g.id} className="rounded-2xl bg-[#5B4B9A]/8 px-4 py-3 text-left">
                        <p className="font-heading text-sm font-bold text-[#5B4B9A]">{g.title}</p>
                        {g.structure && <p className="mt-0.5 font-mono text-xs text-slate-500">{g.structure}</p>}
                        <p className="mt-1 text-xs text-slate-500">{g.explanationVi}</p>
                        <p className="mt-1.5 font-heading text-xs font-semibold text-slate-700">{g.exampleEn}</p>
                        <p className="text-xs text-slate-400">{g.exampleVi}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {openItem && (
          <VocabFlashcard
            item={openItem}
            known={isKnown(openItem.id)}
            onClose={() => setOpenVocabId(null)}
            onToggleKnown={() => onToggleKnown(openItem.id)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
