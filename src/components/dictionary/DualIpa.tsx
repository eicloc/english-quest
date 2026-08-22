"use client";

import { useDictionaryEntry } from "@/features/dictionary/use-dictionary-entry";
import { getQuestPronunciation, type QuestPronunciation } from "@/content/quest-pronunciations";

export function DualIpa({ word, compact = false }: { word: string; compact?: boolean }) {
  const immediate = getQuestPronunciation(word);
  const entry = useDictionaryEntry(immediate ? "" : word);
  const pronunciation = immediate ?? entry;
  return <IpaPair word={word} pronunciation={pronunciation} compact={compact} />;
}

export function IpaPair({ word, pronunciation, compact = false }: { word: string; pronunciation?: QuestPronunciation; compact?: boolean }) {
  const className = compact ? "text-xs" : "text-sm";
  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-bold text-slate-400 ${className}`} aria-label={`${word} 的英美音标`}>
      <span><b className="text-[#356FD1]">US</b> {pronunciation?.ipaUS ?? "暂无音标"}</span>
      <span><b className="text-violet-600">UK</b> {pronunciation?.ipaUK ?? "暂无音标"}</span>
    </div>
  );
}
