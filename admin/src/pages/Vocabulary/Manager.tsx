import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BookOpen, Books } from "@phosphor-icons/react";
import { api } from "@/services/api";
import type { Story } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { parseSrt, type SubtitleCue } from "@/utils/srtParser";
import { VocabTab } from "@/pages/Vocabulary/VocabTab";
import { GrammarTab } from "@/pages/Vocabulary/GrammarTab";

const TABS = [
  { key: "vocab", label: "Từ vựng", icon: BookOpen },
  { key: "grammar", label: "Ngữ pháp", icon: Books },
] as const;

/**
 * Per-story CMS for the "Từ vựng" / "Ngữ pháp" lesson panels the app shows during/after
 * playback. Each item can optionally anchor to a specific line of the story's EN subtitle
 * (parsed client-side here) so the app can highlight/jump to that moment - see VocabItem/
 * GrammarPoint in schema.prisma for the data model rationale.
 */
export function VocabularyManager() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [story, setStory] = useState<Story | null>(null);
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("vocab");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const s = await api.getStory(id);
        if (!s) throw new Error("not_found");
        if (cancelled) return;
        setStory(s);
        if (s.subtitleEnUrl) {
          const { content } = await api.getSubtitle(id, "en");
          if (!cancelled) setCues(parseSrt(content));
        }
      } catch {
        if (!cancelled) toast.error("Không tải được bài học hoặc phụ đề.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <Spinner />;
  if (!id || !story) return <p className="text-slate-500">Không tìm thấy bài học.</p>;

  return (
    <div>
      <PageHeader title={`Từ vựng & Ngữ pháp - ${story.title}`} backTo={`/stories/${id}`} />

      {!story.subtitleEnUrl && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          Bài học này chưa có phụ đề Anh - vẫn có thể thêm từ vựng/ngữ pháp nhưng sẽ không gắn được với câu thoại cụ thể.
        </p>
      )}

      <div className="mb-4 flex gap-2 border-b border-slate-200">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-semibold ${
                tab === t.key ? "border-sky-600 text-sky-700" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon size={16} weight="bold" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "vocab" ? <VocabTab storyId={id} cues={cues} /> : <GrammarTab storyId={id} cues={cues} />}
    </div>
  );
}
