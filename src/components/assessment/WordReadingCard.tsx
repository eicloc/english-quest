"use client";

import { Eye } from "lucide-react";
import type { ManualScore, WordReadingScores } from "@/features/assessment/types";
import { DualAccentAudioButtons } from "@/components/speech/DualAccentAudioButtons";
import { DualIpa } from "@/components/dictionary/DualIpa";
import { ManualScoreButtons } from "./ManualScoreButtons";

export function WordReadingCard({ word, scores, answerRevealed, soundEnabled, onScore, onReveal }: { word: string; scores?: WordReadingScores; answerRevealed: boolean; soundEnabled: boolean; onScore: (field: keyof WordReadingScores, score: ManualScore) => void; onReveal: () => void }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-[32px] bg-[#24324A] px-6 py-10 text-white shadow-xl"><p className="text-sm font-black uppercase tracking-[0.2em] text-blue-200">Magic word</p><div className="mt-3 text-6xl font-black tracking-wide sm:text-8xl">{word}</div><div className="mt-4"><DualIpa word={word} /></div></div>
      <p className="mt-4 font-bold text-slate-500">先请孩子读出单词并说说意思，回答前不会自动播放。</p>
      <div className="mt-6 grid gap-4 text-left md:grid-cols-2"><ManualScoreButtons label="发音表现" value={scores?.pronunciation} onChange={(score) => onScore("pronunciation", score)} /><ManualScoreButtons label="词义理解" value={scores?.meaning} onChange={(score) => onScore("meaning", score)} /></div>
      {!answerRevealed && <button type="button" onClick={onReveal} className="game-button mt-5 inline-flex items-center gap-2 bg-blue-50 px-5 text-[#356FD1]"><Eye className="size-4" />显示标准读音</button>}
      {answerRevealed && <div className="mt-5"><DualAccentAudioButtons text={word} enabled={soundEnabled} purpose="word" /></div>}
    </div>
  );
}
