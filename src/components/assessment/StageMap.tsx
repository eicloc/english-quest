"use client";

import { Check, LockKeyhole, Play, Star } from "lucide-react";
import { stages, treasureStage } from "@/content/stages";
import type { AssessmentSession } from "@/features/assessment/types";

export function StageMap({ session, onSelect }: { session: AssessmentSession; onSelect: (stageId: string) => void }) {
  const allStages = [...stages, treasureStage];
  return (
    <section className="paper-panel mx-auto w-full max-w-5xl rounded-[32px] p-5 sm:p-8" aria-labelledby="map-title">
      <div className="text-center"><span className="text-4xl" aria-hidden="true">🗺️</span><h1 id="map-title" className="mt-2 text-3xl font-black sm:text-4xl">Adventure Map</h1><p className="mt-2 font-bold text-slate-500">选择下一站，继续英语冒险</p></div>
      <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {allStages.map((stage) => {
          const playable = stage.id !== "treasure" && stage.enabledInModes.includes(session.mode);
          const completed = session.completedStageIds.includes(stage.id);
          const current = session.currentStageId === stage.id && !completed;
          const teacherCanJump = session.mode === "teacher-led" && playable;
          const selfCanOpen = playable && (current || completed);
          const canOpen = teacherCanJump || selfCanOpen;
          const isTreasure = stage.id === "treasure";
          return (
            <li key={stage.id}>
              <button type="button" disabled={!canOpen} onClick={() => canOpen && onSelect(stage.id)} className={`group relative flex min-h-40 w-full flex-col items-start overflow-hidden rounded-[24px] border-2 p-4 text-left transition ${current ? "border-[#4F8EF7] bg-white shadow-lg ring-4 ring-blue-100" : completed ? "border-emerald-200 bg-emerald-50" : "border-transparent bg-white/65 disabled:opacity-55"}`}>
                <span className="absolute -right-4 -top-5 text-7xl opacity-15" aria-hidden="true">{stage.icon}</span>
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Level {stage.order}</span>
                <span className="mt-3 text-3xl" aria-hidden="true">{stage.icon}</span>
                <strong className="mt-3 text-base">{stage.title}</strong><span className="text-sm font-bold text-slate-500">{stage.titleZh}</span>
                <span className="ml-auto mt-auto grid size-8 place-items-center rounded-full bg-white shadow-sm">{completed ? <Check className="size-4 text-emerald-600" /> : current ? <Play className="size-4 fill-[#4F8EF7] text-[#4F8EF7]" /> : isTreasure ? <Star className="size-4 text-amber-500" /> : <LockKeyhole className="size-4 text-slate-400" />}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
