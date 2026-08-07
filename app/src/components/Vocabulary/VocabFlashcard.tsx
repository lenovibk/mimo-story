import { motion } from "framer-motion";
import { SolidPillButton } from "@/components/Button/Button";
import { IconCheck, IconStar, IconX } from "@/components/Icon/Icon";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/translate";
import type { VocabItem } from "@/types";

const PART_OF_SPEECH_KEYS: Record<string, TranslationKey> = {
  noun: "vocab.posNoun",
  verb: "vocab.posVerb",
  adjective: "vocab.posAdjective",
  adverb: "vocab.posAdverb",
  phrase: "vocab.posPhrase",
};

interface VocabFlashcardProps {
  item: VocabItem;
  known: boolean;
  onClose: () => void;
  onToggleKnown: () => void;
}

/** Tap-to-check flashcard for one vocab word - meaning + example, self-marked "Đã thuộc"
 * (no auto-graded quiz, per the flashcard-style check the lesson panel uses). */
export function VocabFlashcard({ item, known, onClose, onToggleKnown }: VocabFlashcardProps) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0, rotateY: -20 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        exit={{ scale: 0.7, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-sm flex-col items-center gap-3 rounded-[32px] bg-white px-7 py-7 text-center shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("vocab.closeAriaLabel")}
          className="absolute top-4 right-4 text-slate-300 hover:text-slate-500"
        >
          <IconX className="h-5 w-5" />
        </button>

        {item.imageUrl && (
          <img src={item.imageUrl} alt="" className="h-20 w-20 rounded-2xl object-cover shadow-sm" />
        )}

        <div>
          <p className="font-heading text-3xl font-extrabold text-[#5CC8FF]">{item.word}</p>
          <div className="mt-1 flex items-center justify-center gap-2 text-sm text-slate-400">
            {item.phonetic && <span className="font-heading">{item.phonetic}</span>}
            {item.partOfSpeech && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">
                {item.partOfSpeech in PART_OF_SPEECH_KEYS ? t(PART_OF_SPEECH_KEYS[item.partOfSpeech]) : item.partOfSpeech}
              </span>
            )}
          </div>
        </div>

        <p className="font-heading text-lg font-bold text-slate-700">{item.meaningVi}</p>

        <div className="w-full rounded-2xl bg-[#5CC8FF]/10 px-4 py-3 text-left">
          <p className="font-heading text-sm font-semibold text-slate-700">{item.exampleEn}</p>
          <p className="mt-0.5 font-body text-sm text-slate-500">{item.exampleVi}</p>
        </div>

        <button
          type="button"
          onClick={onToggleKnown}
          aria-pressed={known}
          className={`mt-1 flex items-center gap-2 rounded-full px-6 py-3 font-heading text-base font-bold shadow-md shadow-black/10 transition-colors ${
            known ? "bg-[#8EE28E] text-white" : "bg-slate-100 text-slate-500"
          }`}
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
              known ? "border-white bg-white/20" : "border-slate-300"
            }`}
          >
            {known && <IconCheck className="h-4 w-4" />}
          </span>
          {known ? t("vocab.markedKnown") : t("vocab.markKnown")}
        </button>
        {known && (
          <p className="flex items-center gap-1 font-heading text-sm font-bold text-[#FFD54A]">
            {t("vocab.starsEarned")} <IconStar className="h-4 w-4" />
          </p>
        )}

        <SolidPillButton
          label={t("vocab.closeLabel")}
          color="primary"
          ariaLabel={t("vocab.closeCardAriaLabel")}
          onClick={onClose}
          className="mt-1 px-8 py-3"
        />
      </motion.div>
    </motion.div>
  );
}
