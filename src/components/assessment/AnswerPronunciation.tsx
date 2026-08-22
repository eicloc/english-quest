import { IpaPair } from "@/components/dictionary/DualIpa";
import { getQuestPronunciation } from "@/content/quest-pronunciations";

export function AnswerPronunciation({ word, correct = false }: { word: string; correct?: boolean }) {
  const pronunciation = getQuestPronunciation(word);
  return (
    <div className={`mt-3 rounded-xl px-2.5 py-2 ${correct ? "bg-emerald-100/80" : "bg-white/80"}`} data-pronunciation-word={word}>
      <span className={`block text-[11px] font-black ${correct ? "text-emerald-700" : "text-slate-500"}`}>{correct ? "正确关键词" : "所选关键词"} · {word}</span>
      <IpaPair word={word} pronunciation={pronunciation} compact />
    </div>
  );
}
