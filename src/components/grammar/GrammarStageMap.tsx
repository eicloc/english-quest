"use client";

import { Check, LockKeyhole, Play, Star } from "lucide-react";
import { grammarStages } from "@/content/grammar/stages";
import { scoreGrammarAttempt } from "@/features/grammar/scoring";
import type { GrammarSession } from "@/features/grammar/types";

export function GrammarStageMap({ session, onSelect }: { session: GrammarSession; onSelect: (stageId: string) => void }) {
  return (
    <section className="paper-panel mx-auto w-full max-w-6xl rounded-[32px] p-5 sm:p-8" aria-labelledby="grammar-map-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-black uppercase tracking-[0.16em] text-violet-600">Grammar Galaxy</p><h1 id="grammar-map-title" className="mt-1 text-3xl font-black">选择下一颗语法星球</h1></div><p className="font-bold text-slate-500">完成即可继续 · 80% 为掌握线</p></div>
      <ol className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {grammarStages.map((stage) => {
          const completed = session.completedStageIds.includes(stage.id);
          const current = session.currentStageId === stage.id && !completed;
          const canOpen = current || completed;
          const stageAttempts = session.attempts.filter((attempt) => session.questionOrder[stage.id]?.includes(attempt.questionId) && attempt.completedAt);
          const percentage = stageAttempts.length ? Math.round(stageAttempts.reduce((sum, attempt) => sum + scoreGrammarAttempt(attempt), 0) / (stageAttempts.length * 2) * 100) : undefined;
          return <li key={stage.id}><button type="button" disabled={!canOpen} onClick={() => canOpen && onSelect(stage.id)} className={`group relative flex min-h-44 w-full flex-col items-start overflow-hidden rounded-[24px] border-2 p-4 text-left transition ${current ? "border-violet-400 bg-white shadow-lg ring-4 ring-violet-100" : completed ? "border-emerald-200 bg-emerald-50" : "border-transparent bg-white/60 opacity-55"}`}><span className="absolute -right-4 -top-5 text-7xl opacity-15">{stage.icon}</span><span className="text-xs font-black uppercase tracking-widest text-slate-400">Level {stage.order}</span><span className="mt-3 text-3xl">{stage.icon}</span><strong className="mt-2">{stage.titleZh}</strong><span className="text-xs font-bold text-slate-500">{stage.description}</span><span className="mt-auto flex w-full items-end justify-between pt-3">{percentage !== undefined ? <span className={`text-xs font-black ${percentage >= 80 ? "text-emerald-700" : "text-amber-700"}`}>{percentage >= 80 ? "已掌握" : "待巩固"} · {percentage}%</span> : <span />}{completed ? <Check className="size-5 text-emerald-600" /> : current ? <Play className="size-5 fill-violet-600 text-violet-600" /> : <LockKeyhole className="size-5 text-slate-400" />}</span></button></li>;
        })}
        <li><div className={`flex min-h-44 flex-col rounded-[24px] border-2 border-dashed p-4 ${session.completedStageIds.length === grammarStages.length ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white/40 opacity-60"}`}><span className="text-xs font-black uppercase tracking-widest text-slate-400">Review</span><span className="mt-3 text-3xl">⛽</span><strong className="mt-2">错题加油站</strong><span className="text-xs font-bold text-slate-500">主线结束后自动整理</span><Star className="ml-auto mt-auto size-5 text-amber-500" /></div></li>
      </ol>
    </section>
  );
}
