import { formatCueTime, type SubtitleCue } from "@/utils/srtParser";

interface CuePickerProps {
  cues: SubtitleCue[];
  /** Currently selected cue's start time, or "" for none. */
  value: number | "";
  onChange: (cue: SubtitleCue | null) => void;
}

/** Dropdown of a story's EN subtitle lines ("0:12 - Look, a butterfly!") used to anchor a
 * vocab word or grammar point to the moment it's spoken. */
export function CuePicker({ cues, value, onChange }: CuePickerProps) {
  return (
    <select
      value={value}
      onChange={(e) => {
        const start = e.target.value === "" ? null : Number(e.target.value);
        onChange(start === null ? null : (cues.find((c) => c.start === start) ?? null));
      }}
      disabled={cues.length === 0}
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400"
    >
      <option value="">(Không gắn với câu thoại cụ thể)</option>
      {cues.map((c) => (
        <option key={c.start} value={c.start}>
          {formatCueTime(c.start)} - {c.text}
        </option>
      ))}
    </select>
  );
}

/** Renders a cue's text as individually-clickable words, so an editor can pick the exact
 * word to turn into a vocab entry instead of retyping it. */
export function WordPicker({ text, onPick }: { text: string; onPick: (word: string) => void }) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-slate-50 p-2">
      {words.map((w, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onPick(w.replace(/[.,!?;:"']/g, ""))}
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-600 hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
        >
          {w}
        </button>
      ))}
    </div>
  );
}
