"use client";

import { ArrowLeft, ArrowRight, Bug, ChevronDown, Eye, Flag, Lightbulb, Map, Pause, Redo2, RotateCcw, Settings2, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import type { AssessmentQuestion, AssessmentSession, ManualScore, QuestionAttempt } from "@/features/assessment/types";
import { ManualScoreButtons } from "@/components/assessment/ManualScoreButtons";
import type { Accent } from "@/hooks/useSpeech";

export function TeacherControlPanel({ session, question, attempt, questionNumber, totalQuestions, onPrevious, onNext, onSkip, onRetry, onReplay, onToggleHint, onReveal, onToggleDebug, onToggleSound, onToggleMotion, onPause, onMap, onEnd, onNote, onManualScore }: { session: AssessmentSession; question?: AssessmentQuestion; attempt?: QuestionAttempt; questionNumber: number; totalQuestions: number; onPrevious: () => void; onNext: () => void; onSkip: () => void; onRetry: () => void; onReplay: (accent: Accent) => void; onToggleHint: () => void; onReveal: () => void; onToggleDebug: () => void; onToggleSound: () => void; onToggleMotion: () => void; onPause: () => void; onMap: () => void; onEnd: () => void; onNote: (note: string) => void; onManualScore?: (score: ManualScore) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <aside className="no-print fixed inset-x-3 bottom-3 z-40 rounded-[24px] border border-blue-100 bg-white/95 p-3 shadow-2xl backdrop-blur-xl lg:sticky lg:inset-auto lg:top-4 lg:z-10 lg:max-h-[calc(100vh-2rem)] lg:overflow-auto lg:rounded-[28px] lg:p-5">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl text-left"><span><span className="block text-xs font-black uppercase tracking-widest text-[#4F8EF7]">Teacher deck</span><strong className="block text-lg">老师控制台</strong></span><span className="flex items-center gap-2 text-sm font-bold text-slate-500">{questionNumber}/{totalQuestions}<ChevronDown className={`size-5 transition ${open ? "rotate-180" : ""}`} /></span></button>
      <div className="mt-3 grid grid-cols-2 gap-2"><ControlButton onClick={onPrevious} icon={<ArrowLeft />} label="上一题" disabled={questionNumber <= 1} /><ControlButton onClick={onNext} icon={<ArrowRight />} label="下一题" /></div>
      <div className={`${open ? "block" : "hidden lg:block"}`}>
        <div className="mt-2 grid grid-cols-4 gap-2"><ControlButton onClick={onSkip} icon={<SkipForward />} label="跳过" /><ControlButton onClick={onRetry} icon={<Redo2 />} label="重试" disabled={!attempt} /><ControlButton onClick={() => onReplay("en-US")} icon={<Volume2 />} label="US 美音" disabled={!question?.audioText} /><ControlButton onClick={() => onReplay("en-GB")} icon={<Volume2 />} label="UK 英音" disabled={!question?.audioText} /></div>
        <div className="my-4 h-px bg-slate-100" />
        {(question?.type === "oral-manual" || question?.type === "phonics-manual") && onManualScore && <div className="mb-4"><ManualScoreButtons compact value={attempt?.manualScore} onChange={onManualScore} /></div>}
        <div className="grid grid-cols-2 gap-2"><ControlButton active={session.settings.hintVisible} onClick={onToggleHint} icon={<Lightbulb />} label="中文提示" /><ControlButton active={Boolean(attempt?.answerRevealed)} onClick={onReveal} icon={<Eye />} label="显示答案" /><ControlButton active={session.settings.hotspotDebug} onClick={onToggleDebug} icon={<Bug />} label="热点边框" /><ControlButton active={session.settings.soundEnabled} onClick={onToggleSound} icon={session.settings.soundEnabled ? <Volume2 /> : <VolumeX />} label="声音" /></div>
        <label className="mt-4 block text-xs font-black uppercase tracking-wider text-slate-500" htmlFor="teacher-note">本题观察备注</label>
        <textarea id="teacher-note" value={attempt?.note ?? ""} onChange={(event) => onNote(event.target.value.slice(0, 180))} placeholder="例如：dog 发音不稳定…" className="mt-2 min-h-20 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-5 focus:border-blue-300" />
        <div className="mt-3 grid grid-cols-2 gap-2"><ControlButton onClick={onPause} icon={<Pause />} label="暂停" /><ControlButton onClick={onMap} icon={<Map />} label="关卡地图" /><ControlButton active={session.settings.reducedMotion} onClick={onToggleMotion} icon={<Settings2 />} label="减少动画" /><ControlButton onClick={onEnd} icon={<Flag />} label="结束摸底" danger /></div>
        <button type="button" onClick={onRetry} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-50"><RotateCcw className="size-4" />清除本题记录并重新作答</button>
      </div>
    </aside>
  );
}

function ControlButton({ onClick, icon, label, disabled, active, danger }: { onClick: () => void; icon: React.ReactNode; label: string; disabled?: boolean; active?: boolean; danger?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} aria-pressed={active} className={`game-button flex min-h-12 items-center justify-center gap-1.5 px-2 text-xs ${danger ? "bg-rose-50 text-rose-600" : active ? "bg-[#24324A] text-white" : "bg-slate-100 text-slate-600"} disabled:cursor-not-allowed disabled:opacity-40`}>{<span className="[&>svg]:size-4">{icon}</span>}{label}</button>;
}
